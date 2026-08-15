"use client";

import { useTransition } from "react";
import { setMemberStatus, setMemberRole } from "@/app/actions";
import type { MemberStatus, Role } from "@/lib/types";

export default function MemberActions({
  memberId,
  status,
  role,
}: {
  memberId: string;
  status: MemberStatus;
  role: Role;
}) {
  const [pending, startTransition] = useTransition();

  function toggleStatus() {
    const next: MemberStatus = status === "suspended" ? "active" : "suspended";
    startTransition(() => setMemberStatus(memberId, next));
  }

  function toggleRole() {
    const next: Role = role === "admin" ? "member" : "admin";
    startTransition(() => setMemberRole(memberId, next));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Activating/rejecting a pending member happens in the Identity
          verification panel above (see VerificationReview), so this
          component only handles suspend/reactivate + admin toggle. */}
      {status !== "pending" && (
        <button
          onClick={toggleStatus}
          disabled={pending}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {status === "suspended" ? "Reactivate" : "Suspend"}
        </button>
      )}
      <button
        onClick={toggleRole}
        disabled={pending}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {role === "admin" ? "Remove admin rights" : "Make admin"}
      </button>
    </div>
  );
}
