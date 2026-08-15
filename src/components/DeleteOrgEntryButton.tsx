"use client";

import { useState, useTransition } from "react";
import { deleteOrgBalanceEntry } from "@/app/actions";

export default function DeleteOrgEntryButton({ entryId }: { entryId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      "Permanently delete this entry? This removes it from the balance and the history — it can't be undone."
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteOrgBalanceEntry(entryId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete this entry.");
      }
    });
  }

  return (
    <div className="text-right">
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
