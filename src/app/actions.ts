"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DepositMethod, EntryType, OrgCategory } from "@/lib/types";

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

// Lets an admin directly adjust a member's balance: add a deposit on their
// behalf (e.g. cash handed over in person), record a withdrawal (money paid
// out to them), give a bonus (extra credit that isn't a real deposit), or
// make a manual correction in either direction. `amount` is always the
// magnitude the admin typed (never negative) — the sign that actually gets
// stored is derived here from entryType (and `direction` for adjustments
// only), so the UI never has to ask a non-technical admin to type a minus
// sign. Every entry an admin adds this way is recorded as already approved.
export async function addMemberBalanceEntry(input: {
  memberId: string;
  entryType: EntryType;
  amount: number;
  direction?: "add" | "subtract";
  method: DepositMethod;
  note?: string;
  periodMonth?: string;
}) {
  const supabase = await createClient();

  const magnitude = Math.abs(input.amount);
  if (!magnitude) throw new Error("Enter a non-zero amount.");

  let signedAmount = magnitude;
  if (input.entryType === "withdrawal") {
    signedAmount = -magnitude;
  } else if (input.entryType === "adjustment") {
    signedAmount = input.direction === "subtract" ? -magnitude : magnitude;
  }
  // deposit and bonus always stay positive

  const { data, error } = await supabase
    .from("deposits")
    .insert({
      member_id: input.memberId,
      amount: signedAmount,
      method: input.method,
      note: input.note || null,
      status: "approved",
      source: "admin",
      entry_type: input.entryType,
      period_month: input.periodMonth || new Date().toISOString().slice(0, 10),
      reviewed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: `add_member_balance_entry_${input.entryType}`,
    p_entity_type: "deposit",
    p_entity_id: data.id,
    p_details: { amount: signedAmount, member_id: input.memberId, entry_type: input.entryType },
  });

  revalidatePath(`/members/${input.memberId}`);
  revalidatePath("/");
}

// Same idea as addMemberBalanceEntry, but applies the identical entry to
// every currently-active member at once — e.g. collecting the same monthly
// dues from everyone, or giving the whole group the same bonus. Only
// touches status='active' members with role='member' — pending/suspended/
// rejected accounts are skipped since they shouldn't be accruing balance
// changes, and admin accounts are skipped because they exist to run the
// club, not to hold a balance in it (an admin can still be adjusted
// individually from their own member page if that's ever genuinely wanted).
// Returns how many members were affected so the UI can confirm it.
export async function addBulkMemberBalanceEntry(input: {
  entryType: EntryType;
  amount: number;
  direction?: "add" | "subtract";
  method: DepositMethod;
  note?: string;
  periodMonth?: string;
}) {
  const supabase = await createClient();

  const magnitude = Math.abs(input.amount);
  if (!magnitude) throw new Error("Enter a non-zero amount.");

  let signedAmount = magnitude;
  if (input.entryType === "withdrawal") {
    signedAmount = -magnitude;
  } else if (input.entryType === "adjustment") {
    signedAmount = input.direction === "subtract" ? -magnitude : magnitude;
  }

  const { data: activeMembers, error: fetchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("status", "active")
    .eq("role", "member");
  if (fetchError) throw new Error(fetchError.message);
  if (!activeMembers || activeMembers.length === 0) {
    throw new Error("No active members to apply this to.");
  }

  const periodMonth = input.periodMonth || new Date().toISOString().slice(0, 10);
  const reviewedAt = new Date().toISOString();

  const { error } = await supabase.from("deposits").insert(
    activeMembers.map((m) => ({
      member_id: m.id,
      amount: signedAmount,
      method: input.method,
      note: input.note || null,
      status: "approved",
      source: "admin",
      entry_type: input.entryType,
      period_month: periodMonth,
      reviewed_at: reviewedAt,
    }))
  );
  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: `bulk_add_balance_entry_${input.entryType}`,
    p_entity_type: "deposit",
    p_entity_id: null,
    p_details: { amount: signedAmount, entry_type: input.entryType, member_count: activeMembers.length },
  });

  revalidatePath("/members");
  revalidatePath("/");

  return { memberCount: activeMembers.length };
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

// Permanently removes an organization balance entry — e.g. a demo/test
// entry added while trying the dashboard out. Unlike a member's deposit
// history, this is a straight delete with no separate "reverse it" pattern,
// since org balance entries are already meant to be typed in and corrected
// directly by an admin. The row (and its effect on the org balance total)
// is gone immediately; there's no undo, so the confirmation happens in the
// UI before this is ever called.
export async function deleteOrgBalanceEntry(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: target } = await supabase
    .from("org_balance_entries")
    .select("amount, category, description")
    .eq("id", entryId)
    .single();

  const { error } = await supabase.from("org_balance_entries").delete().eq("id", entryId);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: "delete_org_balance_entry",
    p_entity_type: "org_balance_entry",
    p_entity_id: entryId,
    p_details: target ?? null,
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

// Approves a member's submitted identity verification (or, if they haven't
// submitted one yet, lets an admin activate them anyway at their own
// discretion). Sets status to 'active' and records who reviewed it and when.
export async function approveMemberVerification(memberId: string, note?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("profiles")
    .update({
      status: "active",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
    })
    .eq("id", memberId);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: "approve_member_verification",
    p_entity_type: "profile",
    p_entity_id: memberId,
    p_details: null,
  });

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  revalidatePath("/verifications");
  revalidatePath("/");
}

// Rejects a member's submitted identity verification. They stay in the
// system with status 'rejected' (nothing is deleted) and can resubmit their
// verification info themselves from the app, which returns them to
// 'pending' for another review — see enforce_profile_self_update_limits()
// in schema.sql for exactly what that resubmission is allowed to change.
export async function rejectMemberVerification(memberId: string, note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  if (!note.trim()) {
    throw new Error("Please explain why you're rejecting this, the member will see this note.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: note.trim(),
    })
    .eq("id", memberId);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_audit", {
    p_action: "reject_member_verification",
    p_entity_type: "profile",
    p_entity_id: memberId,
    p_details: { reason: note.trim() },
  });

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  revalidatePath("/verifications");
}

export async function getVerificationPhotoUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("verification")
    .createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
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
