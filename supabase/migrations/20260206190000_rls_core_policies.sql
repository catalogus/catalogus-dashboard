-- Core RLS policies for catalogus tables
-- Created: 2026-02-06

-- Helper functions (ensure exist)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.is_service_role()
returns boolean
language sql
security definer
as $$
  select coalesce((auth.jwt() ->> 'role') = 'service_role', false);
$$;

-- Enable RLS on core tables
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.authors enable row level security;
alter table public.authors_books enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.partners enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;

-- Profiles policies
drop policy if exists "Profiles: user can view own profile" on public.profiles;
create policy "Profiles: user can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Profiles: public can read author profiles" on public.profiles;
create policy "Profiles: public can read author profiles" on public.profiles
  for select using (role = 'author' and status in ('pending', 'approved'));

drop policy if exists "Profiles: public can read published post authors" on public.profiles;
create policy "Profiles: public can read published post authors" on public.profiles
  for select using (
    exists (
      select 1 from public.posts p
      where p.author_id = profiles.id
        and p.status = 'published'
    )
  );

drop policy if exists "Profiles: admins can view all" on public.profiles;
create policy "Profiles: admins can view all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "Profiles: user can update own profile" on public.profiles;
create policy "Profiles: user can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Profiles: user can insert own profile (non-admin)" on public.profiles;
create policy "Profiles: user can insert own profile (non-admin)" on public.profiles
  for insert with check (auth.uid() = id and role <> 'admin');

drop policy if exists "Profiles: admins can upsert" on public.profiles;
create policy "Profiles: admins can upsert" on public.profiles
  for all using (public.is_admin()) with check (true);

-- Books policies
drop policy if exists "Books: public can read active" on public.books;
create policy "Books: public can read active" on public.books
  for select using (is_active);

drop policy if exists "Books: admins full access" on public.books;
create policy "Books: admins full access" on public.books
  for all using (public.is_admin()) with check (public.is_admin());

-- Authors policies
drop policy if exists "Authors: public can read" on public.authors;
create policy "Authors: public can read" on public.authors
  for select using (true);

drop policy if exists "Authors: admins full access" on public.authors;
create policy "Authors: admins full access" on public.authors
  for all using (public.is_admin()) with check (public.is_admin());

-- Authors_books policies
drop policy if exists "AuthorsBooks: public can read active books" on public.authors_books;
create policy "AuthorsBooks: public can read active books" on public.authors_books
  for select using (
    exists (
      select 1
      from public.books b
      where b.id = authors_books.book_id
        and b.is_active = true
    )
  );

drop policy if exists "AuthorsBooks: admins full access" on public.authors_books;
create policy "AuthorsBooks: admins full access" on public.authors_books
  for all using (public.is_admin()) with check (public.is_admin());

-- Orders policies
drop policy if exists "Orders: customer can read own" on public.orders;
create policy "Orders: customer can read own" on public.orders
  for select using (auth.uid() = customer_id);

drop policy if exists "Orders: admins can read all" on public.orders;
create policy "Orders: admins can read all" on public.orders
  for select using (public.is_admin());

drop policy if exists "Orders: service/admin can insert" on public.orders;
create policy "Orders: service/admin can insert" on public.orders
  for insert with check (public.is_admin() or public.is_service_role());

drop policy if exists "Orders: service/admin can update" on public.orders;
create policy "Orders: service/admin can update" on public.orders
  for update using (public.is_admin() or public.is_service_role());

-- Order items policies
drop policy if exists "OrderItems: customer can read own" on public.order_items;
create policy "OrderItems: customer can read own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = auth.uid()
    )
  );

drop policy if exists "OrderItems: admins can read all" on public.order_items;
create policy "OrderItems: admins can read all" on public.order_items
  for select using (public.is_admin());

drop policy if exists "OrderItems: service/admin can insert" on public.order_items;
create policy "OrderItems: service/admin can insert" on public.order_items
  for insert with check (public.is_admin() or public.is_service_role());

drop policy if exists "OrderItems: service/admin can update" on public.order_items;
create policy "OrderItems: service/admin can update" on public.order_items
  for update using (public.is_admin() or public.is_service_role());

-- Partners policies
DROP POLICY IF EXISTS "Partners: public can read active" ON public.partners;
CREATE POLICY "Partners: public can read active"
  ON public.partners FOR SELECT
  USING (is_active);

DROP POLICY IF EXISTS "Partners: admins full access" ON public.partners;
CREATE POLICY "Partners: admins full access"
  ON public.partners FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Services policies
DROP POLICY IF EXISTS "Services: public can read active" ON public.services;
CREATE POLICY "Services: public can read active"
  ON public.services FOR SELECT
  USING (is_active);

DROP POLICY IF EXISTS "Services: admins full access" ON public.services;
CREATE POLICY "Services: admins full access"
  ON public.services FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Projects policies
DROP POLICY IF EXISTS "Projects: public can read active" ON public.projects;
CREATE POLICY "Projects: public can read active"
  ON public.projects FOR SELECT
  USING (is_active);

DROP POLICY IF EXISTS "Projects: admins full access" ON public.projects;
CREATE POLICY "Projects: admins full access"
  ON public.projects FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
