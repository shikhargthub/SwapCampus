-- ============================================================
-- SwapCampus — Supabase Database Setup
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────
-- 0. Extensions
-- ────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────
-- 1. Enums
-- ────────────────────────────────────────────
do $$ begin
  create type public.item_status as enum ('pending', 'approved', 'rejected', 'sold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────
-- 2. Core Tables
-- ────────────────────────────────────────────

-- Colleges (verified email domains)
create table if not exists public.colleges (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  email_domain text not null unique,
  created_at   timestamptz not null default now()
);

-- Categories
create table if not exists public.categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  icon       text,
  created_at timestamptz not null default now()
);

-- User profiles (extends auth.users)
create table if not exists public.profiles (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade unique,
  email      text not null,
  full_name  text not null default '',
  college_id uuid references public.colleges(id) on delete set null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User roles
create table if not exists public.user_roles (
  id      uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    public.app_role not null default 'user',
  unique (user_id, role)
);

-- Items
create table if not exists public.items (
  id          uuid primary key default uuid_generate_v4(),
  seller_id   uuid not null references auth.users(id) on delete cascade,
  college_id  uuid references public.colleges(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  title       text not null,
  description text,
  price       numeric(10,2) not null default 0,
  location    text not null default '',
  status      public.item_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Item images
create table if not exists public.item_images (
  id        uuid primary key default uuid_generate_v4(),
  item_id   uuid not null references public.items(id) on delete cascade,
  image_url text not null,
  position  int  not null default 0,
  created_at timestamptz not null default now()
);

-- Messages
create table if not exists public.messages (
  id          uuid primary key default uuid_generate_v4(),
  item_id     uuid not null references public.items(id) on delete cascade,
  sender_id   uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────
-- 3. Indexes (performance)
-- ────────────────────────────────────────────
create index if not exists idx_items_status        on public.items(status);
create index if not exists idx_items_seller        on public.items(seller_id);
create index if not exists idx_items_college       on public.items(college_id);
create index if not exists idx_items_created       on public.items(created_at desc);
create index if not exists idx_item_images_item    on public.item_images(item_id);
create index if not exists idx_messages_item       on public.messages(item_id);
create index if not exists idx_messages_sender     on public.messages(sender_id);
create index if not exists idx_messages_receiver   on public.messages(receiver_id);
create index if not exists idx_messages_created    on public.messages(created_at desc);
create index if not exists idx_profiles_user       on public.profiles(user_id);
create index if not exists idx_user_roles_user     on public.user_roles(user_id);

-- ────────────────────────────────────────────
-- 4. Helper function: has_role
-- ────────────────────────────────────────────
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- ────────────────────────────────────────────
-- 5. Auto-create profile on sign-up
--    + auto-detect college from email domain
-- ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
declare
  v_domain   text;
  v_college  uuid;
begin
  -- Extract domain from email
  v_domain := split_part(new.email, '@', 2);

  -- Lookup college
  select id into v_college
  from public.colleges
  where email_domain = v_domain
  limit 1;

  insert into public.profiles (user_id, email, full_name, college_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_college
  )
  on conflict (user_id) do nothing;

  -- Default role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────
-- 6. Auto-update updated_at on items
-- ────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists items_updated_at on public.items;
create trigger items_updated_at
  before update on public.items
  for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ────────────────────────────────────────────
-- 7. Row Level Security (RLS)
-- ────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.colleges    enable row level security;
alter table public.categories  enable row level security;
alter table public.user_roles  enable row level security;
alter table public.items       enable row level security;
alter table public.item_images enable row level security;
alter table public.messages    enable row level security;

-- ── profiles ──
create policy "Users can view all profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = user_id);

-- ── colleges ──
create policy "Anyone can view colleges"
  on public.colleges for select using (true);

create policy "Admins can manage colleges"
  on public.colleges for all
  using (public.has_role(auth.uid(), 'admin'));

-- ── categories ──
create policy "Anyone can view categories"
  on public.categories for select using (true);

create policy "Admins can manage categories"
  on public.categories for all
  using (public.has_role(auth.uid(), 'admin'));

-- ── user_roles ──
create policy "Users can view own roles"
  on public.user_roles for select using (auth.uid() = user_id);

create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- ── items ──
create policy "Users see approved items from own college"
  on public.items for select
  using (
    status = 'approved'
    and (
      college_id is null
      or college_id = (
        select college_id from public.profiles where user_id = auth.uid()
      )
    )
  );

create policy "Sellers see all own items"
  on public.items for select
  using (seller_id = auth.uid());

create policy "Admins see all items"
  on public.items for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Authenticated users can insert items"
  on public.items for insert
  with check (auth.uid() = seller_id);

create policy "Sellers can update own items"
  on public.items for update
  using (seller_id = auth.uid());

create policy "Admins can update any item"
  on public.items for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete any item"
  on public.items for delete
  using (public.has_role(auth.uid(), 'admin'));

-- ── item_images ──
create policy "Anyone can view item images"
  on public.item_images for select using (true);

create policy "Sellers can manage own item images"
  on public.item_images for all
  using (
    exists (
      select 1 from public.items
      where id = item_images.item_id and seller_id = auth.uid()
    )
  );

-- ── messages ──
create policy "Users see own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Receivers can mark read"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- ────────────────────────────────────────────
-- 8. Storage bucket: item-images
-- ────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  5242880,   -- 5 MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

create policy "Anyone can view item images"
  on storage.objects for select
  using (bucket_id = 'item-images');

create policy "Authenticated users can upload item images"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and auth.role() = 'authenticated'
  );

create policy "Users can delete own item images"
  on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ────────────────────────────────────────────
-- 9. Seed: default categories
-- ────────────────────────────────────────────
insert into public.categories (name, icon) values
  ('Books & Notes',    '📚'),
  ('Electronics',      '💻'),
  ('Clothing',         '👕'),
  ('Furniture',        '🪑'),
  ('Sports & Fitness', '🏃'),
  ('Food & Groceries', '🍱'),
  ('Stationery',       '✏️'),
  ('Music & Instruments', '🎸'),
  ('Cycles & Transport', '🚲'),
  ('Miscellaneous',    '📦')
on conflict (name) do nothing;

-- ────────────────────────────────────────────
-- 10. Realtime — enable for messages
-- ────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.items;

-- ════════════════════════════════════════════
-- DONE! ✅
-- Your SwapCampus database is ready.
-- Next: Create your first admin user by running:
--   insert into public.user_roles (user_id, role)
--   values ('<your-user-uuid>', 'admin');
-- ════════════════════════════════════════════
