export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
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

export const categoryLabels: Record<string, string> = {
  late_fee: "Late Payment Fee",
  membership_fee: "Membership Fee",
  org_upgrade: "Organization Upgrade",
  expense: "Expense",
  adjustment: "Adjustment",
  other: "Other",
};
