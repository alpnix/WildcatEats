import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import type { RequestStatus } from "@/lib/types";

interface RequestCardProps {
  request: {
    id: string;
    item_text: string;
    max_offer_cents: number;
    status: RequestStatus;
    expires_at: string;
    locations?: { name?: string } | null;
    profiles?: { first_name?: string; rating_avg?: number | null } | null;
  };
}

export function RequestCard({ request }: RequestCardProps) {
  const expires = new Date(request.expires_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });

  return (
    <article className="group rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-display text-xl text-ink">{request.locations?.name ?? "Campus Dining"}</h3>
        <StatusPill status={request.status} />
      </div>
      <p className="mb-3 line-clamp-3 text-sm text-ink/85">{request.item_text}</p>
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-ink/75">
        <span>Offer: ${(request.max_offer_cents / 100).toFixed(2)}</span>
        <span>Expires: {expires}</span>
        <span>
          {request.profiles?.first_name ?? "Student"}
          {request.profiles?.rating_avg ? ` • ${request.profiles.rating_avg.toFixed(1)}★` : ""}
        </span>
      </div>
      <Link
        href={`/requests/${request.id}`}
        className="inline-flex rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper transition hover:bg-cardinal-dark"
      >
        View Request
      </Link>
    </article>
  );
}
