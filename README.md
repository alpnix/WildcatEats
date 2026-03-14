# WildcatEats

WildcatEats is a mobile-first Davidson marketplace where a requester posts a food order request, a runner fulfills it using Dining Dollars, and payout is released in USD through Stripe after delivery confirmation or 24-hour timeout.

## Tech Stack

- Next.js (App Router) + TypeScript
- Supabase (Auth, Postgres, RLS, Storage, Realtime)
- Stripe Connect (Express accounts, PaymentIntents, transfers)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

3. Fill in values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_URL`
- `APP_CRON_SECRET` (optional, recommended for cron endpoint)
- `RESEND_API_KEY` (optional for email notifications)

4. Apply database migration and seed locations (Supabase CLI):

```bash
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed/seed_locations.sql
```

5. Run locally:

```bash
npm run dev
```

6. Forward Stripe webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Product Rules Implemented

- Authentication restricted to `@davidson.edu` users.
- Any verified user can request or run.
- First runner to accept an open request wins.
- Runner progression: `accepted -> purchasing -> picked_up -> delivered_pending_confirm`.
- Requester confirms delivery to release payout.
- If requester does not confirm, auto-release can be run by cron after 24 hours.
- Disputes pause normal payout flow and are resolved by admin.

## Key API Routes

- `POST /api/auth/onboarding/check-email-domain`
- `GET /api/locations`
- `GET|POST /api/requests`
- `GET /api/requests/:id`
- `POST /api/requests/:id/accept`
- `POST /api/requests/:id/status`
- `POST /api/requests/:id/receipt`
- `POST /api/requests/:id/confirm-delivery`
- `POST /api/requests/:id/cancel`
- `POST /api/requests/:id/dispute`
- `POST /api/stripe/connect/onboard-link`
- `POST /api/stripe/create-payment-intent`
- `POST /api/stripe/webhook`
- `POST /api/cron/auto-release`
- `GET|POST /api/admin/locations`
- `GET /api/admin/disputes`
- `POST /api/admin/disputes/:id/resolve`

## Database

See `supabase/migrations/202603100001_init.sql` for:

- Tables: profiles, locations, requests, request_status_events, receipts, payments, disputes, ratings, notifications, webhook_events
- Enums for request/payment/dispute states
- RLS policies
- Atomic function: `accept_request_first_wins(...)`
- Auth trigger to create profile rows

Seed locations in: `supabase/seed/seed_locations.sql`

## Notes

- Stripe does not provide escrow; this project uses delayed payout release logic.
- Current policy UX is intentionally minimal (per product decision).
- Before production launch, confirm policy compliance with Davidson Dining/CatCard and branding permissions.
