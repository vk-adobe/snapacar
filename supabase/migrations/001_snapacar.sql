-- Run in Supabase SQL editor or via Supabase CLI migrations.
-- Enable: Authentication → Providers → Google (use Web client ID where needed)

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  city text,
  bio text,
  avatar_url text,
  credits int not null default 0,
  lifetime_posts int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- denormalized for fast feed without extra joins
  author_name text default '',
  car_key text not null,
  make text not null,
  model text not null,
  year text default '',
  license_plate text default '',
  plate_normalized text default '',
  image_url text,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text default '',
  created_at timestamptz default now()
);

create index if not exists posts_car_key_idx on public.posts (car_key);
create index if not exists posts_plate_norm_idx on public.posts (plate_normalized);
create index if not exists posts_created_idx on public.posts (created_at desc);

-- Optional FK to profiles for PostgREST embeds (run after profiles exist)
do $$ begin
  alter table public.posts
    add constraint posts_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- Profiles: authenticated users can read display info for feed; only owner can insert/update own row
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_feed" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_feed" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Posts: anyone authenticated can read all posts (public feed)
drop policy if exists "posts_select_authenticated" on public.posts;
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_select_authenticated" on public.posts for select to authenticated using (true);
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = user_id);

-- Credits after each post
create or replace function public.after_post_grant_credits()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
  set credits = coalesce(credits, 0) + 10,
      lifetime_posts = coalesce(lifetime_posts, 0) + 1,
      updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists trg_post_credits on public.posts;
create trigger trg_post_credits
  after insert on public.posts
  for each row execute function public.after_post_grant_credits();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket (create in Dashboard → Storage → New bucket "car-images" public read, authenticated upload)
-- Policy examples (run in SQL if using bucket):
-- insert into storage.buckets (id, name, public) values ('car-images', 'car-images', true);
-- create policy "car_images_read" on storage.objects for select using (bucket_id = 'car-images');
-- create policy "car_images_upload" on storage.objects for insert with check (bucket_id = 'car-images' and auth.role() = 'authenticated');
