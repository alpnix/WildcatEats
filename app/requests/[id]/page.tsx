import { notFound } from "next/navigation";
import { RequestActions } from "@/components/request-actions";
import { StatusPill } from "@/components/status-pill";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RequestDetailProps {
  params: { id: string };
}

export default async function RequestDetailPage({ params }: RequestDetailProps) {
  const authSupabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await authSupabase.auth.getUser();
  const supabase = createSupabaseAdminClient();

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id,item_text,max_offer_cents,processing_fee_cents,status,expires_at,auto_release_at,requester_id,locations(name),profiles!requests_requester_id_fkey(first_name,rating_avg)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!request) {
    notFound();
  }

  const location = Array.isArray(request.locations) ? request.locations[0] : request.locations;
  const requester = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;
  const isRequester = user?.id === request.requester_id;

  return (
    <section className="card" style={{ maxWidth: "40rem" }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="font-serif text-2xl font-bold">{location?.name ?? "Dining Location"}</h1>
        <StatusPill status={request.status} />
      </div>

      <p className="text-sm mb-6" style={{ color: "var(--gray-3)" }}>{request.item_text}</p>

      <div className="grid gap-3 mb-8 border-t border-b py-6">
        <div className="flex justify-between">
          <span className="font-label text-xs text-muted">Offer</span>
          <span className="text-sm font-semibold">${(request.max_offer_cents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-label text-xs text-muted">Stripe Fees</span>
          <span className="text-sm font-semibold">${(request.processing_fee_cents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-label text-xs text-muted">Requested By</span>
          <span className="text-sm font-semibold">
            {requester?.first_name ?? "Student"}
            {requester?.rating_avg ? ` \u2022 ${requester.rating_avg.toFixed(1)}\u2605` : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-label text-xs text-muted">Expires At</span>
          <span className="text-sm">{new Date(request.expires_at).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-label text-xs text-muted">Auto-Release</span>
          <span className="text-sm">{new Date(request.auto_release_at).toLocaleString()}</span>
        </div>
      </div>

      {user ? <RequestActions requestId={request.id} requestStatus={request.status} isRequester={isRequester} /> : null}
    </section>
  );
}
