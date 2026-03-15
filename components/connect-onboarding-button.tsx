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
        className="btn btn-outline"
        onClick={onClick}
        disabled={loading}
        type="button"
      >
        {loading ? "Opening..." : "Connect Stripe"}
      </button>
      {error ? <p className="mt-3 text-sm text-red">{error}</p> : null}
    </div>
  );
}
