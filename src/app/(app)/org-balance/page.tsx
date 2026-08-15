import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate, categoryLabels } from "@/lib/format";
import AddOrgEntryForm from "@/components/AddOrgEntryForm";
import DeleteOrgEntryButton from "@/components/DeleteOrgEntryButton";
import type { OrgBalanceEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrgBalancePage() {
  const supabase = await createClient();

  const [{ data: balance }, { data: entries }] = await Promise.all([
    supabase.from("org_balance").select("balance").single(),
    supabase
      .from("org_balance_entries")
      .select("*, profiles!org_balance_entries_created_by_fkey(full_name)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Organization Balance</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Separate from member deposits — late fees, membership fees, and spend on group upgrades.
        </p>
        <p className="mt-3 text-2xl font-semibold text-neutral-900">{formatMoney(balance?.balance ?? 0)}</p>
      </div>

      <AddOrgEntryForm />

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Added by</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {((entries ?? []) as OrgBalanceEntry[]).map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-neutral-600">{formatDate(e.created_at)}</td>
                <td className="px-4 py-3 text-neutral-600">{categoryLabels[e.category] ?? e.category}</td>
                <td className="px-4 py-3 text-neutral-600">{e.description ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-500">{e.profiles?.full_name ?? "—"}</td>
                <td
                  className={`px-4 py-3 text-right font-medium ${
                    e.amount < 0 ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {formatMoney(e.amount)}
                </td>
                <td className="px-4 py-3">
                  <DeleteOrgEntryButton entryId={e.id} />
                </td>
              </tr>
            ))}
            {(!entries || entries.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
