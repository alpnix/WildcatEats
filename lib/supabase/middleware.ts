import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: { [key: string]: unknown }) {
        request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set(name, value, options);
      },
      remove(name: string, options: { [key: string]: unknown }) {
        request.cookies.set(name, "");
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set(name, "", { ...options, maxAge: 0 });
      }
    }
  });

  return { supabase, response: () => response };
}
