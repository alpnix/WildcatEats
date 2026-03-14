import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { env } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/response";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return jsonError("Payments are not configured yet. Please add Stripe keys.", 503);
    }
    const user = await getCurrentUserOrThrow();
    const stripe = getStripe();
    const supabase = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,email,stripe_connect_account_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return jsonError("Profile not found.", 404);
    }

    let accountId = profile.stripe_connect_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: profile.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true }
        },
        business_type: "individual",
        metadata: { userId: user.id }
      });

      accountId = account.id;

      const { error } = await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", user.id);

      if (error) {
        return jsonError(error.message, 500);
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${env.APP_URL}/my?onboarding=refresh`,
      return_url: `${env.APP_URL}/my?onboarding=return`,
      type: "account_onboarding"
    });

    return jsonOk({
      onboardingUrl: accountLink.url,
      accountId
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to create onboarding link.", 400);
  }
}
