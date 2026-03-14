import { NextRequest } from "next/server";
import { z } from "zod";
import { assertAdminOrThrow, getCurrentUserOrThrow } from "@/lib/auth";
import { refundRequester, releaseRunnerPayout } from "@/lib/payments";
import { updateRequestStatus } from "@/lib/requests/repository";
import { jsonError, jsonOk } from "@/lib/response";
import { parseBody, asNumber } from "@/lib/request-body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const resolveSchema = z.object({
  outcome: z.enum(["requester_refund", "runner_payout", "split"]),
  splitPercentRunner: z.number().min(0).max(1).optional(),
  note: z.string().min(4).max(400)
});

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUserOrThrow();
    await assertAdminOrThrow(user.id);

    const body = await parseBody(request);
    const parsed = resolveSchema.safeParse({
      outcome: body.outcome,
      splitPercentRunner: asNumber(body.splitPercentRunner),
      note: body.note
    });

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid resolution payload.");
    }

    const supabase = createSupabaseAdminClient();
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .select("id,request_id,status,requests(id,status,max_offer_cents)")
      .eq("id", params.id)
      .maybeSingle();

    if (disputeError || !dispute) {
      return jsonError("Dispute not found.", 404);
    }

    if (!["open", "under_review"].includes(dispute.status)) {
      return jsonError("Dispute is already resolved.", 409);
    }

    const rawRequest = Array.isArray(dispute.requests) ? dispute.requests[0] : dispute.requests;
    const requestRecord = rawRequest as { id: string; status: string; max_offer_cents: number } | null;

    if (!requestRecord) {
      return jsonError("Dispute request record not found.", 404);
    }

    if (parsed.data.outcome === "requester_refund") {
      const { data: payment } = await supabase
        .from("payments")
        .select("amount_cents")
        .eq("request_id", requestRecord.id)
        .maybeSingle();

      if (payment?.amount_cents) {
        await refundRequester({
          requestId: requestRecord.id,
          refundAmountCents: payment.amount_cents,
          reason: "requested_by_customer"
        });
      }

      if (requestRecord.status === "disputed") {
        await updateRequestStatus({
          requestId: requestRecord.id,
          fromStatus: "disputed",
          toStatus: "canceled",
          actorId: user.id,
          note: parsed.data.note
        });
      }
    }

    if (parsed.data.outcome === "runner_payout") {
      if (requestRecord.status === "disputed") {
        await updateRequestStatus({
          requestId: requestRecord.id,
          fromStatus: "disputed",
          toStatus: "completed",
          actorId: user.id,
          note: parsed.data.note
        });
      }

      await releaseRunnerPayout(requestRecord.id);
    }

    if (parsed.data.outcome === "split") {
      const split = parsed.data.splitPercentRunner ?? 0.5;
      const runnerAmount = Math.floor(requestRecord.max_offer_cents * split);

      if (runnerAmount > 0) {
        await releaseRunnerPayout(requestRecord.id, runnerAmount);
      }

      const { data: payment } = await supabase
        .from("payments")
        .select("amount_cents")
        .eq("request_id", requestRecord.id)
        .maybeSingle();

      if (payment?.amount_cents) {
        const refundAmount = Math.max(0, payment.amount_cents - runnerAmount);
        if (refundAmount > 0) {
          await refundRequester({
            requestId: requestRecord.id,
            refundAmountCents: refundAmount,
            reason: "requested_by_customer"
          });
        }
      }

      if (requestRecord.status === "disputed") {
        await updateRequestStatus({
          requestId: requestRecord.id,
          fromStatus: "disputed",
          toStatus: "completed",
          actorId: user.id,
          note: parsed.data.note
        });
      }
    }

    const disputeStatus =
      parsed.data.outcome === "requester_refund"
        ? "resolved_requester"
        : parsed.data.outcome === "runner_payout"
          ? "resolved_runner"
          : "split_resolution";

    const { error: closeError } = await supabase
      .from("disputes")
      .update({
        status: disputeStatus,
        resolved_by: user.id,
        resolution_note: parsed.data.note,
        resolved_at: new Date().toISOString()
      })
      .eq("id", params.id);

    if (closeError) {
      return jsonError(closeError.message, 500);
    }

    return jsonOk({ resolved: true, outcome: parsed.data.outcome });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to resolve dispute.", 400);
  }
}
