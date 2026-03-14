import Stripe from "stripe";
import { env } from "@/lib/env";

let stripeSingleton: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments.");
  }

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil"
    });
  }

  return stripeSingleton;
}
