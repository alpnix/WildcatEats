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
    <article className="card card-hover">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-serif text-xl font-bold">{request.locations?.name ?? "Campus Dining"}</h3>
        <StatusPill status={request.status} />
      </div>

      <p className="text-sm line-clamp-3 mb-4" style={{ color: "var(--gray-3)" }}>
        {request.item_text}
      </p>

      <div className="flex flex-wrap gap-4 mb-6 font-label text-xs text-muted">
        <span>Offer: ${(request.max_offer_cents / 100).toFixed(2)}</span>
        <span>Expires: {expires}</span>
        <span>
          {request.profiles?.first_name ?? "Student"}
          {request.profiles?.rating_avg ? ` \u2022 ${request.profiles.rating_avg.toFixed(1)}\u2605` : ""}
        </span>
      </div>

      <Link href={`/requests/${request.id}`} className="btn btn-primary btn-sm">
        View Request
      </Link>
    </article>
  );
}
