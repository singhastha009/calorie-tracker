"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (a) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={a ? 2.4 : 2}
        className="w-5 h-5"
      >
        <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "History",
    icon: (a) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={a ? 2.4 : 2}
        className="w-5 h-5"
      >
        <path d="M4 19V5M4 19h16" strokeLinecap="round" />
        <path d="M8 16V11M12 16V8M16 16V13" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/plan",
    label: "Plan",
    icon: (a) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={a ? 2.4 : 2}
        className="w-5 h-5"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (a) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={a ? 2.4 : 2}
        className="w-5 h-5"
      >
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop side rail */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:border-r md:border-slate-200 md:bg-white md:sticky md:top-0 md:h-screen">
        <div className="px-5 py-6 border-b border-slate-100">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Snap <span className="text-accent">&amp; Track</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition " +
                  (active
                    ? "bg-accentSoft text-accent"
                    : "text-slate-600 hover:bg-slate-50")
                }
              >
                {item.icon(active)}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-400">
          Powered by Claude
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Snap <span className="text-accent">&amp; Track</span>
          </Link>
        </header>

        <main className="flex-1 pb-24 md:pb-10">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 safe-pb z-20">
          <ul className="flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    className={
                      "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition " +
                      (active ? "text-accent" : "text-slate-500")
                    }
                  >
                    {item.icon(active)}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
