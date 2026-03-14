"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const check = await fetch("/api/auth/onboarding/check-email-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const checkBody = (await check.json()) as { valid?: boolean; message?: string };

    if (!check.ok || !checkBody.valid) {
      setLoading(false);
      setMessage(checkBody.message ?? "Use a valid @davidson.edu email.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Magic link sent. Check your inbox.");
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm">
      <h1 className="font-display text-2xl text-cardinal">Sign in with Davidson Email</h1>
      <p className="text-sm text-ink/85">Only verified `@davidson.edu` users can access requests and runner actions.</p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <label className="text-sm">
          Davidson email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-ink/20 p-2"
            placeholder="you@davidson.edu"
            required
          />
        </label>

        <button
          className="inline-flex w-fit rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-ink/85">{message}</p> : null}
    </section>
  );
}
