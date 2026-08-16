import { createClient } from "@/lib/supabase/server";
import TransferFundsForm from "@/components/TransferFundsForm";

export const dynamic = "force-dynamic";

export default async function TransferFundsPage() {
  const supabase = await createClient();

  const [{ data: members }, { data: orgBalance }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("status", "active")
      .eq("role", "member")
      .order("full_name", { ascending: true }),
    supabase.from("org_balance").select("balance").single(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Transfer to Members</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Move money from the organization balance out to selected members — pick everyone or just some, enter
          a total, and it&apos;s split evenly. Only active members can receive a transfer; admin accounts and
          pending/suspended/rejected members don&apos;t show up here.
        </p>
      </div>

      <TransferFundsForm members={members ?? []} orgBalance={orgBalance?.balance ?? 0} />

      <p className="text-xs text-neutral-400">
        This deducts the total from the Organization Balance page and adds each member&apos;s share to their own
        balance, labeled &ldquo;From Organization Fund&rdquo; in their transaction history so it&apos;s clear where it
        came from.
      </p>
    </div>
  );
}
