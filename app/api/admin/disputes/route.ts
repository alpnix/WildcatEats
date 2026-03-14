import { NextRequest } from "next/server";
import { assertAdminOrThrow, getCurrentUserOrThrow } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUserOrThrow();
    await assertAdminOrThrow(user.id);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("disputes")
      .select("id,request_id,opened_by,reason,status,created_at,requests(status,max_offer_cents,requester_id,runner_id,item_text)")
      .in("status", ["open", "under_review"])
      .order("created_at", { ascending: true });

    if (error) {
      return jsonError(error.message, 500);
    }

    return jsonOk({ disputes: data ?? [] });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}
