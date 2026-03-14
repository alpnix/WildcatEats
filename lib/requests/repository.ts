import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RequestStatus } from "@/lib/types";

export async function getRequestById(requestId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function addStatusEvent(input: {
  requestId: string;
  actorId: string;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  note?: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("request_status_events").insert({
    request_id: input.requestId,
    actor_id: input.actorId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    note: input.note ?? null
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateRequestStatus(input: {
  requestId: string;
  fromStatus: RequestStatus;
  toStatus: RequestStatus;
  actorId: string;
  note?: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("requests")
    .update({ status: input.toStatus })
    .eq("id", input.requestId)
    .eq("status", input.fromStatus)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Unable to update request status due to stale state.");
  }

  await addStatusEvent({
    requestId: input.requestId,
    actorId: input.actorId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    note: input.note
  });

  return data;
}
