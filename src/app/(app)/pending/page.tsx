import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate, methodLabels } from "@/lib/format";
import ReviewActions from "@/components/ReviewActions";
import type { Deposit } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const supabase = await createClient();

  const { data: deposits, error } = await supabase
    .from("deposits")
    .select("*, profiles!deposits_member_id_fkey(full_name, email, phone)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Pending Deposits</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Review what members submitted before it counts toward their balance.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {!error && (!deposits || deposits.length === 0) && (
        <p className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          Nothing waiting for review right now.
        </p>
      )}

      <div className="space-y-3">
        {(deposits as unknown as Deposit[] | null)?.map((d) => (
          <div
            key={d.id}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <p className="font-medium text-neutral-900">
                {d.profiles?.full_name}{" "}
                <span className="font-normal text-neutral-400">({d.profiles?.email})</span>
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">{formatMoney(d.amount)}</p>
              <p className="text-sm text-neutral-500">
                {methodLabels[d.method] ?? d.method}
                {d.transaction_ref ? ` · Ref: ${d.transaction_ref}` : ""}
              </p>
              {d.note && <p className="mt-1 text-sm text-neutral-600">&ldquo;{d.note}&rdquo;</p>}
              <p className="mt-1 text-xs text-neutral-400">Submitted {formatDate(d.submitted_at)}</p>
            </div>
            <div className="w-full sm:w-64">
              <ReviewActions depositId={d.id} receiptUrl={d.receipt_url} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
