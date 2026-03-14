import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/response";

export async function GET(_request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("locations")
      .select("id,name,campus_area,hours_text,hours_url")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return jsonError(error.message, 500);
    }

    return jsonOk({ locations: data ?? [] });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch locations.", 500);
  }
}
