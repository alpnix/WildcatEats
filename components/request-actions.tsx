"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RequestStatus } from "@/lib/types";

interface RequestActionsProps {
  requestId: string;
  requestStatus: RequestStatus;
  isRequester: boolean;
}

export function RequestActions({ requestId, requestStatus, isRequester }: RequestActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this request?");
    if (!confirmed) return;

    setDeleting(true);
    setMessage(null);

    const response = await fetch(`/api/requests/${requestId}`, {
      method: "DELETE"
    });

    const body = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(body.error ?? "Failed to delete request.");
      setDeleting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isRequester ? (
        <>
          {requestStatus === "open" ? (
            <>
              <Link
                href={`/requests/${requestId}/edit`}
                className="inline-flex rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper"
              >
                Edit Request
              </Link>
              <button
                className="rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-wide disabled:opacity-60"
                disabled={deleting}
                onClick={() => void handleDelete()}
                type="button"
              >
                {deleting ? "Deleting..." : "Delete Request"}
              </button>
            </>
          ) : null}

          {["accepted", "purchasing", "picked_up", "delivered_pending_confirm"].includes(requestStatus) ? (
            <form action="/api/stripe/create-payment-intent" method="post">
              <input type="hidden" name="requestId" value={requestId} />
              <button
                className="rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-wide"
                type="submit"
              >
                Prepare Payment
              </button>
            </form>
          ) : null}

          {requestStatus === "delivered_pending_confirm" ? (
            <form action={`/api/requests/${requestId}/confirm-delivery`} method="post">
              <button
                className="rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-bold uppercase tracking-wide"
                type="submit"
              >
                Confirm Delivery
              </button>
            </form>
          ) : null}
        </>
      ) : (
        <>
          {requestStatus === "open" ? (
            <form action={`/api/requests/${requestId}/accept`} method="post">
              <button className="rounded-full bg-cardinal px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper" type="submit">
                Accept Request
              </button>
            </form>
          ) : null}
        </>
      )}

      {message ? <p className="basis-full text-sm text-ink/85">{message}</p> : null}
    </div>
  );
}
