"use client";

import { FormEvent, useEffect, useState } from "react";

type Location = {
  id: string;
  name: string;
};

export default function NewRequestPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/locations", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { locations: Location[] };
      setLocations(body.locations);
    })();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      locationId: formData.get("locationId"),
      itemText: formData.get("itemText"),
      maxOfferCents: Number(formData.get("maxOfferDollars")) * 100,
      expiresInMinutes: Number(formData.get("expiresInMinutes"))
    };

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as { error?: string; requestId?: string };
    setLoading(false);

    if (!response.ok) {
      setMessage(body.error ?? "Failed to create request.");
      return;
    }

    setMessage("Request created. Open payment from your request details next.");
    event.currentTarget.reset();
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm">
      <h1 className="font-display text-2xl text-cardinal">Post Food Request</h1>
      <p className="text-sm text-ink/85">Runner payout is released after you confirm delivery (or in 24 hours).</p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <label className="text-sm">
          Dining location
          <select name="locationId" className="mt-1 w-full rounded-xl border border-ink/20 p-2" required>
            <option value="">Select a location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Food request details
          <textarea
            name="itemText"
            rows={5}
            maxLength={400}
            className="mt-1 w-full rounded-xl border border-ink/20 p-2"
            placeholder="Example: 1 spicy chicken sandwich meal + medium fries"
            required
          />
        </label>

        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <label className="text-sm">
            Offer (USD)
            <input
              type="number"
              min={2}
              step={0.5}
              name="maxOfferDollars"
              className="mt-1 w-full rounded-xl border border-ink/20 p-2"
              required
            />
          </label>

          <label className="text-sm">
            Expires in (minutes)
            <input
              type="number"
              min={10}
              max={240}
              defaultValue={45}
              name="expiresInMinutes"
              className="mt-1 w-full rounded-xl border border-ink/20 p-2"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-fit rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper disabled:opacity-60"
        >
          {loading ? "Posting..." : "Create request"}
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-ink/85">{message}</p> : null}
    </section>
  );
}
