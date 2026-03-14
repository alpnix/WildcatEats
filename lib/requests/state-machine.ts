import { type CancellationOutcome, type RequestStatus } from "@/lib/types";

const transitions: Record<RequestStatus, RequestStatus[]> = {
  open: ["accepted", "canceled", "expired"],
  accepted: ["purchasing", "canceled", "disputed"],
  purchasing: ["picked_up", "canceled", "disputed"],
  picked_up: ["delivered_pending_confirm", "disputed"],
  delivered_pending_confirm: ["completed", "disputed"],
  completed: [],
  canceled: [],
  disputed: [],
  expired: []
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return transitions[from].includes(to);
}

export function cancellationOutcomeFor(status: RequestStatus): CancellationOutcome {
  if (status === "open" || status === "accepted") {
    return {
      requesterRefundRatio: 1,
      runnerPayoutRatio: 0,
      requiresAdminReview: false,
      note: "Full refund before purchase is started."
    };
  }

  if (status === "purchasing") {
    return {
      requesterRefundRatio: 0.5,
      runnerPayoutRatio: 0.5,
      requiresAdminReview: false,
      note: "Partial refund split once runner has started purchasing."
    };
  }

  return {
    requesterRefundRatio: 0,
    runnerPayoutRatio: 0,
    requiresAdminReview: true,
    note: "Requires admin review after pickup/delivery stages."
  };
}
