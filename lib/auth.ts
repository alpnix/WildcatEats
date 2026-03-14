import { DAVIDSON_EMAIL_DOMAIN } from "@/lib/constants";
import type { AuthedUser } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function isValidDavidsonEmail(email: string): boolean {
  return email.toLowerCase().endsWith(DAVIDSON_EMAIL_DOMAIN);
}

export async function getCurrentUserOrThrow(): Promise<AuthedUser> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user?.email || !isValidDavidsonEmail(user.email)) {
    throw new Error("Unauthorized. Use a valid @davidson.edu account.");
  }

  return {
    id: user.id,
    email: user.email
  };
}

export async function assertAdminOrThrow(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", userId).single();

  if (error || !data?.is_admin) {
    throw new Error("Admin access required.");
  }
}
