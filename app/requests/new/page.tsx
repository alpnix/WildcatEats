import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewRequestForm } from "@/components/new-request-form";

export default async function NewRequestPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return <NewRequestForm />;
}
