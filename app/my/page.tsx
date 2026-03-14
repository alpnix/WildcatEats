import Link from "next/link";
import { ConnectOnboardingButton } from "@/components/connect-onboarding-button";

export default function MyPage() {
  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm">
      <h1 className="font-display text-2xl text-cardinal">My Activity</h1>
      <p className="mb-4 text-sm text-ink/85">Track your requests, accepted runs, payouts, and disputes.</p>
      <ul className="text-sm text-ink/85">
        <li>Use the forum to open your requests.</li>
        <li>Open each request card to manage delivery and confirmation.</li>
        <li>Payouts are held until confirmation or 24-hour auto-release.</li>
      </ul>
      <div className="mt-4">
        <ConnectOnboardingButton />
      </div>
      <Link href="/" className="mt-4 inline-flex rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper">
        Back to Forum
      </Link>
    </section>
  );
}
