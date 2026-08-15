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
      {status === "pending" && (
        <button
          onClick={() => startTransition(() => setMemberStatus(memberId, "active"))}
          disabled={pending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Activate member
        </button>
      )}
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
