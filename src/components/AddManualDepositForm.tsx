"use client";

import { useState, useTransition } from "react";
import { addManualDeposit } from "@/app/actions";
import type { DepositMethod } from "@/lib/types";

export default function AddManualDepositForm({ memberId }: { memberId: string }) {
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
    setMessage(null);
    startTransition(async () => {
      try {
        await addManualDeposit({ memberId, amount: numericAmount, method, note });
        setAmount("");
        setNote("");
        setMessage("Added.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to add.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-medium text-neutral-900">Add manual entry</h3>
      <p className="text-xs text-neutral-500">
        For cash handed over in person or corrections. This is added as already approved.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-32 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          required
        />
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as DepositMethod)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="cash">Cash</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
          <option value="rocket">Rocket</option>
          <option value="bank">Bank Transfer</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 min-w-[10rem] rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {message && <p className="text-xs text-neutral-500">{message}</p>}
    </form>
  );
}
