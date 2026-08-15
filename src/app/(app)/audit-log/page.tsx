import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("audit_log")
    .select("*, profiles!audit_log_actor_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Audit Log</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Every approval, rejection, manual entry, and balance change — most recent first.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {((entries ?? []) as AuditLogEntry[]).map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-neutral-600">{formatDate(e.created_at)}</td>
                <td className="px-4 py-3 text-neutral-600">{e.profiles?.full_name ?? "System"}</td>
                <td className="px-4 py-3 text-neutral-900">{e.action.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {e.entity_type}
                  {e.entity_id ? ` · ${e.entity_id.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
            {(!entries || entries.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
