-- Run after 001 and 002. Adds: comments, likes, reports, credit_ledger, leaderboard_cache.
-- Repl extends the post trigger to append credit_ledger rows.

-- ---------------------------------------------------------------------------
-- 1) Comments on posts (thread replies / discussion)
-- ---------------------------------------------------------------------------
create table if not exists public.post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint post_comments_body_nonempty check (length(trim(body)) > 0)
);

create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at desc);
create index if not exists post_comments_user_idx on public.post_comments (user_id);

alter table public.post_comments enable row level security;

drop policy if exists "post_comments_select" on public.post_comments;
drop policy if exists "post_comments_insert" on public.post_comments;
drop policy if exists "post_comments_update_own" on public.post_comments;
drop policy if exists "post_comments_delete_own" on public.post_comments;

create policy "post_comments_select" on public.post_comments
  for select to authenticated using (true);

create policy "post_comments_insert" on public.post_comments
  for insert to authenticated with check (auth.uid() = user_id);

create policy "post_comments_update_own" on public.post_comments
  for update to authenticated using (auth.uid() = user_id);

create policy "post_comments_delete_own" on public.post_comments
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2) Likes (one row per user per post)
-- ---------------------------------------------------------------------------
create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_idx on public.post_likes (user_id, created_at desc);

alter table public.post_likes enable row level security;

drop policy if exists "post_likes_select" on public.post_likes;
drop policy if exists "post_likes_insert" on public.post_likes;
drop policy if exists "post_likes_delete_own" on public.post_likes;

create policy "post_likes_select" on public.post_likes
  for select to authenticated using (true);

create policy "post_likes_insert" on public.post_likes
  for insert to authenticated with check (auth.uid() = user_id);

create policy "post_likes_delete_own" on public.post_likes
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3) Reports (moderation queue — extend with admin role later)
-- ---------------------------------------------------------------------------
create table if not exists public.post_reports (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default now(),
  constraint post_reports_one_per_user unique (post_id, reporter_id)
);

create index if not exists post_reports_status_idx on public.post_reports (status, created_at desc);

alter table public.post_reports enable row level security;

drop policy if exists "post_reports_insert" on public.post_reports;
drop policy if exists "post_reports_select_own" on public.post_reports;

-- Reporters can submit; they can read their own reports. (Admins: use service role or future role policy.)
create policy "post_reports_insert" on public.post_reports
  for insert to authenticated with check (auth.uid() = reporter_id);

create policy "post_reports_select_own" on public.post_reports
  for select to authenticated using (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------------
-- 4) Credit ledger (append-only history; rows also written by trigger)
-- ---------------------------------------------------------------------------
create table if not exists public.credit_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta int not null,
  reason text not null,
  ref_post_id uuid references public.posts (id) on delete set null,
  balance_after int,
  created_at timestamptz default now()
);

create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

alter table public.credit_ledger enable row level security;

drop policy if exists "credit_ledger_select_own" on public.credit_ledger;

create policy "credit_ledger_select_own" on public.credit_ledger
  for select to authenticated using (auth.uid() = user_id);

-- Inserts only via triggers/functions (security definer), not from client

-- ---------------------------------------------------------------------------
-- 5) Leaderboard cache (refreshed by SQL function; not real-time)
-- ---------------------------------------------------------------------------
create table if not exists public.leaderboard_cache (
  scope text not null default 'all_time',
  user_id uuid not null references public.profiles (id) on delete cascade,
  rank int not null,
  score int not null,
  lifetime_posts_snapshot int not null default 0,
  updated_at timestamptz default now(),
  primary key (scope, user_id)
);

create index if not exists leaderboard_cache_scope_rank_idx on public.leaderboard_cache (scope, rank);

alter table public.leaderboard_cache enable row level security;

drop policy if exists "leaderboard_cache_select" on public.leaderboard_cache;

create policy "leaderboard_cache_select" on public.leaderboard_cache
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 6) Replace post trigger: profile update + credit_ledger row
-- ---------------------------------------------------------------------------
create or replace function public.after_post_grant_credits()
returns trigger
language plpgsql
security definer
set search_path = public as $$
declare
  new_balance int;
begin
  update public.profiles
  set
    credits = coalesce(credits, 0) + 10,
    lifetime_posts = coalesce(lifetime_posts, 0) + 1,
    updated_at = now()
  where id = new.user_id
  returning credits into new_balance;

  insert into public.credit_ledger (user_id, delta, reason, ref_post_id, balance_after)
  values (new.user_id, 10, 'post_created', new.id, new_balance);

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) Refresh leaderboard from profiles (credits desc)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_leaderboard_cache(p_scope text default 'all_time')
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  delete from public.leaderboard_cache where scope = p_scope;

  insert into public.leaderboard_cache (scope, user_id, rank, score, lifetime_posts_snapshot, updated_at)
  select
    p_scope,
    p.id,
    row_number() over (order by p.credits desc, p.lifetime_posts desc, p.id),
    p.credits,
    p.lifetime_posts,
    now()
  from public.profiles p;
end;
$$;

-- Safe for authenticated callers to refresh (small projects). Lock down later if needed.
grant execute on function public.refresh_leaderboard_cache(text) to authenticated;

-- Initial fill
select public.refresh_leaderboard_cache('all_time');
