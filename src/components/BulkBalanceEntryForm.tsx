"use client";

import { useState, useTransition } from "react";
import { addBulkMemberBalanceEntry } from "@/app/actions";
import type { DepositMethod, EntryType } from "@/lib/types";

// org_transfer isn't offered here — it's only ever created by the Transfer
// to Members flow, which sets it automatically.
type SelectableEntryType = Exclude<EntryType, "org_transfer">;

const fieldLabel = "block text-xs font-medium text-neutral-500 mb-1";
const fieldInput =
  "w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

const HELP_TEXT: Record<SelectableEntryType, string> = {
  deposit: "Adds this amount to every active member's balance — e.g. collecting the same monthly dues from everyone at once.",
  withdrawal: "Subtracts this amount from every active member's balance.",
  bonus: "Gives every active member this much extra credit — not a real deposit.",
  adjustment: "Applies the same correction to every active member. Choose whether it adds or subtracts below.",
};

export default function BulkBalanceEntryForm({ activeMemberCount }: { activeMemberCount: number }) {
  const [entryType, setEntryType] = useState<SelectableEntryType>("deposit");
  const [direction, setDirection] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<DepositMethod>("cash");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setMessage("Enter a valid amount.");
      return;
    }
    if (activeMemberCount === 0) {
      setMessage("There are no active members to apply this to.");
      return;
    }

    const directionLabel = entryType === "adjustment" ? (direction === "subtract" ? "subtract from" : "add to") : "apply to";
    const confirmed = window.confirm(
      `This will ${directionLabel} ${activeMemberCount} active member${activeMemberCount === 1 ? "" : "s"}: a ${entryType} of ${numericAmount} each. This can't be bulk-undone — you'd need to reverse it member by member. Continue?`
    );
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await addBulkMemberBalanceEntry({
          entryType,
          amount: numericAmount,
          direction: entryType === "adjustment" ? direction : undefined,
          method,
          note,
        });
        setAmount("");
        setNote("");
        setMessage(`Applied to ${result.memberCount} member${result.memberCount === 1 ? "" : "s"}.`);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to apply.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-medium text-neutral-900">Apply to every active member</h3>
        <p className="mt-0.5 text-xs text-neutral-500">{HELP_TEXT[entryType]}</p>
        <p className="mt-1 text-xs text-neutral-400">
          Currently {activeMemberCount} active member{activeMemberCount === 1 ? "" : "s"} would be affected
          (admin accounts are never included).
        </p>
      </div>

      <div>
        <label className={fieldLabel}>Type</label>
        <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 w-fit">
          {(["deposit", "withdrawal", "bonus", "adjustment"] as SelectableEntryType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEntryType(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${
                entryType === t ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_10rem_1fr_auto] sm:items-end">
        <div>
          <label className={fieldLabel} htmlFor="bulk-entry-amount">
            Amount (each)
          </label>
          <input
            id="bulk-entry-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={fieldInput}
            required
          />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="bulk-entry-method">
            Method
          </label>
          <select
            id="bulk-entry-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as DepositMethod)}
            className={fieldInput}
          >
            <option value="cash">Cash</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
            <option value="bank">Bank Transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={fieldLabel} htmlFor="bulk-entry-note">
            Note (optional)
          </label>
          <input
            id="bulk-entry-note"
            type="text"
            placeholder="e.g. August membership dues"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldInput}
          />
        </div>
        <button
          type="submit"
          disabled={pending || activeMemberCount === 0}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "Applying…" : "Apply to all"}
        </button>
      </div>

      {entryType === "adjustment" && (
        <div>
          <label className={fieldLabel}>Direction</label>
          <div className="flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 w-fit">
            <button
              type="button"
              onClick={() => setDirection("add")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                direction === "add" ? "bg-emerald-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              + Add to balance
            </button>
            <button
              type="button"
              onClick={() => setDirection("subtract")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                direction === "subtract" ? "bg-red-600 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              − Subtract from balance
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-xs text-neutral-500">{message}</p>}
    </form>
  );
}
