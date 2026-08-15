import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import type { Profile, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: Role = tab === "admins" ? "admin" : "member";

  const supabase = await createClient();

  const [{ data: profiles, error }, { data: balances }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("member_balances").select("*"),
  ]);

  const balanceMap = new Map((balances ?? []).map((b) => [b.member_id, b]));
  const allProfiles = (profiles ?? []) as Profile[];
  const admins = allProfiles.filter((p) => p.role === "admin");
  const users = allProfiles.filter((p) => p.role === "member");
  const shown = activeTab === "admin" ? admins : users;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Members</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {users.filter((p) => p.status === "pending").length} pending activation ·{" "}
          {users.filter((p) => p.status === "active").length} active ·{" "}
          {admins.length} admin{admins.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 w-fit">
        <TabLink href="/members?tab=users" active={activeTab === "member"}>
          Users ({users.length})
        </TabLink>
        <TabLink href="/members?tab=admins" active={activeTab === "admin"}>
          Admins ({admins.length})
        </TabLink>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Approved Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {shown.map((p) => (
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
                <td className="px-4 py-3 text-right font-medium text-neutral-900">
                  {formatMoney(balanceMap.get(p.id)?.total_approved ?? 0)}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                  {activeTab === "admin" ? "No admins yet." : "No users yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
