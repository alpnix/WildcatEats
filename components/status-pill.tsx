import { clsx } from "clsx";
import type { RequestStatus } from "@/lib/types";

interface StatusPillProps {
  status: RequestStatus;
}

const pillClass: Record<RequestStatus, string> = {
  open: "pill-open",
  accepted: "pill-accepted",
  purchasing: "pill-purchasing",
  picked_up: "pill-picked_up",
  delivered_pending_confirm: "pill-delivered",
  completed: "pill-completed",
  canceled: "pill-canceled",
  disputed: "pill-disputed",
  expired: "pill-expired"
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={clsx("pill", pillClass[status])}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
