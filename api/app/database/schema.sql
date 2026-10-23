-- TranscriptDock database schema (Supabase Postgres)
--
-- Apply with the Supabase SQL editor or:
--   psql "$DATABASE_URL" -f api/app/database/schema.sql
--
-- Security model:
--   * RLS is enabled on every table. Signed-in users can read only their own
--     rows and may delete their own jobs/transcripts.
--   * No client role has INSERT/UPDATE/DELETE on these tables. All writes go
--     through the FastAPI backend (service role) which scopes every query by
--     user id.
--   * Credit functions are SECURITY DEFINER and executable only by service_role,
--     so an anon-key client cannot mint credits by calling them.
--   * profiles.id references auth.users, so deleting the auth user removes all
--     application data by cascade.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text,
    balance integer not null default 0 check (balance >= 0),
    free_credits_granted integer not null default 0 check (free_credits_granted >= 0),
    pack_purchased_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
    id bigserial primary key,
    user_id uuid not null references public.profiles (id) on delete cascade,
    delta integer not null,
    reason text not null,
    reference text not null,
    created_at timestamptz not null default now(),
    constraint credit_ledger_reference_unique unique (user_id, reference)
);

create index if not exists credit_ledger_user_idx
    on public.credit_ledger (user_id, created_at desc);

create table if not exists public.jobs (
    id uuid primary key,
    -- NULL only for ephemeral anonymous single-video demo jobs.
    user_id uuid references public.profiles (id) on delete cascade,
    mode text not null check (mode in ('single', 'playlist')),
    source_url text not null,
    status text not null check (
        status in ('pending', 'processing', 'partial', 'completed', 'failed', 'cancelled')
    ),
    language text not null default 'auto',
    playlist_title text,
    error_message text,
    is_demo boolean not null default true,
    client_ip text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists jobs_user_created_idx
    on public.jobs (user_id, created_at desc);
create index if not exists jobs_created_idx on public.jobs (created_at);
create index if not exists jobs_status_idx on public.jobs (status);

create table if not exists public.job_items (
    id uuid primary key,
    job_id uuid not null references public.jobs (id) on delete cascade,
    position integer not null check (position >= 1),
    title text not null,
    source_url text not null,
    video_id text not null,
    status text not null default 'pending' check (
        status in ('pending', 'processing', 'success', 'failed')
    ),
    error_message text,
    error_code text,
    retry_count integer not null default 0 check (retry_count >= 0),
    started_at timestamptz,
    completed_at timestamptz,
    constraint job_items_position_unique unique (job_id, position)
);

create index if not exists job_items_job_idx on public.job_items (job_id, position);

create table if not exists public.transcripts (
    id uuid primary key,
    item_id uuid not null unique references public.job_items (id) on delete cascade,
    job_id uuid not null references public.jobs (id) on delete cascade,
    user_id uuid references public.profiles (id) on delete cascade,
    title text not null,
    source_url text not null,
    video_id text not null,
    language text,
    provider text not null,
    is_demo boolean not null default true,
    text text not null,
    segments jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists transcripts_user_idx
    on public.transcripts (user_id, created_at desc);
create index if not exists transcripts_created_idx
    on public.transcripts (created_at);

create table if not exists public.payments (
    id uuid primary key,
    user_id uuid not null references public.profiles (id) on delete cascade,
    provider text not null default 'razorpay',
    provider_order_id text not null unique,
    provider_payment_id text,
    amount_paise integer not null check (amount_paise > 0),
    currency text not null default 'INR',
    status text not null default 'created' check (
        status in ('created', 'paid', 'failed', 'refunded')
    ),
    credits_granted integer not null default 0 check (credits_granted >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists payments_user_idx
    on public.payments (user_id, created_at desc);

create table if not exists public.webhook_events (
    id text primary key,
    provider text not null,
    event_type text not null,
    received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
    before update on public.jobs
    for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
    before update on public.payments
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Credit functions (atomic, idempotent)
-- ---------------------------------------------------------------------------

create or replace function public.ensure_profile(
    p_user_id uuid,
    p_email text,
    p_free_credits integer
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_profile public.profiles;
begin
    insert into public.profiles (id, email)
    values (p_user_id, p_email)
    on conflict (id) do update
        set email = coalesce(excluded.email, public.profiles.email),
            updated_at = now();

    if p_free_credits > 0 then
        insert into public.credit_ledger (user_id, delta, reason, reference)
        values (p_user_id, p_free_credits, 'free_tier', 'free:' || p_user_id::text)
        on conflict (user_id, reference) do nothing;

        if found then
            update public.profiles
               set balance = balance + p_free_credits,
                   free_credits_granted = free_credits_granted + p_free_credits,
                   updated_at = now()
             where id = p_user_id;
        end if;
    end if;

    select * into v_profile from public.profiles where id = p_user_id;
    return v_profile;
end;
$$;

create or replace function public.grant_credits(
    p_user_id uuid,
    p_amount integer,
    p_reason text,
    p_reference text,
    p_mark_pack boolean
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_balance integer;
begin
    if p_amount <= 0 then
        raise exception 'grant amount must be positive';
    end if;

    insert into public.credit_ledger (user_id, delta, reason, reference)
    values (p_user_id, p_amount, p_reason, p_reference)
    on conflict (user_id, reference) do nothing;

    if found then
        update public.profiles
           set balance = balance + p_amount,
               pack_purchased_at = case
                   when p_mark_pack then now()
                   else pack_purchased_at
               end,
               updated_at = now()
         where id = p_user_id
         returning balance into v_balance;
    else
        select balance into v_balance from public.profiles where id = p_user_id;
    end if;

    return coalesce(v_balance, 0);
end;
$$;

create or replace function public.consume_credit(
    p_user_id uuid,
    p_reference text,
    p_reason text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_balance integer;
begin
    update public.profiles
       set balance = balance - 1,
           updated_at = now()
     where id = p_user_id
       and balance >= 1
     returning balance into v_balance;

    if v_balance is null then
        return -1;
    end if;

    insert into public.credit_ledger (user_id, delta, reason, reference)
    values (p_user_id, -1, p_reason, p_reference)
    on conflict (user_id, reference) do nothing;

    if not found then
        -- Already charged for this reference (safe retry): undo the decrement.
        update public.profiles
           set balance = balance + 1,
               updated_at = now()
         where id = p_user_id
         returning balance into v_balance;
    end if;

    return v_balance;
end;
$$;

-- Only the backend's service-role key may call these. Without this, a browser
-- holding the anon key could call grant_credits and mint credits.
revoke all on function public.ensure_profile(uuid, text, integer) from public;
revoke all on function public.grant_credits(uuid, integer, text, text, boolean) from public;
revoke all on function public.consume_credit(uuid, text, text) from public;
revoke execute on function public.ensure_profile(uuid, text, integer) from anon, authenticated;
revoke execute on function public.grant_credits(uuid, integer, text, text, boolean) from anon, authenticated;
revoke execute on function public.consume_credit(uuid, text, text) from anon, authenticated;

grant execute on function public.ensure_profile(uuid, text, integer) to service_role;
grant execute on function public.grant_credits(uuid, integer, text, text, boolean) to service_role;
grant execute on function public.consume_credit(uuid, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.jobs enable row level security;
alter table public.job_items enable row level security;
alter table public.transcripts enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
    for select using ((select auth.uid()) = id);

drop policy if exists credit_ledger_select_own on public.credit_ledger;
create policy credit_ledger_select_own on public.credit_ledger
    for select using ((select auth.uid()) = user_id);

drop policy if exists jobs_select_own on public.jobs;
create policy jobs_select_own on public.jobs
    for select using ((select auth.uid()) = user_id);

drop policy if exists jobs_delete_own on public.jobs;
create policy jobs_delete_own on public.jobs
    for delete using ((select auth.uid()) = user_id);

drop policy if exists job_items_select_own on public.job_items;
create policy job_items_select_own on public.job_items
    for select using (
        exists (
            select 1
            from public.jobs
            where public.jobs.id = job_items.job_id
              and public.jobs.user_id = (select auth.uid())
        )
    );

drop policy if exists transcripts_select_own on public.transcripts;
create policy transcripts_select_own on public.transcripts
    for select using ((select auth.uid()) = user_id);

drop policy if exists transcripts_delete_own on public.transcripts;
create policy transcripts_delete_own on public.transcripts
    for delete using ((select auth.uid()) = user_id);

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
    for select using ((select auth.uid()) = user_id);

-- webhook_events intentionally has no policies: service role only.

-- Clients may read through RLS, but never write directly.
revoke insert, update, delete on
    public.profiles,
    public.credit_ledger,
    public.jobs,
    public.job_items,
    public.transcripts,
    public.payments,
    public.webhook_events
from anon, authenticated;

comment on table public.transcripts is
    'Transcript content. Purged after the configured retention window (default 30 days).';
comment on table public.jobs is
    'Processing jobs. Anonymous demo jobs (user_id null) are ephemeral.';
comment on table public.webhook_events is
    'Idempotency ledger for verified payment webhooks.';
