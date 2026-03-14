import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { releaseRunnerPayout } from "@/lib/payments";
import { updateRequestStatus } from "@/lib/requests/repository";
import { jsonError, jsonOk } from "@/lib/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const cronSecret = env.APP_CRON_SECRET;

  if (cronSecret) {
    const incoming = request.headers.get("x-cron-secret");
    if (!incoming || incoming !== cronSecret) {
      return jsonError("Unauthorized.", 401);
    }
  }

  const supabase = createSupabaseAdminClient();

  const { data: due, error } = await supabase
    .from("requests")
    .select("id,status,requester_id")
    .eq("status", "delivered_pending_confirm")
    .lte("auto_release_at", new Date().toISOString());

  if (error) {
    return jsonError(error.message, 500);
  }

  const released: string[] = [];
  const skipped: string[] = [];

  for (const requestRow of due ?? []) {
    const { data: openDispute } = await supabase
      .from("disputes")
      .select("id")
      .eq("request_id", requestRow.id)
      .in("status", ["open", "under_review"])
      .maybeSingle();

    if (openDispute) {
      skipped.push(requestRow.id);
      continue;
    }

    await updateRequestStatus({
      requestId: requestRow.id,
      fromStatus: "delivered_pending_confirm",
      toStatus: "completed",
      actorId: requestRow.requester_id,
      note: "Auto-release completed after 24h timeout"
    });

    await releaseRunnerPayout(requestRow.id);
    released.push(requestRow.id);
  }

  return jsonOk({ released, skipped });
}
