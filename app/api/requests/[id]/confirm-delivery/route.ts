import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { releaseRunnerPayout } from "@/lib/payments";
import { createNotification } from "@/lib/notifications";
import { canTransition } from "@/lib/requests/state-machine";
import { getRequestById, updateRequestStatus } from "@/lib/requests/repository";
import { jsonError, jsonOk } from "@/lib/response";

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUserOrThrow();
    const requestRecord = await getRequestById(params.id);

    if (!requestRecord) {
      return jsonError("Request not found.", 404);
    }

    if (requestRecord.requester_id !== user.id) {
      return jsonError("Only requester can confirm delivery.", 403);
    }

    if (!canTransition(requestRecord.status, "completed")) {
      return jsonError("Request is not ready for completion.", 409);
    }

    await updateRequestStatus({
      requestId: params.id,
      fromStatus: requestRecord.status,
      toStatus: "completed",
      actorId: user.id,
      note: "Requester confirmed delivery"
    });

    await releaseRunnerPayout(params.id);

    await createNotification({
      userId: requestRecord.runner_id,
      type: "delivery_confirmed",
      payload: { requestId: params.id }
    });

    return jsonOk({ completed: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to confirm delivery.", 400);
  }
}
