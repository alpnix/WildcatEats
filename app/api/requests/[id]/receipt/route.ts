import { NextRequest } from "next/server";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { parseBody, asNumber } from "@/lib/request-body";
import { receiptUploadSchema } from "@/lib/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestById } from "@/lib/requests/repository";

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

    if (requestRecord.runner_id !== user.id) {
      return jsonError("Only assigned runner can upload receipt.", 403);
    }

    const body = await parseBody(request);
    const parsed = receiptUploadSchema.safeParse({
      storagePath: body.storagePath,
      merchantTotalCents: asNumber(body.merchantTotalCents)
    });

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid receipt payload.");
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("receipts").upsert(
      {
        request_id: params.id,
        runner_id: user.id,
        storage_path: parsed.data.storagePath,
        merchant_total_cents: parsed.data.merchantTotalCents ?? null
      },
      {
        onConflict: "request_id"
      }
    );

    if (error) {
      return jsonError(error.message, 500);
    }

    return jsonOk({ uploaded: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to upload receipt.", 400);
  }
}
