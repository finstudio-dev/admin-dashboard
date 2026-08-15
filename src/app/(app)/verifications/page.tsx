import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VerificationReview from "@/components/VerificationReview";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VerificationsPage() {
  const supabase = await createClient();

  // Anyone who has submitted verification info and is still waiting on a
  // decision. Members who are 'pending' but haven't submitted anything yet
  // don't show up here — nothing to review until they do.
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .not("verification_submitted_at", "is", null)
    .order("verification_submitted_at", { ascending: true });

  const list = (profiles ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Pending Verifications</h2>
        <p className="mt-1 text-sm text-neutral-500">
          New members who submitted their identity info and are waiting for approval.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {!error && list.length === 0 && (
        <p className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          Nothing waiting for review right now.
        </p>
      )}

      <div className="space-y-4">
        {list.map((p) => (
          <div key={p.id} className="space-y-2">
            <Link
              href={`/members/${p.id}`}
              className="text-sm font-medium text-neutral-900 hover:underline"
            >
              {p.full_name} <span className="font-normal text-neutral-400">({p.email})</span>
            </Link>
            <VerificationReview member={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
