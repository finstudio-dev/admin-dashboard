"use client";

import { useState, useTransition } from "react";
import {
  approveMemberVerification,
  rejectMemberVerification,
  getVerificationPhotoUrl,
} from "@/app/actions";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/lib/types";

function PhotoLink({ label, path }: { label: string; path: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!path) return <span className="text-xs text-neutral-400">{label}: not provided</span>;

  async function handleView() {
    setLoading(true);
    setError(null);
    try {
      const url = await getVerificationPhotoUrl(path as string);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load photo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleView}
        disabled={loading}
        className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
      >
        {loading ? "Loading..." : `View ${label} →`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function VerificationReview({ member }: { member: Profile }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      try {
        await approveMemberVerification(member.id, note || undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      try {
        await rejectMemberVerification(member.id, note);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  // Nothing submitted yet — give the admin a manual override, but otherwise
  // there's nothing to review.
  if (!member.verification_submitted_at) {
    if (member.status !== "pending") return null;
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-sm font-medium text-neutral-900">Identity verification</h3>
        <p className="mt-1 text-xs text-neutral-500">
          This member hasn&apos;t submitted their verification info (address, NID, photos) yet.
        </p>
        <button
          onClick={handleApprove}
          disabled={pending}
          className="mt-3 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Activate anyway (skip verification)
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-900">Identity verification</h3>
        <span className="text-xs text-neutral-400">
          Submitted {formatDate(member.verification_submitted_at)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-neutral-500">Address</dt>
          <dd className="text-neutral-900">{member.address || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">NID number</dt>
          <dd className="text-neutral-900">{member.nid_number || "—"}</dd>
        </div>
      </dl>

      <div className="mt-3 flex gap-4">
        <PhotoLink label="passport-size photo" path={member.photo_url} />
        <PhotoLink label="NID front side" path={member.nid_photo_url} />
      </div>

      {member.status === "rejected" && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700">
          <p className="font-medium">Previously rejected{member.reviewed_at ? ` (${formatDate(member.reviewed_at)})` : ""}</p>
          {member.review_note && <p className="mt-1">&ldquo;{member.review_note}&rdquo;</p>}
        </div>
      )}

      {member.status === "active" && (
        <div className="mt-3 rounded-md bg-emerald-50 p-3 text-xs text-emerald-700">
          Approved{member.reviewed_at ? ` on ${formatDate(member.reviewed_at)}` : ""}.
        </div>
      )}

      {member.status === "pending" && (
        <div className="mt-4 space-y-2 border-t border-neutral-100 pt-3">
          <label htmlFor={`verify-note-${member.id}`} className="block text-xs font-medium text-neutral-500">
            Note (required if rejecting, shown to the member)
          </label>
          <input
            id={`verify-note-${member.id}`}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. NID photo is blurry, please retake"
            className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 focus:border-neutral-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={pending}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={pending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
