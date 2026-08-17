"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Renders one top-nav tab, highlighted with a color + bottom line when its
// page is the one currently open. A client component because knowing "am I
// the active page" needs the current URL (usePathname), which isn't
// available in the server-rendered layout this lives inside.
export default function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`group relative whitespace-nowrap px-3 pb-[9px] pt-1.5 text-sm font-medium ${
        isActive ? "text-blue-600" : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      {label}
      <span
        className={`pointer-events-none absolute inset-x-1 -bottom-px h-0.5 rounded-full ${
          isActive ? "bg-blue-600" : "bg-transparent group-hover:bg-neutral-300"
        }`}
      />
    </Link>
  );
}
