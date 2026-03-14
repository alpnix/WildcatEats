export const REQUEST_STATUSES = [
  "open",
  "accepted",
  "purchasing",
  "picked_up",
  "delivered_pending_confirm",
  "completed",
  "canceled",
  "disputed",
  "expired"
] as const;

export const DISPUTE_STATUSES = [
  "open",
  "under_review",
  "resolved_requester",
  "resolved_runner",
  "split_resolution"
] as const;

export const PAYMENT_STATUSES = [
  "requires_payment_method",
  "requires_action",
  "processing",
  "succeeded",
  "release_pending",
  "released",
  "refunded",
  "partially_refunded"
] as const;

export const RUNNER_PROGRESS_STATUSES = [
  "purchasing",
  "picked_up",
  "delivered_pending_confirm"
] as const;

export const DAVIDSON_EMAIL_DOMAIN = "@davidson.edu";
export const AUTO_RELEASE_HOURS = 24;
