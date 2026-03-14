import { z } from "zod";
import { DISPUTE_STATUSES, PAYMENT_STATUSES, REQUEST_STATUSES } from "@/lib/constants";

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const createRequestSchema = z.object({
  locationId: z.string().uuid(),
  itemText: z.string().min(6).max(400),
  maxOfferCents: z.number().int().min(200).max(10000),
  expiresInMinutes: z.number().int().min(1).max(240).default(45)
});

export const statusUpdateSchema = z.object({
  status: z.enum(["purchasing", "picked_up", "delivered_pending_confirm"])
});

export const receiptUploadSchema = z.object({
  storagePath: z.string().min(5),
  merchantTotalCents: z.number().int().min(0).max(10000).optional()
});

export const disputeSchema = z.object({
  reason: z.string().min(10).max(500)
});

export const paymentIntentSchema = z.object({
  requestId: z.string().uuid()
});

export interface AuthedUser {
  id: string;
  email: string;
}

export interface CancellationOutcome {
  requesterRefundRatio: number;
  runnerPayoutRatio: number;
  requiresAdminReview: boolean;
  note: string;
}
