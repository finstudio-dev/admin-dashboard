import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";
import type { OrgSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("org_settings").select("*").eq("id", true).single();
  const org = settings as OrgSettings | null;

  return <LoginForm orgName={org?.org_name || "Fund Admin"} logoUrl={org?.logo_url ?? null} />;
}
