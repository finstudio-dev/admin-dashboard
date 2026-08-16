export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
}

// Dates are stored in the database as UTC and this dashboard is rendered on
// the server (Vercel's servers run in UTC, not Bangladesh time), so without
// pinning a timeZone here every date would silently show up to 6 hours
// earlier than the actual Bangladesh time it happened at. Hardcoded to
// Asia/Dhaka since this whole system is built for a Bangladesh-based group.
const DISPLAY_TIMEZONE = "Asia/Dhaka";

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DISPLAY_TIMEZONE,
  });
}

export function formatMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: DISPLAY_TIMEZONE,
  });
}

export const methodLabels: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank Transfer",
  cash: "Cash",
  other: "Other",
};

export const entryTypeLabels: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  bonus: "Bonus",
  adjustment: "Adjustment",
  org_transfer: "From Organization Fund",
};

export const categoryLabels: Record<string, string> = {
  late_fee: "Late Payment Fee",
  membership_fee: "Membership Fee",
  org_upgrade: "Organization Upgrade",
  expense: "Expense",
  adjustment: "Adjustment",
  member_transfer: "Transfer to Members",
  other: "Other",
};
