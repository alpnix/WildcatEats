import { notFound } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RequestDetailProps {
  params: { id: string };
}

export default async function RequestDetailPage({ params }: RequestDetailProps) {
  const supabase = createSupabaseAdminClient();

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id,item_text,max_offer_cents,processing_fee_cents,status,expires_at,auto_release_at,locations(name),profiles!requests_requester_id_fkey(first_name,rating_avg)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!request) {
    notFound();
  }

  const location = Array.isArray(request.locations) ? request.locations[0] : request.locations;

  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-cardinal">{location?.name ?? "Dining Location"}</h1>
        <StatusPill status={request.status} />
      </div>

      <p className="mb-3 text-sm text-ink/85">{request.item_text}</p>

      <div className="mb-4 grid gap-2 text-sm text-ink/85">
        <span>Offer: ${(request.max_offer_cents / 100).toFixed(2)}</span>
        <span>Processing fee: ${(request.processing_fee_cents / 100).toFixed(2)}</span>
        <span>Expires at: {new Date(request.expires_at).toLocaleString()}</span>
        <span>Auto-release: {new Date(request.auto_release_at).toLocaleString()}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <form action={`/api/requests/${request.id}/accept`} method="post">
          <button className="rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper" type="submit">
            Accept Request
          </button>
        </form>

        <form action={`/api/stripe/create-payment-intent`} method="post">
          <input type="hidden" name="requestId" value={request.id} />
          <button className="rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-wide" type="submit">
            Prepare Payment
          </button>
        </form>

        <form action={`/api/requests/${request.id}/confirm-delivery`} method="post">
          <button className="rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-wide" type="submit">
            Confirm Delivery
          </button>
        </form>
      </div>
    </section>
  );
}
