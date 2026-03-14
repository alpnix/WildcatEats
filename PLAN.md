ldcatEats MVP Plan (Davidson Dining Runner Marketplace)

  ## Summary

  Build a mobile-first web app where Davidson users
  (@davidson.edu) post food requests for on-campus dining
  locations, runners accept requests, purchase food using Dining
  Dollars only (self-attested), and get paid in USD via Stripe
  after delivery confirmation.
  Stack: Next.js + TypeScript + Vercel + Supabase + Stripe
  Connect.

  ## Goals and Success Criteria

  - Users can sign up/login with @davidson.edu email only.
  - Users can post, browse, accept, fulfill, and complete
    requests end-to-end.
  - Payment is collected from requester and released to runner on
    buyer confirmation or 24-hour timeout.
  - Disputes can pause payout and be resolved by admin.
  - Campus locations are seeded and manually maintained by admin.
  - Minimal disclaimer shown in onboarding/checkout.

  ## In Scope (MVP)

  - Mobile-first responsive web app.
  - Request forum feed with filtering by location/status.
  - First-accept-wins matching.
  - Receipt upload + status progression proof.
  - In-app + email notifications.
  - Stripe Connect onboarding for runners.
  - Admin panel for disputes and location management.

  ## Out of Scope (MVP)

  - Native iOS/Android apps.
  - Automated scraping/sync of Davidson dining data.
  - Class-year-based role restrictions.
  - Platform revenue fee (no platform fee initially).
  - Advanced ranking/matching algorithms.

  ## Core Product Decisions (locked)

  - Email gate: @davidson.edu required.
  - Role gate: none; any user can request or run.
  - Payment source rule: runner must attest Dining Dollars were
    used.
  - Matching: first eligible runner to accept wins.
  - Proof: receipt required + status updates.
  - Payout timing: buyer confirm, or auto-release at 24 hours.
  - Disputes: platform admin resolves.
  - Stripe costs: requester pays processing fee.
  - Cancellation: tiered by lifecycle status.
  - Policy UX: minimal disclaimer only.

  ## System Architecture

  - Frontend: Next.js App Router (TypeScript), mobile-first UI.
  - Backend: Supabase Postgres + RLS + Realtime + Storage + Edge
    Functions.
  - Payments: Stripe PaymentIntents + Connect Express accounts.
  - Hosting: Vercel (frontend/API) + Supabase project.

  ## Public Interfaces / APIs / Types

  ### API Routes (Next.js)

  - POST /api/auth/onboarding/check-email-domain
  - GET /api/locations
  - POST /api/requests
  - GET /api/requests?status=&location_id=&cursor=
  - GET /api/requests/:id
  - POST /api/requests/:id/accept
  - POST /api/requests/:id/status (runner status transitions)
  - POST /api/requests/:id/receipt (upload metadata + storage
    path)
  - POST /api/requests/:id/confirm-delivery
  - POST /api/requests/:id/cancel
  - POST /api/requests/:id/dispute
  - POST /api/stripe/connect/onboard-link
  - POST /api/stripe/create-payment-intent
  - POST /api/stripe/webhook

  ### Key Enums (shared TypeScript types)

  - RequestStatus: open | accepted | purchasing | picked_up |
    delivered_pending_confirm | completed | canceled | disputed |
    expired
  - DisputeStatus: open | under_review | resolved_requester |
    resolved_runner | split_resolution
  - PaymentStatus: requires_payment_method | requires_action |
    processing | succeeded | release_pending | released |
    refunded | partially_refunded
  - UserRoleCapabilities: requester/runner capabilities (no hard
    role lock, capability flags only)

  ## Data Model (Supabase)

  - profiles
      - id (uuid pk, auth user id), email, first_name,
        rating_avg, rating_count, is_admin,
        stripe_connect_account_id, connect_charges_enabled,
        connect_payouts_enabled, timestamps.
  - locations
      - id, name, campus_area, hours_text, hours_url, active,
        sort_order.
  - requests
      - id, requester_id, runner_id nullable, location_id,
        item_text, max_offer_cents, processing_fee_cents,
        currency, status, expires_at, accepted_at, delivered_at,
        auto_release_at, timestamps.
  - request_status_events
      - immutable event log: request_id, from_status, to_status,
        actor_id, note, timestamp.
  - receipts
      - id, request_id, runner_id, storage_path,
        merchant_total_cents nullable, uploaded_at.
  - payments
      - id, request_id, stripe_payment_intent_id,
        stripe_charge_id, stripe_transfer_id nullable,
        amount_cents, processing_fee_cents, runner_payout_cents,
        status, timestamps.
  - disputes
      - id, request_id, opened_by, reason, status,
        resolution_note, resolved_by, timestamps.
  - ratings
      - id, request_id, rater_id, ratee_id, score (1-5), comment.
  - notifications
      - id, user_id, type, payload jsonb, read_at, created_at.
  - webhook_events
      - stripe_event_id, type, processed_at, status, error_text
        (idempotency ledger).

  ## RLS and Auth Rules

  - Only authenticated users with email LIKE '%@davidson.edu' can
    access app tables.
  - requests:
      - open requests readable by all authenticated users.
      - requester can create/cancel own request per state rules.
      - runner can accept only if status='open' and no runner_id.
  - payments, receipts, disputes visible only to involved parties
    + admins.
  - locations readable by all authenticated users; writable by
    admins only.
  - Admin bypass policy for dispute tooling.

  ## Request Lifecycle and Business Rules

  1. Requester creates open request with location, food details,
     max offer.
  2. Runner accepts (transactional lock to prevent double
     assignment).
  3. Request transitions: accepted -> purchasing -> picked_up ->
     delivered_pending_confirm.
  4. Runner uploads receipt before delivered_pending_confirm.
  5. Buyer confirms delivery -> completed, release payout.
  6. If buyer does nothing, auto-release at accepted_at + 24h.
  7. Any party can open dispute before release; release is
     paused.
  8. Admin resolves dispute with full requester refund, full
     runner payout, or split.

  ## Stripe Design

  - Stripe Connect Express for runner onboarding.
  - Collect payment from requester at accept time.
  - Use webhook-driven source of truth for payment state.
  - Payout release:
      - On buyer confirm or auto-release job, create transfer to
        runner connected account.
      - Dispute blocks transfer.
  - Requester pays processing fee (line item surfaced pre-
    confirmation).
  - Idempotency keys for create/confirm/refund/transfer
    operations.
  - Webhook signature verification required; raw body preserved.

  ## Notifications

  - In-app + email for:
      - request accepted
      - runner status changes
      - receipt uploaded
      - delivery awaiting confirmation
      - auto-release warnings
      - dispute opened/resolved
      - payout released/refund issued

  ## UI/UX Plan

  - Pages:
      - Auth / onboarding
      - Request feed (forum)
      - Create request
      - Request detail chat/status timeline
      - My requests / My runs
      - Wallet/payout status
      - Admin (locations/disputes)
  - Design direction:
      - Mobile-first, high-contrast, clean campus utility
        aesthetic.
      - Use Davidson references cautiously; avoid official marks
        unless explicit permission.
      - Keep policy language minimal (per decision), but explicit
        at critical actions.

  ## Testing Plan

  ### Unit

  - State machine transition validity.
  - Fee and payout calculations.
  - Cancellation/refund matrix.
  - Email-domain gate helpers.

  ### Integration

  - Accept race condition (two runners accept simultaneously).
  - Stripe webhook idempotency (duplicate event replay).
  - Auto-release job behavior at 24h.
  - Dispute pause/resume payout flow.

  ### E2E

  - New user signup -> post request -> runner accept -> receipt
    -> confirm -> payout.
  - Cancellation before and after purchasing.
  - Dispute opened before auto-release.
  - Runner without completed Stripe onboarding blocked from
    accepting paid requests.

  ### Security

  - RLS policy tests for each table.
  - Unauthorized access attempts on another user’s request/
    payment/dispute.
  - Webhook signature tampering test.

  ## Observability and Ops

  - Structured logs for all payment and status events.
  - Admin audit trail for dispute actions.
  - Dead-letter handling for failed webhook processing.
  - Scheduled job monitoring for auto-release and reminder
    emails.

  ## Rollout Plan

  1. Internal alpha with seeded locations and admin-only dispute
     tools.
  2. Limited user beta (email allowlist) to validate lifecycle
     and payouts.
  3. Open to all @davidson.edu accounts.
  4. Post-launch tuning of dispute rules, timeout windows, and
     trust signals.

  ## Assumptions and Defaults

  - No institutional integration with Davidson systems in MVP.
  - “Dining Dollars only” is user attestation, not technically
    verified against POS.
  - Minimal disclaimer is sufficient for initial launch posture.
  - No platform fee at launch; requester covers Stripe processing
    fee.
  - 24-hour auto-release is acceptable runner liquidity target.

