"use client";

import { useState, useTransition } from "react";
import { addManualDeposit } from "@/app/actions";
import type { DepositMethod } from "@/lib/types";

const fieldLabel = "block text-xs font-medium text-neutral-500 mb-1";
const fieldInput =
  "w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-medium text-neutral-900">Add manual entry</h3>
        <p className="mt-0.5 text-xs text-neutral-500">
          For cash handed over in person or corrections. This is added as already approved.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_10rem_1fr_auto] sm:items-end">
        <div>
          <label className={fieldLabel} htmlFor="manual-deposit-amount">
            Amount
          </label>
          <input
            id="manual-deposit-amount"
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
          <label className={fieldLabel} htmlFor="manual-deposit-method">
            Method
          </label>
          <select
            id="manual-deposit-method"
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
          <label className={fieldLabel} htmlFor="manual-deposit-note">
            Note (optional)
          </label>
          <input
            id="manual-deposit-note"
            type="text"
            placeholder="What's this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldInput}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {message && <p className="text-xs text-neutral-500">{message}</p>}
    </form>
  );
}
