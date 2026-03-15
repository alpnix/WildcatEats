import Link from "next/link";
import { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

interface SiteShellProps {
  children: ReactNode;
}

export async function SiteShell({ children }: SiteShellProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const nav = [
    { href: "/", label: "Forum" },
    ...(user
      ? [
          { href: "/requests/new", label: "Post" },
          { href: "/my", label: "My Activity" }
        ]
      : [{ href: "/auth", label: "Sign In" }])
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="site-header">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight">
            WildcatEats
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
            {user && <LogoutButton />}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10" style={{ flex: "1 1 auto" }}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 sm:flex-col sm:gap-4">
          <div>
            <span className="font-serif font-bold">WildcatEats</span>
            <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>&mdash;</span>
            <span className="text-sm" style={{ opacity: 0.7 }}>Davidson College</span>
          </div>
          <p className="text-xs" style={{ opacity: 0.5 }}>
            &copy; {new Date().getFullYear()} WildcatEats. Independent student marketplace.
          </p>
        </div>
      </footer>
    </div>
  );
}
