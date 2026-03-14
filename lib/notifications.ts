import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface NotifyArgs {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  email?: string;
  emailSubject?: string;
  emailHtml?: string;
}

export async function createNotification(args: NotifyArgs): Promise<void> {
  const supabase = createSupabaseAdminClient();

  await supabase.from("notifications").insert({
    user_id: args.userId,
    type: args.type,
    payload: args.payload
  });

  if (!env.RESEND_API_KEY || !args.email || !args.emailSubject || !args.emailHtml) {
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "WildcatEats <no-reply@wildcateats.app>",
      to: args.email,
      subject: args.emailSubject,
      html: args.emailHtml
    })
  });
}
