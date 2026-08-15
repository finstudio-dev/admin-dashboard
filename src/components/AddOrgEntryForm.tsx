"use client";

import { useState, useTransition } from "react";
import { addOrgBalanceEntry } from "@/app/actions";
import type { OrgCategory } from "@/lib/types";

const fieldLabel = "block text-xs font-medium text-neutral-500 mb-1";
const fieldInput =
  "w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm focus:border-neutral-500 focus:outline-none";

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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-medium text-neutral-900">Add organization balance entry</h3>
        <p className="mt-0.5 text-xs text-neutral-500">
          Use a positive amount for money in (fees), negative for money spent.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_10rem_1fr_auto] sm:items-end">
        <div>
          <label className={fieldLabel} htmlFor="org-entry-amount">
            Amount
          </label>
          <input
            id="org-entry-amount"
            type="number"
            step="0.01"
            placeholder="e.g. 200 or -500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={fieldInput}
            required
          />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="org-entry-category">
            Category
          </label>
          <select
            id="org-entry-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as OrgCategory)}
            className={fieldInput}
          >
            <option value="late_fee">Late Payment Fee</option>
            <option value="membership_fee">Membership Fee</option>
            <option value="org_upgrade">Organization Upgrade</option>
            <option value="expense">Expense</option>
            <option value="adjustment">Adjustment</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={fieldLabel} htmlFor="org-entry-description">
            Description (optional)
          </label>
          <input
            id="org-entry-description"
            type="text"
            placeholder="What's this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
