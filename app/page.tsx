import Link from "next/link";
import { RequestCard } from "@/components/request-card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseAdminClient();

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
      <div className="mb-4 rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm">
        <h1 className="font-display text-2xl text-cardinal">Campus Food Runner Forum</h1>
        <p className="text-sm text-ink/85">
          Verified Davidson users can post food requests and runners can fulfill them using Dining Dollars.
        </p>
        <p className="text-xs text-ink/75">
          By using WildcatEats, you acknowledge this is an independent student marketplace.
        </p>
        <div className="mt-3">
          <Link href="/requests/new" className="inline-flex rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper">
            Post a Request
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {normalized.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
        {!normalized.length && (
          <article className="rounded-2xl border border-ink/10 bg-paper p-4 text-sm text-ink/75 shadow-sm">
            No active requests yet. Post the first one.
          </article>
        )}
      </div>
    </section>
  );
}
