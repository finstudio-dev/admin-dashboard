"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateOrgSettings } from "@/app/actions";

export default function SettingsForm({
  initialName,
  initialLogoUrl,
}: {
  initialName: string;
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(initialName);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) {
      setError("Group name can't be empty.");
      return;
    }
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        let logoUrl: string | undefined;

        if (logoFile) {
          const supabase = createClient();
          const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
          const path = `logo-${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("branding")
            .upload(path, logoFile, { upsert: true, contentType: logoFile.type || "image/png" });
          if (uploadError) throw new Error(uploadError.message);

          const { data } = supabase.storage.from("branding").getPublicUrl(path);
          logoUrl = data.publicUrl;
        }

        await updateOrgSettings({ orgName: orgName.trim(), logoUrl });
        setLogoFile(null);
        setMessage("Saved.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save settings.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div>
        <label htmlFor="org-name" className="mb-1 block text-xs font-medium text-neutral-500">
          Group name
        </label>
        <input
          id="org-name"
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-2.5 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          placeholder="e.g. Ababil Savings Fund"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Shown in the dashboard header and on the sign-in page.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Logo</label>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-neutral-400">No logo</span>
            )}
          </div>
          <label className="cursor-pointer rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
            Choose image
            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
          </label>
        </div>
        <p className="mt-1 text-xs text-neutral-400">PNG or JPG, square images look best.</p>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {message && !error && <p className="text-xs text-emerald-600">{message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
