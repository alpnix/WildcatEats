"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Location = {
  id: string;
  name: string;
};

interface NewRequestFormProps {
  initialRequest?: {
    id: string;
    locationId: string;
    itemText: string;
    maxOfferCents: number;
    expiresInMinutes: number;
  };
}

export function NewRequestForm({ initialRequest }: NewRequestFormProps) {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isEditing = Boolean(initialRequest);

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
    const form = event.currentTarget;
    setLoading(true);
    setMessage(null);

    const formData = new FormData(form);
    const payload = {
      locationId: formData.get("locationId"),
      itemText: formData.get("itemText"),
      maxOfferCents: Number(formData.get("maxOfferDollars")) * 100,
      expiresInMinutes: Number(formData.get("expiresInMinutes"))
    };

    const response = await fetch(initialRequest ? `/api/requests/${initialRequest.id}` : "/api/requests", {
      method: initialRequest ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = (await response.json()) as { error?: string; requestId?: string };
    setLoading(false);

    if (!response.ok) {
      setMessage(body.error ?? `Failed to ${isEditing ? "update" : "create"} request.`);
      return;
    }

    if (isEditing && body.requestId) {
      router.push(`/requests/${body.requestId}`);
      router.refresh();
      return;
    }

    setMessage("Request created. Open payment from your request details next.");
    form.reset();
  }

  return (
    <section className="card">
      <h1 className="font-serif text-2xl font-bold text-red mb-2">
        {isEditing ? "Edit Food Request" : "Post Food Request"}
      </h1>
      <p className="text-sm text-muted mb-6">
        Runner payout is released after you confirm delivery (or in 24 hours).
      </p>

      <form onSubmit={onSubmit} className="grid gap-6">
        <div>
          <label htmlFor="locationId" className="form-label">Dining Location</label>
          <select
            id="locationId"
            name="locationId"
            className="form-input"
            defaultValue={initialRequest?.locationId ?? ""}
            required
          >
            <option value="">Select a location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="itemText" className="form-label">Food Request Details</label>
          <textarea
            id="itemText"
            name="itemText"
            rows={5}
            maxLength={400}
            className="form-input"
            placeholder="Example: 1 spicy chicken sandwich meal + medium fries"
            defaultValue={initialRequest?.itemText ?? ""}
            required
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label htmlFor="maxOfferDollars" className="form-label">Offer (USD)</label>
            <input
              id="maxOfferDollars"
              type="number"
              min={2}
              step={0.5}
              name="maxOfferDollars"
              className="form-input"
              defaultValue={initialRequest ? initialRequest.maxOfferCents / 100 : undefined}
              required
            />
          </div>

          <div>
            <label htmlFor="expiresInMinutes" className="form-label">Expires In (Minutes)</label>
            <input
              id="expiresInMinutes"
              type="number"
              min={1}
              max={240}
              defaultValue={initialRequest?.expiresInMinutes ?? 45}
              name="expiresInMinutes"
              className="form-input"
              required
            />
          </div>
        </div>

        <div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? (isEditing ? "Saving..." : "Posting...") : isEditing ? "Save Changes" : "Create Request"}
          </button>
        </div>
      </form>

      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
    </section>
  );
}
