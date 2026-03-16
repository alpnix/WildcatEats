import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RequestCard } from "@/components/request-card";
import { ConnectOnboardingButton } from "@/components/connect-onboarding-button";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const admin = createSupabaseAdminClient();

  const [{ data: myRequests }, { data: myRuns }] = await Promise.all([
    admin
      .from("requests")
      .select(
        "id,item_text,max_offer_cents,status,expires_at,locations(name),profiles!requests_requester_id_fkey(first_name,rating_avg)"
      )
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("requests")
      .select(
        "id,item_text,max_offer_cents,status,expires_at,locations(name),profiles!requests_requester_id_fkey(first_name,rating_avg)"
      )
      .eq("runner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  const normalize = (rows: typeof myRequests) =>
    (rows ?? []).map((r) => ({
      ...r,
      locations: Array.isArray(r.locations) ? r.locations[0] : r.locations,
      profiles: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    }));

  const requests = normalize(myRequests);
  const runs = normalize(myRuns);

  return (
    <section style={{ maxWidth: "48rem" }}>
      <div className="section-hero">
        <h1 className="font-serif text-4xl font-bold tracking-tight mb-2">My Activity</h1>
        <p className="text-sm mb-4" style={{ color: "var(--gray-3)" }}>
          Track your requests, accepted runs, payouts, and disputes.
        </p>
        <div className="flex flex-wrap gap-3">
          <ConnectOnboardingButton />
          <Link href="/requests/new" className="btn btn-primary">
            Post a Request
          </Link>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="font-serif text-2xl font-bold mb-4">My Requests</h2>
        <div className="grid gap-6">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
          {!requests.length && (
            <article className="card">
              <p className="text-sm text-muted">You have not posted any requests yet.</p>
            </article>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl font-bold mb-4">My Runs</h2>
        <div className="grid gap-6">
          {runs.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
          {!runs.length && (
            <article className="card">
              <p className="text-sm text-muted">You have not accepted any runs yet.</p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
