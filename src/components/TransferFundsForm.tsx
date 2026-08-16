"use client";

import { useMemo, useState, useTransition } from "react";
import { transferOrgFundsToMembers } from "@/app/actions";
import { formatMoney } from "@/lib/format";

interface MemberOption {
  id: string;
  full_name: string;
  email: string;
}

export default function TransferFundsForm({
  members,
  orgBalance,
}: {
  members: MemberOption[];
  orgBalance: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [totalAmount, setTotalAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const allSelected = members.length > 0 && selected.size === members.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(members.map((m) => m.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const approxEach = useMemo(() => {
    const n = Number(totalAmount);
    if (!n || selected.size === 0) return null;
    return n / selected.size;
  }, [totalAmount, selected.size]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(totalAmount);
    if (!numericAmount || numericAmount <= 0) {
      setMessage("Enter a valid total amount.");
      return;
    }
    if (selected.size === 0) {
      setMessage("Select at least one member.");
      return;
    }

    const confirmed = window.confirm(
      `Transfer ${formatMoney(numericAmount)} total from the organization balance to ${selected.size} member${
        selected.size === 1 ? "" : "s"
      } (about ${formatMoney(numericAmount / selected.size)} each)? This can't be bulk-undone. Continue?`
    );
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await transferOrgFundsToMembers({
          memberIds: Array.from(selected),
          totalAmount: numericAmount,
          note,
        });
        setTotalAmount("");
        setNote("");
        setSelected(new Set());
        setMessage(`Transferred ${formatMoney(result.totalAmount)} across ${result.memberCount} member(s).`);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to transfer.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-medium text-neutral-900">Transfer to members</h3>
        <p className="mt-0.5 text-xs text-neutral-500">
          Current organization balance: <span className="font-medium text-neutral-700">{formatMoney(orgBalance)}</span>
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-500">Select members</label>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto rounded-md border border-neutral-200">
          {members.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-2 border-b border-neutral-100 px-3 py-2 text-sm last:border-b-0 hover:bg-neutral-50"
            >
              <input
                type="checkbox"
                checked={selected.has(m.id)}
                onChange={() => toggleOne(m.id)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <span className="text-neutral-900">{m.full_name}</span>
              <span className="text-xs text-neutral-400">{m.email}</span>
            </label>
          ))}
          {members.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-neutral-400">No active members yet.</p>
          )}
        </div>
        <p className="mt-1 text-xs text-neutral-400">{selected.size} selected</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="transfer-total-amount">
            Total amount
          </label>
          <input
            id="transfer-total-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500" htmlFor="transfer-note">
            Note (optional)
          </label>
          <input
            id="transfer-note"
            type="text"
            placeholder="e.g. Eid bonus from club savings"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending || selected.size === 0}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "Transferring…" : "Transfer"}
        </button>
      </div>

      {approxEach !== null && (
        <p className="text-xs text-neutral-400">
          ≈ {formatMoney(approxEach)} each ({selected.size} member{selected.size === 1 ? "" : "s"}) — split isn&apos;t
          always exact to the paisa, but the total transferred always matches exactly.
        </p>
      )}

      {message && <p className="text-xs text-neutral-500">{message}</p>}
    </form>
  );
}
