import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm">
      <h1 className="font-display text-2xl text-cardinal">Not Found</h1>
      <p className="text-sm text-ink/85">The requested WildcatEats page does not exist.</p>
      <Link href="/" className="mt-4 inline-flex rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper">
        Return to Forum
      </Link>
    </section>
  );
}
