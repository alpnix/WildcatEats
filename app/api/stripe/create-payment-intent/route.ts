import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { parseBody } from "@/lib/request-body";
import { paymentIntentSchema } from "@/lib/types";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return jsonError("Payments are not configured yet. Please add Stripe keys.", 503);
    }
    const user = await getCurrentUserOrThrow();
    const body = await parseBody(request);

    const parsed = paymentIntentSchema.safeParse({
      requestId: body.requestId
    });

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid request ID.");
    }

    const supabase = createSupabaseAdminClient();
    const stripe = getStripe();

    const { data: requestRecord, error: requestError } = await supabase
      .from("requests")
      .select("id,requester_id,max_offer_cents,processing_fee_cents,status")
      .eq("id", parsed.data.requestId)
      .maybeSingle();

    if (requestError || !requestRecord) {
      return jsonError("Request not found.", 404);
    }

    if (requestRecord.requester_id !== user.id) {
      return jsonError("Only requester can initialize payment.", 403);
    }

    if (!["accepted", "purchasing", "picked_up", "delivered_pending_confirm"].includes(requestRecord.status)) {
      return jsonError("Payment can only be prepared after runner acceptance.", 409);
    }

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id,stripe_payment_intent_id,status")
      .eq("request_id", parsed.data.requestId)
      .maybeSingle();

    if (existingPayment?.stripe_payment_intent_id) {
      const intent = await stripe.paymentIntents.retrieve(existingPayment.stripe_payment_intent_id);
      return jsonOk({
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        status: intent.status,
        amountCents: requestRecord.max_offer_cents + requestRecord.processing_fee_cents
      });
    }

    const total = requestRecord.max_offer_cents + requestRecord.processing_fee_cents;

    const intent = await stripe.paymentIntents.create(
      {
        amount: total,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          requestId: requestRecord.id,
          requesterId: user.id
        }
      },
      {
        idempotencyKey: `pi:${requestRecord.id}`
      }
    );

    const { error: upsertError } = await supabase.from("payments").upsert(
      {
        request_id: requestRecord.id,
        stripe_payment_intent_id: intent.id,
        amount_cents: total,
        processing_fee_cents: requestRecord.processing_fee_cents,
        runner_payout_cents: requestRecord.max_offer_cents,
        status: intent.status
      },
      { onConflict: "request_id" }
    );

    if (upsertError) {
      return jsonError(upsertError.message, 500);
    }

    return jsonOk({
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
      amountCents: total
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create payment intent.", 400);
  }
}
