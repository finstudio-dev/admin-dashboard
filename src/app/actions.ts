"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DepositMethod, OrgCategory } from "@/lib/types";

// Every action re-checks admin role server-side via RLS: the Supabase
// client here carries the signed-in admin's session, and every table's
// row-level-security policy already restricts writes to admins (see
// supabase/schema.sql). A non-admin session simply gets a permission error.

export async function approveDeposit(depositId: string, adminNote?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("deposits")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null,
    })
    .eq("id", depositId);

  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: "approve_deposit",
    p_entity_type: "deposit",
    p_entity_id: depositId,
    p_details: null,
  });

  revalidatePath("/pending");
  revalidatePath("/");
  revalidatePath("/members");
}

export async function rejectDeposit(depositId: string, adminNote?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("deposits")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null,
    })
    .eq("id", depositId);

  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: "reject_deposit",
    p_entity_type: "deposit",
    p_entity_id: depositId,
    p_details: null,
  });

  revalidatePath("/pending");
  revalidatePath("/members");
}

export async function addManualDeposit(input: {
  memberId: string;
  amount: number;
  method: DepositMethod;
  note?: string;
  periodMonth?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deposits")
    .insert({
      member_id: input.memberId,
      amount: input.amount,
      method: input.method,
      note: input.note || null,
      status: "approved",
      source: "admin",
      period_month: input.periodMonth || new Date().toISOString().slice(0, 10),
      reviewed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: "add_manual_deposit",
    p_entity_type: "deposit",
    p_entity_id: data.id,
    p_details: { amount: input.amount, member_id: input.memberId },
  });

  revalidatePath(`/members/${input.memberId}`);
  revalidatePath("/");
}

export async function addOrgBalanceEntry(input: {
  amount: number;
  category: OrgCategory;
  description?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("org_balance_entries")
    .insert({
      amount: input.amount,
      category: input.category,
      description: input.description || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: "add_org_balance_entry",
    p_entity_type: "org_balance_entry",
    p_entity_id: data.id,
    p_details: { amount: input.amount, category: input.category },
  });

  revalidatePath("/org-balance");
  revalidatePath("/");
}

export async function setMemberStatus(memberId: string, status: "active" | "suspended") {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", memberId);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: `set_member_status_${status}`,
    p_entity_type: "profile",
    p_entity_id: memberId,
    p_details: null,
  });

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
}

export async function setMemberRole(memberId: string, role: "member" | "admin") {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", memberId);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: `set_member_role_${role}`,
    p_entity_type: "profile",
    p_entity_id: memberId,
    p_details: null,
  });

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
}

// Permanently deletes a member's login AND every record tied to them
// (deposits cascade-delete along with the profile — see schema.sql). This
// bypasses RLS via the service role key, so unlike every other action here
// it must manually re-check that the caller is an admin before doing
// anything. Use this only for someone who should never have existed in the
// system (a mistaken signup, a duplicate account) — for a member who is
// simply leaving the group, prefer setMemberStatus(..., "suspended") so
// their contribution history is preserved.
export async function deleteMember(memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  if (memberId === user.id) {
    throw new Error("You can't delete your own account from here.");
  }

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (caller?.role !== "admin") {
    throw new Error("Only admins can delete a member.");
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", memberId)
    .single();

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(memberId);
  if (error) throw new Error(error.message);

  // The member row (and their deposits, via ON DELETE CASCADE) is already
  // gone at this point, so log the audit entry with a snapshot of who they
  // were rather than relying on a join that would now come back empty.
  await supabase.rpc("log_audit", {
    p_action: "delete_member",
    p_entity_type: "profile",
    p_entity_id: memberId,
    p_details: target ? { full_name: target.full_name, email: target.email } : null,
  });

  revalidatePath("/members");
  // Deliberately not calling redirect() here: this action is invoked from a
  // client component inside a try/catch (so it can show delete errors
  // inline), and redirect() throws internally — if a catch block swallowed
  // that throw, the redirect would silently fail. The calling component
  // navigates back to /members itself once this resolves successfully.
}

export async function getReceiptUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

// Updates the group's display name and/or logo shown in the dashboard
// header and the sign-in page. The logo file itself is uploaded straight
// from the browser to the "branding" storage bucket (see SettingsForm) —
// this action just records the resulting public URL. RLS on org_settings
// already restricts the update to admins, so there's nothing extra to
// check here (unlike deleteMember, this uses the normal session client).
export async function updateOrgSettings(input: { orgName: string; logoUrl?: string | null }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const update: { org_name: string; updated_by: string; updated_at: string; logo_url?: string | null } = {
    org_name: input.orgName,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };
  if (input.logoUrl !== undefined) update.logo_url = input.logoUrl;

  const { error } = await supabase.from("org_settings").update(update).eq("id", true);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: "update_org_settings",
    p_entity_type: "org_settings",
    p_entity_id: null,
    p_details: { org_name: input.orgName },
  });

  revalidatePath("/", "layout");
  revalidatePath("/login");
}
