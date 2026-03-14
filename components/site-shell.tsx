import Link from "next/link";
import { clsx } from "clsx";
import { ReactNode } from "react";

interface SiteShellProps {
  children: ReactNode;
}

const nav = [
  { href: "/", label: "Forum" },
  { href: "/requests/new", label: "Post" },
  { href: "/my", label: "My Activity" },
  { href: "/auth", label: "Sign In" },
  { href: "/admin", label: "Admin" }
];

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="app-bg min-h-screen text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/20 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-2xl tracking-tight text-cardinal">
            WildcatEats
          </Link>
          <nav className="flex gap-1 rounded-full bg-ink/5 p-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                  "text-ink/75 hover:bg-cardinal hover:text-paper"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
