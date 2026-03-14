import { clsx } from "clsx";
import type { RequestStatus } from "@/lib/types";

interface StatusPillProps {
  status: RequestStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const classes: Record<RequestStatus, string> = {
    open: "bg-mint/20 text-forest",
    accepted: "bg-amber-100 text-amber-800",
    purchasing: "bg-amber-100 text-amber-800",
    picked_up: "bg-sky-100 text-sky-800",
    delivered_pending_confirm: "bg-purple-100 text-purple-800",
    completed: "bg-emerald-100 text-emerald-800",
    canceled: "bg-zinc-200 text-zinc-700",
    disputed: "bg-rose-100 text-rose-800",
    expired: "bg-zinc-200 text-zinc-700"
  };

  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize", classes[status])}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
