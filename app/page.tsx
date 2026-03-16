import Link from "next/link";
import { RequestCard } from "@/components/request-card";
import { DiningHours } from "@/components/dining-hours";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseAdminClient();

  const { data: staleRows } = await supabase
    .from("requests")
    .select("id,requester_id")
    .eq("status", "open")
    .lte("expires_at", new Date().toISOString());

  if (staleRows && staleRows.length > 0) {
    await supabase
      .from("requests")
      .update({ status: "expired" })
      .in("id", staleRows.map((r) => r.id));

    await supabase.from("request_status_events").insert(
      staleRows.map((r) => ({
        request_id: r.id,
        actor_id: r.requester_id,
        from_status: "open",
        to_status: "expired",
        note: "Auto-expired: request time elapsed",
      }))
    );
  }

  const { data: requests } = await supabase
    .from("requests")
    .select("id,item_text,max_offer_cents,status,expires_at,locations(name),profiles!requests_requester_id_fkey(first_name,rating_avg)")
    .in("status", ["open", "accepted", "purchasing", "picked_up", "delivered_pending_confirm"])
    .order("created_at", { ascending: false })
    .limit(20);

  const normalized = (requests ?? []).map((request) => ({
    ...request,
    locations: Array.isArray(request.locations) ? request.locations[0] : request.locations,
    profiles: Array.isArray(request.profiles) ? request.profiles[0] : request.profiles
  }));

  return (
    <section>
      <div className="section-hero">
        <h1 className="font-serif text-4xl font-bold tracking-tight mb-4">
          Campus Food Runner Forum
        </h1>
        <p className="text-base mb-2" style={{ maxWidth: "36rem", color: "var(--gray-3)" }}>
          Verified Davidson users can post food requests and students who
          wish to sell their excess Dining Dollars/Meal Swipes can fulfill them.
        </p>
        <p className="text-xs text-muted mb-6">
          By using WildcatEats, you acknowledge this is an independent student marketplace.
        </p>
        <Link href="/requests/new" className="btn btn-primary">
          Post a Request
        </Link>
      </div>

      <DiningHours />

      <div id="requests" className="grid gap-6">
        {normalized.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
        {!normalized.length && (
          <article className="card">
            <p className="text-sm text-muted">No active requests yet. Post the first one.</p>
          </article>
        )}
      </div>
    </section>
  );
}
