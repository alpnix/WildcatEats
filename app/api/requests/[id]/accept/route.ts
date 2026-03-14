import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { addStatusEvent } from "@/lib/requests/repository";
import { jsonError, jsonOk } from "@/lib/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUserOrThrow();
    const supabase = createSupabaseAdminClient();

    const { data: runnerProfile, error: runnerProfileError } = await supabase
      .from("profiles")
      .select("id,email,stripe_connect_account_id,connect_charges_enabled,connect_payouts_enabled")
      .eq("id", user.id)
      .maybeSingle();

    if (runnerProfileError || !runnerProfile) {
      return jsonError("Runner profile not found.", 404);
    }

    if (!runnerProfile.connect_charges_enabled || !runnerProfile.connect_payouts_enabled) {
      return jsonError("Complete Stripe onboarding before accepting requests.", 403);
    }

    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("id,status,requester_id")
      .eq("id", params.id)
      .maybeSingle();

    if (requestError || !request) {
      return jsonError("Request not found.", 404);
    }

    if (request.requester_id === user.id) {
      return jsonError("You cannot accept your own request.", 400);
    }

    const { data: acceptedRequestId, error: acceptError } = await supabase.rpc("accept_request_first_wins", {
      p_request_id: params.id,
      p_runner_id: user.id
    });

    if (acceptError) {
      return jsonError(acceptError.message, 500);
    }

    if (!acceptedRequestId) {
      return jsonError("Request already accepted or unavailable.", 409);
    }

    await addStatusEvent({
      requestId: params.id,
      actorId: user.id,
      fromStatus: "open",
      toStatus: "accepted",
      note: "Runner accepted request"
    });

    await createNotification({
      userId: request.requester_id,
      type: "request_accepted",
      payload: { requestId: params.id, runnerId: user.id }
    });

    return jsonOk({ requestId: params.id, status: "accepted" });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}
