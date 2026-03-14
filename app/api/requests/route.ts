import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { addStatusEvent } from "@/lib/requests/repository";
import { jsonError, jsonOk } from "@/lib/response";
import { asNumber, parseBody } from "@/lib/request-body";
import { calculateProcessingFeeCents } from "@/lib/stripe/fees";
import { createRequestSchema } from "@/lib/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    await getCurrentUserOrThrow();
    const supabase = createSupabaseAdminClient();

    const status = request.nextUrl.searchParams.get("status");
    const locationId = request.nextUrl.searchParams.get("location_id");
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 20), 50);

    let query = supabase
      .from("requests")
      .select(
        "id,item_text,max_offer_cents,processing_fee_cents,status,expires_at,created_at,location_id,requester_id,runner_id,locations(name),profiles!requests_requester_id_fkey(first_name,rating_avg)"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data, error } = await query;

    if (error) {
      return jsonError(error.message, 500);
    }

    return jsonOk({ requests: data ?? [] });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}

export async function POST(request: NextRequest) {
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

    const expiresAt = new Date(Date.now() + parsed.data.expiresInMinutes * 60_000).toISOString();
    const autoReleaseAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    const processingFeeCents = calculateProcessingFeeCents(parsed.data.maxOfferCents);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("requests")
      .insert({
        requester_id: user.id,
        location_id: parsed.data.locationId,
        item_text: parsed.data.itemText,
        max_offer_cents: parsed.data.maxOfferCents,
        processing_fee_cents: processingFeeCents,
        status: "open",
        expires_at: expiresAt,
        auto_release_at: autoReleaseAt
      })
      .select("id,status")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    await addStatusEvent({
      requestId: data.id,
      actorId: user.id,
      fromStatus: null,
      toStatus: "open",
      note: "Request created"
    });

    return jsonOk({ requestId: data.id }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}
