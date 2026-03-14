import { notFound, redirect } from "next/navigation";
import { NewRequestForm } from "@/components/new-request-form";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface EditRequestPageProps {
  params: { id: string };
}

export default async function EditRequestPage({ params }: EditRequestPageProps) {
  const authSupabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const supabase = createSupabaseAdminClient();
  const { data: request } = await supabase
    .from("requests")
    .select("id,requester_id,location_id,item_text,max_offer_cents,expires_at,status")
    .eq("id", params.id)
    .maybeSingle();

  if (!request) {
    notFound();
  }

  if (request.requester_id !== user.id) {
    redirect(`/requests/${params.id}`);
  }

  if (request.status !== "open") {
    redirect(`/requests/${params.id}`);
  }

  const expiresInMinutes = Math.max(
    1,
    Math.min(240, Math.ceil((new Date(request.expires_at).getTime() - Date.now()) / 60_000))
  );

  return (
    <NewRequestForm
      initialRequest={{
        id: request.id,
        locationId: request.location_id,
        itemText: request.item_text,
        maxOfferCents: request.max_offer_cents,
        expiresInMinutes
      }}
    />
  );
}
