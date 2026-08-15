"use client";

import { useState, useTransition } from "react";
import { approveDeposit, rejectDeposit, getReceiptUrl } from "@/app/actions";

export default function ReviewActions({
  depositId,
  receiptUrl,
}: {
  depositId: string;
  receiptUrl: string | null;
}) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      try {
        await approveDeposit(depositId, note || undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      try {
        await rejectDeposit(depositId, note || undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  async function handleViewReceipt() {
    if (!receiptUrl) return;
    setLoadingReceipt(true);
    try {
      const url = await getReceiptUrl(receiptUrl);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load receipt");
    } finally {
      setLoadingReceipt(false);
    }
  }

  return (
    <div className="space-y-2">
      {receiptUrl && (
        <button
          onClick={handleViewReceipt}
          disabled={loadingReceipt}
          className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
        >
          {loadingReceipt ? "Loading..." : "View receipt photo →"}
        </button>
      )}
      <div>
        <label htmlFor={`note-${depositId}`} className="mb-1 block text-xs font-medium text-neutral-500">
          Note (optional, visible to member)
        </label>
        <input
          id={`note-${depositId}`}
          type="text"
          placeholder="e.g. reason for rejection"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-xs focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={pending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={pending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
