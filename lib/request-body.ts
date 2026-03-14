import { NextRequest } from "next/server";

export async function parseBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    return json;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  }

  return {};
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}
