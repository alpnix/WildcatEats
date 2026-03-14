"use client";

import { useState } from "react";

export function ConnectOnboardingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/stripe/connect/onboard-link", {
      method: "POST"
    });

    const body = (await response.json()) as { onboardingUrl?: string; error?: string };

    if (!response.ok || !body.onboardingUrl) {
      setError(body.error ?? "Unable to start Stripe onboarding.");
      setLoading(false);
      return;
    }

    window.location.href = body.onboardingUrl;
  }

  return (
    <div>
      <button
        className="inline-flex rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper disabled:opacity-60"
        onClick={onClick}
        disabled={loading}
        type="button"
      >
        {loading ? "Opening..." : "Connect Stripe"}
      </button>
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
