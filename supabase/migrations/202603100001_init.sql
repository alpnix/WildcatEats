create extension if not exists pgcrypto;

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    CREATE TYPE public.request_status AS ENUM (
      'open',
      'accepted',
      'purchasing',
      'picked_up',
      'delivered_pending_confirm',
      'completed',
      'canceled',
      'disputed',
      'expired'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
    CREATE TYPE public.dispute_status AS ENUM (
      'open',
      'under_review',
      'resolved_requester',
      'resolved_runner',
      'split_resolution'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM (
      'requires_payment_method',
      'requires_action',
      'processing',
      'succeeded',
      'release_pending',
      'released',
      'refunded',
      'partially_refunded'
    );
  END IF;
END$$;

-- Utility functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_davidson_member()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') ilike '%@davidson.edu', false);
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null check (email ilike '%@davidson.edu'),
  first_name text not null default 'Student',
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  is_admin boolean not null default false,
  stripe_connect_account_id text unique,
  connect_charges_enabled boolean not null default false,
  connect_payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles p where p.id = user_id and p.is_admin = true);
$$;

grant execute on function public.is_admin(uuid) to authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  campus_area text,
  hours_text text,
  hours_url text,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at
before update on public.locations
for each row execute procedure public.set_updated_at();

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete restrict,
  runner_id uuid references public.profiles(id) on delete set null,
  location_id uuid not null references public.locations(id) on delete restrict,
  item_text text not null check (char_length(item_text) between 6 and 400),
  max_offer_cents integer not null check (max_offer_cents >= 200),
  processing_fee_cents integer not null default 0 check (processing_fee_cents >= 0),
  currency text not null default 'usd',
  status public.request_status not null default 'open',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  delivered_at timestamptz,
  auto_release_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint runner_not_requester check (runner_id is null or runner_id <> requester_id)
);

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at
before update on public.requests
for each row execute procedure public.set_updated_at();

create table if not exists public.request_status_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.requests(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  from_status public.request_status,
  to_status public.request_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests(id) on delete cascade,
  runner_id uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null,
  merchant_total_cents integer check (merchant_total_cents >= 0),
  uploaded_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests(id) on delete cascade,
  stripe_payment_intent_id text unique,
  stripe_charge_id text unique,
  stripe_transfer_id text unique,
  amount_cents integer not null check (amount_cents > 0),
  processing_fee_cents integer not null check (processing_fee_cents >= 0),
  runner_payout_cents integer not null check (runner_payout_cents >= 0),
  status public.payment_status not null default 'requires_payment_method',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute procedure public.set_updated_at();

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  opened_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  status public.dispute_status not null default 'open',
  resolution_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists disputes_set_updated_at on public.disputes;
create trigger disputes_set_updated_at
before update on public.disputes
for each row execute procedure public.set_updated_at();

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete restrict,
  ratee_id uuid not null references public.profiles(id) on delete restrict,
  score integer not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (request_id, rater_id, ratee_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  stripe_event_id text primary key,
  type text not null,
  status text not null check (status in ('processed', 'ignored', 'failed')),
  processed_at timestamptz not null,
  error_text text
);

-- Atomic first-accept function
create or replace function public.accept_request_first_wins(
  p_request_id uuid,
  p_runner_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.requests
  set
    runner_id = p_runner_id,
    status = 'accepted',
    accepted_at = now(),
    updated_at = now()
  where id = p_request_id
    and status = 'open'
    and runner_id is null
    and requester_id <> p_runner_id
    and expires_at > now()
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.accept_request_first_wins(uuid, uuid) to authenticated;

-- Profile bootstrap from auth users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_name text;
begin
  v_first_name := coalesce(nullif(split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1), ''), 'Student');

  insert into public.profiles (id, email, first_name)
  values (new.id, new.email, v_first_name)
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Indexes
create index if not exists idx_requests_status_created_at on public.requests(status, created_at desc);
create index if not exists idx_requests_location_status on public.requests(location_id, status);
create index if not exists idx_requests_auto_release on public.requests(auto_release_at) where status = 'delivered_pending_confirm';
create index if not exists idx_disputes_status_created_at on public.disputes(status, created_at);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read_at);

-- RLS
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.requests enable row level security;
alter table public.request_status_events enable row level security;
alter table public.receipts enable row level security;
alter table public.payments enable row level security;
alter table public.disputes enable row level security;
alter table public.ratings enable row level security;
alter table public.notifications enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (public.is_davidson_member());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());


drop policy if exists locations_select on public.locations;
create policy locations_select on public.locations
for select to authenticated
using (public.is_davidson_member());

drop policy if exists locations_admin_all on public.locations;
create policy locations_admin_all on public.locations
for all to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));


drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests
for select to authenticated
using (
  public.is_davidson_member()
  and (
    status = 'open'
    or requester_id = auth.uid()
    or runner_id = auth.uid()
    or public.is_admin(auth.uid())
  )
);

drop policy if exists requests_insert on public.requests;
create policy requests_insert on public.requests
for insert to authenticated
with check (
  public.is_davidson_member()
  and requester_id = auth.uid()
);

drop policy if exists requests_update_participants on public.requests;
create policy requests_update_participants on public.requests
for update to authenticated
using (
  requester_id = auth.uid()
  or runner_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  requester_id = auth.uid()
  or runner_id = auth.uid()
  or public.is_admin(auth.uid())
);


drop policy if exists request_events_select on public.request_status_events;
create policy request_events_select on public.request_status_events
for select to authenticated
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id
      and (r.requester_id = auth.uid() or r.runner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists request_events_insert on public.request_status_events;
create policy request_events_insert on public.request_status_events
for insert to authenticated
with check (actor_id = auth.uid());


drop policy if exists receipts_select on public.receipts;
create policy receipts_select on public.receipts
for select to authenticated
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id
      and (r.requester_id = auth.uid() or r.runner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists receipts_insert_runner on public.receipts;
create policy receipts_insert_runner on public.receipts
for insert to authenticated
with check (
  runner_id = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = request_id and r.runner_id = auth.uid()
  )
);

drop policy if exists receipts_update_runner on public.receipts;
create policy receipts_update_runner on public.receipts
for update to authenticated
using (runner_id = auth.uid() or public.is_admin(auth.uid()))
with check (runner_id = auth.uid() or public.is_admin(auth.uid()));


drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
for select to authenticated
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id
      and (r.requester_id = auth.uid() or r.runner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);


drop policy if exists disputes_select on public.disputes;
create policy disputes_select on public.disputes
for select to authenticated
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id
      and (r.requester_id = auth.uid() or r.runner_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists disputes_insert on public.disputes;
create policy disputes_insert on public.disputes
for insert to authenticated
with check (
  opened_by = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = request_id
      and (r.requester_id = auth.uid() or r.runner_id = auth.uid())
  )
);


drop policy if exists ratings_select on public.ratings;
create policy ratings_select on public.ratings
for select to authenticated
using (public.is_davidson_member());

drop policy if exists ratings_insert on public.ratings;
create policy ratings_insert on public.ratings
for insert to authenticated
with check (
  rater_id = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = request_id
      and (r.requester_id = auth.uid() or r.runner_id = auth.uid())
  )
);


drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
for select to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- webhook_events intentionally has no authenticated policies; service role only.
