import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { canTransition } from "@/lib/requests/state-machine";
import { getRequestById, updateRequestStatus } from "@/lib/requests/repository";
import { jsonError, jsonOk } from "@/lib/response";
import { parseBody } from "@/lib/request-body";
import { statusUpdateSchema } from "@/lib/types";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUserOrThrow();
    const body = await parseBody(request);

    const parsed = statusUpdateSchema.safeParse({
      status: body.status
    });

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid status.");
    }

    const current = await getRequestById(params.id);

    if (!current) {
      return jsonError("Request not found.", 404);
    }

    if (current.runner_id !== user.id) {
      return jsonError("Only the assigned runner can update request progress.", 403);
    }

    if (!canTransition(current.status, parsed.data.status)) {
      return jsonError(`Invalid transition from ${current.status} to ${parsed.data.status}.`, 409);
    }

    const updated = await updateRequestStatus({
      requestId: params.id,
      fromStatus: current.status,
      toStatus: parsed.data.status,
      actorId: user.id,
      note: "Runner progress update"
    });

    await createNotification({
      userId: current.requester_id,
      type: "runner_status_update",
      payload: {
        requestId: params.id,
        status: parsed.data.status
      }
    });

    return jsonOk({ request: updated });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update status.", 400);
  }
}
