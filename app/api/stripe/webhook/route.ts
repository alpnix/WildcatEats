import { NextRequest } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/response";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function hasEventBeenProcessed(eventId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("webhook_events").select("stripe_event_id").eq("stripe_event_id", eventId).maybeSingle();
  return Boolean(data?.stripe_event_id);
}

async function markEventProcessed(event: Stripe.Event, status: "processed" | "ignored" | "failed", errorText?: string) {
  const supabase = createSupabaseAdminClient();

  await supabase.from("webhook_events").upsert(
    {
      stripe_event_id: event.id,
      type: event.type,
      status,
      processed_at: new Date().toISOString(),
      error_text: errorText ?? null
    },
    {
      onConflict: "stripe_event_id"
    }
  );
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  const supabase = createSupabaseAdminClient();

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await supabase
        .from("profiles")
        .update({
          connect_charges_enabled: account.charges_enabled,
          connect_payouts_enabled: account.payouts_enabled
        })
        .eq("stripe_connect_account_id", account.id);
      break;
    }

    case "payment_intent.processing":
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const nextStatus =
        event.type === "payment_intent.succeeded"
          ? "succeeded"
          : event.type === "payment_intent.processing"
            ? "processing"
            : "requires_payment_method";

      await supabase
        .from("payments")
        .update({
          status: nextStatus,
          stripe_charge_id: typeof intent.latest_charge === "string" ? intent.latest_charge : null
        })
        .eq("stripe_payment_intent_id", intent.id);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await supabase
        .from("payments")
        .update({
          status: charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded"
        })
        .eq("stripe_charge_id", charge.id);
      break;
    }

    default: {
      // Intentionally ignored for MVP.
      break;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured() || !env.STRIPE_WEBHOOK_SECRET) {
      return jsonError("Stripe webhooks are not configured.", 503);
    }

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return jsonError("Missing Stripe signature", 400);
    }

    const rawBody = await request.text();
    const stripe = getStripe();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      return jsonError(
        error instanceof Error ? `Webhook signature verification failed: ${error.message}` : "Webhook validation failed.",
        400
      );
    }

    if (await hasEventBeenProcessed(event.id)) {
      return jsonOk({ received: true, duplicate: true });
    }

    try {
      await handleEvent(event);
      await markEventProcessed(event, "processed");
      return jsonOk({ received: true });
    } catch (error) {
      await markEventProcessed(event, "failed", error instanceof Error ? error.message : "Unknown webhook handler error");
      return jsonError(error instanceof Error ? error.message : "Webhook handler error", 500);
    }
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Webhook error", 500);
  }
}
