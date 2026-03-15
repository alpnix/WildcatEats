import Link from "next/link";
import { ConnectOnboardingButton } from "@/components/connect-onboarding-button";

export default function MyPage() {
  return (
    <section className="card" style={{ maxWidth: "40rem" }}>
      <h1 className="font-serif text-2xl font-bold text-red mb-2">My Activity</h1>
      <p className="text-sm text-muted mb-6">
        Track your requests, accepted runs, payouts, and disputes.
      </p>

      <ul className="text-sm mb-8" style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem", color: "var(--gray-3)" }}>
        <li>Use the forum to open your requests.</li>
        <li>Open each request card to manage delivery and confirmation.</li>
        <li>Payouts are held until confirmation or 24-hour auto-release.</li>
      </ul>

      <div className="flex flex-wrap gap-3">
        <ConnectOnboardingButton />
        <Link href="/" className="btn btn-primary">
          Back to Forum
        </Link>
      </div>
    </section>
  );
}
