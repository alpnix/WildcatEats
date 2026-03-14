import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: { [key: string]: unknown }) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Route handlers and server components can be read-only for cookies.
        }
      },
      remove(name: string, options: { [key: string]: unknown }) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        } catch {
          // Route handlers and server components can be read-only for cookies.
        }
      }
    }
  });
}
