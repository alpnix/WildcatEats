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

const labels: Record<RequestStatus, string> = {
  open: "Request Open",
  accepted: "Request Accepted",
  purchasing: "Request Purchasing",
  picked_up: "Request Picked Up",
  delivered_pending_confirm: "Delivery Pending",
  completed: "Request Completed",
  canceled: "Request Canceled",
  disputed: "Request Disputed",
  expired: "Request Expired"
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={clsx("pill", pillClass[status])}>
      {labels[status]}
    </span>
  );
}
