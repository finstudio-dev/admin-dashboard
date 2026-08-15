"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMember } from "@/app/actions";

export default function DeleteMemberButton({
  memberId,
  fullName,
}: {
  memberId: string;
  fullName: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim() === fullName;

  function handleDelete() {
    if (!canDelete) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteMember(memberId);
        router.push("/members");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete this member.");
      }
    });
  }

  if (!expanded) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-900">Danger zone</h3>
        <p className="mt-1 text-xs text-red-700">
          Permanently delete this member&apos;s login and every deposit they&apos;ve ever
          submitted. This cannot be undone. For someone simply leaving the group, use
          Suspend above instead — it keeps their history.
        </p>
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          Delete member…
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h3 className="text-sm font-medium text-red-900">Delete {fullName}?</h3>
      <p className="mt-1 text-xs text-red-700">
        This permanently erases their account and their entire deposit history — it does
        not just hide them. Type <span className="font-semibold">{fullName}</span> below
        to confirm.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={fullName}
        className="mt-3 w-full rounded-md border border-red-300 bg-white px-2 py-1.5 text-sm text-neutral-900"
      />
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleDelete}
          disabled={!canDelete || pending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Deleting…" : "Permanently delete"}
        </button>
        <button
          onClick={() => {
            setExpanded(false);
            setConfirmText("");
            setError(null);
          }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
