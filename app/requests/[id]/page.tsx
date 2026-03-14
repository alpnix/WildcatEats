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
    <section className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-cardinal">{location?.name ?? "Dining Location"}</h1>
        <StatusPill status={request.status} />
      </div>

      <p className="mb-3 text-sm text-ink/85">{request.item_text}</p>

      <div className="mb-4 grid gap-2 text-sm text-ink/85">
        <span>Offer: ${(request.max_offer_cents / 100).toFixed(2)}</span>
        <span>Stripe fees: ${(request.processing_fee_cents / 100).toFixed(2)}</span>
        <span>
          Requested by: {requester?.first_name ?? "Student"}
          {requester?.rating_avg ? ` • ${requester.rating_avg.toFixed(1)}★` : ""}
        </span>
        <span>Expires at: {new Date(request.expires_at).toLocaleString()}</span>
        <span>Auto-release: {new Date(request.auto_release_at).toLocaleString()}</span>
      </div>

      {user ? <RequestActions requestId={request.id} requestStatus={request.status} isRequester={isRequester} /> : null}
    </section>
  );
}
