import { createClient } from "@/lib/supabase/server";
import BulkBalanceEntryForm from "@/components/BulkBalanceEntryForm";

export const dynamic = "force-dynamic";

export default async function BulkBalancePage() {
  const supabase = await createClient();

  const { count: activeMemberCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Bulk Adjust</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Apply the same deposit, withdrawal, bonus, or correction to every active member at once — for
          things like collecting the same monthly dues from the whole group in one go.
        </p>
      </div>

      <BulkBalanceEntryForm activeMemberCount={activeMemberCount ?? 0} />

      <p className="text-xs text-neutral-400">
        This only affects members with an active status — pending, suspended, or rejected accounts are
        skipped. Each member gets their own transaction entry, visible on their individual page, so you
        can still review or reverse it for a single person afterward if needed.
      </p>
    </div>
  );
}
