import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) redirect("/forum");

  return (
    <section>
      <div className="section-hero" style={{ textAlign: "center" }}>
        <h1 className="font-serif text-4xl font-bold tracking-tight mb-4">
          WildcatEats
        </h1>
        <p className="text-lg mb-6 mx-auto" style={{ maxWidth: "36rem", color: "var(--gray-3)" }}>
          A student-run marketplace where Davidson students can post food
          requests and match with runners who fulfill them using their dining
          dollars or meal swipes.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth" className="btn btn-primary">
            Sign In
          </Link>
          <Link href="/forum" className="btn btn-outline">
            Browse the Forum
          </Link>
        </div>
      </div>

      <div className="grid gap-8" style={{ maxWidth: "40rem", margin: "0 auto" }}>
        <div className="card">
          <h2 className="font-serif text-2xl font-bold mb-4">How It Works</h2>
          <ol className="text-sm" style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", color: "var(--gray-3)" }}>
            <li><strong style={{ color: "var(--black)" }}>Post a request.</strong> Describe what you want and set your offer amount.</li>
            <li><strong style={{ color: "var(--black)" }}>A runner accepts.</strong> Another student picks up your request.</li>
            <li><strong style={{ color: "var(--black)" }}>The runner places the order on GrubHub</strong> using their dining dollars or meal swipes.</li>
            <li><strong style={{ color: "var(--black)" }}>The runner uploads proof.</strong> A screenshot of the order confirmation is submitted as verification.</li>
            <li><strong style={{ color: "var(--black)" }}>You pick up the food</strong> at the dining location and confirm delivery.</li>
          </ol>
        </div>

        <div className="card">
          <h2 className="font-serif text-2xl font-bold mb-4">Payments</h2>
          <ul className="text-sm" style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", color: "var(--gray-3)" }}>
            <li><strong style={{ color: "var(--black)" }}>When you pay.</strong> Your card is charged when a runner accepts your request. The funds are held securely by Stripe until delivery is confirmed.</li>
            <li><strong style={{ color: "var(--black)" }}>When the runner gets paid.</strong> The runner receives their payout in USD via Stripe after they upload a GrubHub receipt — including timestamp — as verified proof that the order was placed.</li>
            <li><strong style={{ color: "var(--black)" }}>Cancellations.</strong> You can cancel and receive a full refund at any point before the runner&apos;s GrubHub receipt is uploaded and confirmed. Once the receipt is confirmed, no refunds are issued.</li>
            <li><strong style={{ color: "var(--black)" }}>Disputes.</strong> If something goes wrong, either party can open a dispute for admin review.</li>
          </ul>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <p className="text-xs text-muted">
          By using WildcatEats, you acknowledge this is an independent student marketplace, not affiliated with Davidson College dining services.
        </p>
      </div>
    </section>
  );
}
