import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { refundRequester } from "@/lib/payments";
import { cancellationOutcomeFor } from "@/lib/requests/state-machine";
import { getRequestById, updateRequestStatus } from "@/lib/requests/repository";
import { jsonError, jsonOk } from "@/lib/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUserOrThrow();
    const current = await getRequestById(params.id);

    if (!current) {
      return jsonError("Request not found.", 404);
    }

    if (current.requester_id !== user.id) {
      return jsonError("Only requester can cancel.", 403);
    }

    const outcome = cancellationOutcomeFor(current.status);

    if (outcome.requiresAdminReview) {
      const supabase = createSupabaseAdminClient();
      await supabase.from("disputes").insert({
        request_id: params.id,
        opened_by: user.id,
        reason: "Cancellation requested in a protected state.",
        status: "open"
      });

      await updateRequestStatus({
        requestId: params.id,
        fromStatus: current.status,
        toStatus: "disputed",
        actorId: user.id,
        note: "Cancellation escalated for admin review"
      });

      return jsonOk({ disputed: true, note: outcome.note });
    }

    await updateRequestStatus({
      requestId: params.id,
      fromStatus: current.status,
      toStatus: "canceled",
      actorId: user.id,
      note: "Requester canceled order"
    });

    const { data: payment } = await createSupabaseAdminClient()
      .from("payments")
      .select("amount_cents,status")
      .eq("request_id", params.id)
      .maybeSingle();

    if (payment && (payment.status === "succeeded" || payment.status === "release_pending" || payment.status === "processing")) {
      const refundAmount = Math.floor(payment.amount_cents * outcome.requesterRefundRatio);

      if (refundAmount > 0) {
        await refundRequester({
          requestId: params.id,
          refundAmountCents: refundAmount,
          reason: "requested_by_customer"
        });
      }
    }

    return jsonOk({ canceled: true, policy: outcome });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to cancel request.", 400);
  }
}
