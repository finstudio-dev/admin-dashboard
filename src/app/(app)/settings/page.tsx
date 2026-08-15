import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/SettingsForm";
import type { OrgSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("org_settings").select("*").eq("id", true).single();
  const s = settings as OrgSettings | null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Settings</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Customize how the fund&apos;s name and logo appear across the dashboard.
        </p>
      </div>

      <SettingsForm initialName={s?.org_name ?? "Fund Admin"} initialLogoUrl={s?.logo_url ?? null} />
    </div>
  );
}
