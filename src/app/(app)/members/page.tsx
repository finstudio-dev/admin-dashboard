import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const supabase = await createClient();

  const [{ data: profiles, error }, { data: balances }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("member_balances").select("*"),
  ]);

  const balanceMap = new Map((balances ?? []).map((b) => [b.member_id, b]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Members</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {profiles?.filter((p) => p.status === "pending").length ?? 0} pending activation ·{" "}
          {profiles?.filter((p) => p.status === "active").length ?? 0} active
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Approved Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {((profiles ?? []) as Profile[]).map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/members/${p.id}`} className="font-medium text-neutral-900 hover:underline">
                    {p.full_name}
                  </Link>
                  <p className="text-xs text-neutral-400">{p.email}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={p.status} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={p.role} />
                </td>
                <td className="px-4 py-3 text-right font-medium text-neutral-900">
                  {formatMoney(balanceMap.get(p.id)?.total_approved ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
