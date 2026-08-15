import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";
import type { OrgSettings } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("org_settings").select("*").eq("id", true).single(),
  ]);

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/login");
  }

  const org = settings as OrgSettings | null;
  const orgName = org?.org_name || "Fund Admin";

  const navItems = [
    { href: "/", label: "Overview" },
    { href: "/pending", label: "Pending Deposits" },
    { href: "/verifications", label: "Pending Verifications" },
    { href: "/members", label: "Members" },
    { href: "/bulk-balance", label: "Bulk Adjust" },
    { href: "/org-balance", label: "Organization Balance" },
    { href: "/audit-log", label: "Audit Log" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {org?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logo_url}
                alt={`${orgName} logo`}
                className="h-9 w-9 rounded-md object-contain"
              />
            )}
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">{orgName}</h1>
              <p className="text-xs text-neutral-500">Signed in as {profile.full_name}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
