import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await getCurrentUserOrThrow();
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("requests")
      .select(
        "id,item_text,max_offer_cents,processing_fee_cents,status,expires_at,auto_release_at,created_at,requester_id,runner_id,location_id,locations(name,hours_url),profiles!requests_requester_id_fkey(first_name,rating_avg),receipts(storage_path,merchant_total_cents,uploaded_at),disputes(id,status,reason,created_at)"
      )
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      return jsonError(error.message, 500);
    }

    if (!data) {
      return jsonError("Request not found.", 404);
    }

    return jsonOk({ request: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}
