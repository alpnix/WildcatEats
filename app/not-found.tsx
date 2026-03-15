import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section style={{ display: "flex", justifyContent: "center", paddingTop: "var(--section-pad-y)" }}>
      <div className="card" style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
        <h1 className="font-serif text-3xl font-bold mb-2">404</h1>
        <p className="text-sm text-muted mb-6">The requested WildcatEats page does not exist.</p>
        <Link href="/" className="btn btn-primary">
          Return to Forum
        </Link>
      </div>
    </section>
  );
}
