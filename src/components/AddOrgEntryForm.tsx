"use client";

import { useState, useTransition } from "react";
import { addOrgBalanceEntry } from "@/app/actions";
import type { OrgCategory } from "@/lib/types";

export default function AddOrgEntryForm() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<OrgCategory>("late_fee");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount) {
      setMessage("Enter a non-zero amount (use a negative number for money spent).");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await addOrgBalanceEntry({ amount: numericAmount, category, description });
        setAmount("");
        setDescription("");
        setMessage("Added.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to add.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-medium text-neutral-900">Add organization balance entry</h3>
      <p className="text-xs text-neutral-500">
        Use a positive amount for money in (fees), negative for money spent.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          step="0.01"
          placeholder="Amount (e.g. 200 or -500)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-48 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as OrgCategory)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="late_fee">Late Payment Fee</option>
          <option value="membership_fee">Membership Fee</option>
          <option value="org_upgrade">Organization Upgrade</option>
          <option value="expense">Expense</option>
          <option value="adjustment">Adjustment</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
