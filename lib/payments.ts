import { createNotification } from "@/lib/notifications";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getPaymentBundle(requestId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("id, requester_id, runner_id, max_offer_cents, status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) {
    throw new Error("Request not found.");
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();

  if (paymentError || !payment) {
    throw new Error("Payment not found.");
  }

  const { data: runnerProfile, error: runnerError } = await supabase
    .from("profiles")
    .select("id, email, stripe_connect_account_id")
    .eq("id", request.runner_id)
    .maybeSingle();

  if (runnerError || !runnerProfile) {
    throw new Error("Runner profile not found.");
  }

  return { request, payment, runnerProfile };
}

export async function releaseRunnerPayout(requestId: string, payoutAmountCents?: number): Promise<void> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Cannot release payout.");
  }

  const supabase = createSupabaseAdminClient();
  const stripe = getStripe();
  const { request, payment, runnerProfile } = await getPaymentBundle(requestId);

  if (payment.status === "released" || payment.stripe_transfer_id) {
    return;
  }

  if (payment.status !== "succeeded" && payment.status !== "release_pending") {
    throw new Error("Payment is not ready for release.");
  }

  if (!runnerProfile.stripe_connect_account_id) {
    throw new Error("Runner has no Stripe connected account.");
  }

  const payoutAmount = payoutAmountCents ?? request.max_offer_cents;
  if (payoutAmount <= 0) {
    throw new Error("Payout amount must be greater than zero.");
  }

  const transfer = await stripe.transfers.create(
    {
      amount: payoutAmount,
      currency: "usd",
      destination: runnerProfile.stripe_connect_account_id,
      metadata: {
        requestId,
        paymentId: payment.id
      }
    },
    {
      idempotencyKey: `transfer:${requestId}`
    }
  );

  const { error } = await supabase
    .from("payments")
    .update({
      stripe_transfer_id: transfer.id,
      status: "released"
    })
    .eq("id", payment.id);

  if (error) {
    throw new Error(error.message);
  }

  await createNotification({
    userId: runnerProfile.id,
    type: "payout_released",
    payload: { requestId, transferId: transfer.id },
    email: runnerProfile.email,
    emailSubject: "WildcatEats payout released",
    emailHtml: `<p>Your payout for request <strong>${requestId}</strong> has been released.</p>`
  });
}

export async function refundRequester(input: {
  requestId: string;
  refundAmountCents: number;
  reason: "requested_by_customer" | "duplicate" | "fraudulent";
}): Promise<void> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Cannot process refund.");
  }

  const supabase = createSupabaseAdminClient();
  const stripe = getStripe();

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("request_id", input.requestId)
    .maybeSingle();

  if (paymentError || !payment || !payment.stripe_charge_id) {
    throw new Error("No refundable payment found.");
  }

  await stripe.refunds.create(
    {
      charge: payment.stripe_charge_id,
      amount: input.refundAmountCents,
      reason: input.reason,
      metadata: { requestId: input.requestId }
    },
    {
      idempotencyKey: `refund:${input.requestId}:${input.refundAmountCents}`
    }
  );

  const isFullRefund = input.refundAmountCents >= payment.amount_cents;

  const { error } = await supabase
    .from("payments")
    .update({ status: isFullRefund ? "refunded" : "partially_refunded" })
    .eq("id", payment.id);

  if (error) {
    throw new Error(error.message);
  }
}
