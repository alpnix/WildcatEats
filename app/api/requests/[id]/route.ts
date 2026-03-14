import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { addStatusEvent } from "@/lib/requests/repository";
import { jsonError, jsonOk } from "@/lib/response";
import { asNumber, parseBody } from "@/lib/request-body";
import { calculateProcessingFeeCents } from "@/lib/stripe/fees";
import { createRequestSchema } from "@/lib/types";
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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUserOrThrow();
    const body = await parseBody(request);
    const parsed = createRequestSchema.safeParse({
      locationId: body.locationId,
      itemText: body.itemText,
      maxOfferCents: asNumber(body.maxOfferCents),
      expiresInMinutes: asNumber(body.expiresInMinutes)
    });

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid request payload.");
    }

    const supabase = createSupabaseAdminClient();
    const { data: current, error: currentError } = await supabase
      .from("requests")
      .select("id,requester_id,status")
      .eq("id", params.id)
      .maybeSingle();

    if (currentError) {
      return jsonError(currentError.message, 500);
    }

    if (!current) {
      return jsonError("Request not found.", 404);
    }

    if (current.requester_id !== user.id) {
      return jsonError("Only the requester can edit this request.", 403);
    }

    if (current.status !== "open") {
      return jsonError("Only open requests can be edited.", 409);
    }

    const expiresAt = new Date(Date.now() + parsed.data.expiresInMinutes * 60_000).toISOString();
    const processingFeeCents = calculateProcessingFeeCents(parsed.data.maxOfferCents);

    const { error: updateError } = await supabase
      .from("requests")
      .update({
        location_id: parsed.data.locationId,
        item_text: parsed.data.itemText,
        max_offer_cents: parsed.data.maxOfferCents,
        processing_fee_cents: processingFeeCents,
        expires_at: expiresAt
      })
      .eq("id", params.id);

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    await addStatusEvent({
      requestId: params.id,
      actorId: user.id,
      fromStatus: "open",
      toStatus: "open",
      note: "Request edited"
    });

    return jsonOk({ requestId: params.id });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUserOrThrow();
    const supabase = createSupabaseAdminClient();

    const { data: current, error: currentError } = await supabase
      .from("requests")
      .select("id,requester_id,status")
      .eq("id", params.id)
      .maybeSingle();

    if (currentError) {
      return jsonError(currentError.message, 500);
    }

    if (!current) {
      return jsonError("Request not found.", 404);
    }

    if (current.requester_id !== user.id) {
      return jsonError("Only the requester can delete this request.", 403);
    }

    if (current.status !== "open") {
      return jsonError("Only open requests can be deleted.", 409);
    }

    const { error: deleteError } = await supabase.from("requests").delete().eq("id", params.id);

    if (deleteError) {
      return jsonError(deleteError.message, 500);
    }

    return jsonOk({ requestId: params.id });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}
