import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate, methodLabels, entryTypeLabels } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import MemberActions from "@/components/MemberActions";
import VerificationReview from "@/components/VerificationReview";
import AddMemberBalanceEntryForm from "@/components/AddMemberBalanceEntryForm";
import DeleteMemberButton from "@/components/DeleteMemberButton";
import type { Deposit, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: deposits }, { data: balance }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("deposits").select("*").eq("member_id", id).order("submitted_at", { ascending: false }),
    supabase.from("member_balances").select("*").eq("member_id", id).single(),
  ]);

  if (!profile) notFound();

  const p = profile as Profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">{p.full_name}</h2>
          <p className="text-sm text-neutral-500">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p>
          <div className="mt-2 flex gap-2">
            <StatusBadge value={p.status} />
            <StatusBadge value={p.role} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">Approved total</p>
          <p className="text-2xl font-semibold text-neutral-900">
            {formatMoney(balance?.total_approved ?? 0)}
          </p>
          {balance?.total_pending > 0 && (
            <p className="text-xs text-amber-600">
              +{formatMoney(balance.total_pending)} pending review
            </p>
          )}
        </div>
      </div>

      <VerificationReview member={p} />

      <MemberActions memberId={p.id} status={p.status} role={p.role} />

      <AddMemberBalanceEntryForm memberId={p.id} />

      <div>
        <h3 className="mb-3 text-sm font-medium text-neutral-900">Transaction history</h3>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {((deposits ?? []) as Deposit[]).map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(d.submitted_at)}</td>
                  <td className="px-4 py-3 text-neutral-600">{entryTypeLabels[d.entry_type] ?? d.entry_type}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {methodLabels[d.method] ?? d.method}
                    {d.transaction_ref ? ` (${d.transaction_ref})` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={d.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{d.source === "admin" ? "Admin entry" : "Member"}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      d.amount < 0 ? "text-red-600" : "text-neutral-900"
                    }`}
                  >
                    {formatMoney(d.amount)}
                  </td>
                </tr>
              ))}
              {(!deposits || deposits.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteMemberButton memberId={p.id} fullName={p.full_name} />
    </div>
  );
}
