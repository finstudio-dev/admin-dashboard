import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

export default async function OverviewPage() {
  const supabase = await createClient();

  const [{ data: fundTotal }, { data: orgBalance }, { count: pendingCount }, { data: activeMembers }] =
    await Promise.all([
      supabase.from("fund_total").select("balance").single(),
      supabase.from("org_balance").select("balance").single(),
      supabase.from("deposits").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("*").eq("status", "active").eq("role", "member"),
    ]);

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  const periodMonth = currentMonthStart.toISOString().slice(0, 10);

  const { data: paidThisMonth } = await supabase
    .from("monthly_contributions")
    .select("member_id")
    .eq("period_month", periodMonth);

  const paidIds = new Set((paidThisMonth ?? []).map((r) => r.member_id));
  const unpaidMembers = ((activeMembers ?? []) as Profile[]).filter((m) => !paidIds.has(m.id));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Overview</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Snapshot of the group fund as of today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Fund (approved deposits)" value={formatMoney(fundTotal?.balance ?? 0)} />
        <StatCard label="Organization Balance" value={formatMoney(orgBalance?.balance ?? 0)} sub="Late fees, membership fees, upgrades" />
        <StatCard
          label="Pending Deposits"
          value={String(pendingCount ?? 0)}
          sub={pendingCount ? "Needs your review" : "All caught up"}
        />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-neutral-900">
            Not yet paid this month ({currentMonthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })})
          </h3>
          <Link href="/members" className="text-sm text-neutral-500 hover:text-neutral-900">
            View all members →
          </Link>
        </div>
        {unpaidMembers.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Everyone active has paid this month. 🎉</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100">
            {unpaidMembers.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/members/${m.id}`} className="text-neutral-800 hover:underline">
                  {m.full_name}
                </Link>
                <span className="text-neutral-400">{m.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingCount ? (
        <Link
          href="/pending"
          className="block rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          You have {pendingCount} deposit{pendingCount === 1 ? "" : "s"} waiting for review →
        </Link>
      ) : null}
    </div>
  );
}
