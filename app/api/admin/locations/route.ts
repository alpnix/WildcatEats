import { NextRequest } from "next/server";
import { assertAdminOrThrow, getCurrentUserOrThrow } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { parseBody, asNumber } from "@/lib/request-body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUserOrThrow();
    await assertAdminOrThrow(user.id);

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("locations").select("*").order("sort_order", { ascending: true });

    if (error) {
      return jsonError(error.message, 500);
    }

    return jsonOk({ locations: data ?? [] });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserOrThrow();
    await assertAdminOrThrow(user.id);

    const body = await parseBody(request);
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return jsonError("Location name is required.");
    }

    const supabase = createSupabaseAdminClient();

    const payload = {
      name,
      campus_area: typeof body.campusArea === "string" ? body.campusArea : null,
      hours_text: typeof body.hoursText === "string" ? body.hoursText : null,
      hours_url: typeof body.hoursUrl === "string" ? body.hoursUrl : null,
      active: typeof body.active === "boolean" ? body.active : true,
      sort_order: asNumber(body.sortOrder) ?? 100
    };

    const id = typeof body.id === "string" ? body.id : null;

    const result = id
      ? await supabase.from("locations").update(payload).eq("id", id).select("*").single()
      : await supabase.from("locations").insert(payload).select("*").single();

    if (result.error) {
      return jsonError(result.error.message, 500);
    }

    return jsonOk({ location: result.data }, id ? 200 : 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to save location.", 400);
  }
}
