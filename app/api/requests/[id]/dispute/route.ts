import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { updateRequestStatus, getRequestById } from "@/lib/requests/repository";
import { jsonError, jsonOk } from "@/lib/response";
import { parseBody } from "@/lib/request-body";
import { disputeSchema } from "@/lib/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUserOrThrow();
    const requestRecord = await getRequestById(params.id);

    if (!requestRecord) {
      return jsonError("Request not found.", 404);
    }

    if (![requestRecord.requester_id, requestRecord.runner_id].includes(user.id)) {
      return jsonError("Only the requester or runner can open a dispute.", 403);
    }

    const body = await parseBody(request);
    const parsed = disputeSchema.safeParse({ reason: body.reason });

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid dispute reason.");
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("disputes").insert({
      request_id: params.id,
      opened_by: user.id,
      reason: parsed.data.reason,
      status: "open"
    });

    if (error) {
      return jsonError(error.message, 500);
    }

    if (requestRecord.status !== "disputed") {
      await updateRequestStatus({
        requestId: params.id,
        fromStatus: requestRecord.status,
        toStatus: "disputed",
        actorId: user.id,
        note: "Dispute opened"
      });
    }

    const otherPartyId = user.id === requestRecord.requester_id ? requestRecord.runner_id : requestRecord.requester_id;

    if (otherPartyId) {
      await createNotification({
        userId: otherPartyId,
        type: "dispute_opened",
        payload: { requestId: params.id }
      });
    }

    return jsonOk({ disputed: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to open dispute.", 400);
  }
}
