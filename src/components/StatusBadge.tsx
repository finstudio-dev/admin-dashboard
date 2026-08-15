const STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  active: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-red-100 text-red-800",
  admin: "bg-violet-100 text-violet-800",
  member: "bg-neutral-100 text-neutral-700",
};

export default function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STYLES[value] ?? "bg-neutral-100 text-neutral-700"
      }`}
    >
      {value}
    </span>
  );
}
