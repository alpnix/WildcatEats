import { NextRequest } from "next/server";
import { isValidDavidsonEmail } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { parseBody } from "@/lib/request-body";

export async function POST(request: NextRequest) {
  const body = await parseBody(request);
  const email = typeof body.email === "string" ? body.email : "";

  if (!email) {
    return jsonError("Email is required.");
  }

  return jsonOk({
    email,
    valid: isValidDavidsonEmail(email),
    message: isValidDavidsonEmail(email)
      ? "Email domain accepted."
      : "Use a valid @davidson.edu email address."
  });
}
