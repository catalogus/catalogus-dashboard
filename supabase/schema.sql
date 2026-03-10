-- Catalogus Supabase schema + RLS
-- Run with: supabase db push -f supabase/schema.sql

-- Enums
do $$
begin
  create type public.user_role as enum ('admin', 'author', 'customer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.author_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum ('pending', 'processing', 'paid', 'failed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.language_code as enum ('pt', 'en');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.translation_status as enum ('pending', 'review', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.digital_access as enum ('paid', 'free');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.newsletter_status as enum ('pending', 'verified');
exception
  when duplicate_object then null;
end $$;

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'customer',
  status author_status,
  name text not null,
  email text,
  bio text,
  photo_url text,
  photo_path text,
  social_links jsonb default '{}'::jsonb,
  phone text,
  birth_date date,
  residence_city text,
  province text,
  published_works jsonb default '[]'::jsonb,
  author_gallery jsonb default '[]'::jsonb,
  featured_video text,
  author_type text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  description_json jsonb,
  price_mzn numeric(12, 2) not null,
  stock integer not null default 0,
  cover_url text,
  cover_path text,
  featured boolean not null default false,
  promo_type text,
  promo_price_mzn numeric(12, 2),
  promo_start_date date,
  promo_end_date date,
  is_digital boolean not null default false,
  digital_access public.digital_access,
  digital_file_path text,
  digital_file_url text,
  isbn text,
  publisher text,
  seo_title text,
  seo_description text,
  category text,
  language language_code not null default 'pt',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint books_promo_type_check check (promo_type is null or promo_type in ('promocao', 'pre-venda')),
  constraint books_digital_access_check check (is_digital = false or digital_access is not null)
);
create index if not exists books_is_active_idx on public.books (is_active);
create index if not exists books_category_idx on public.books (category);
create index if not exists books_language_idx on public.books (language);

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status public.newsletter_status not null default 'pending',
  verification_token_hash text,
  verification_expires_at timestamptz,
  verified_at timestamptz,
  download_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_subscriptions_status_idx
  on public.newsletter_subscriptions (status);
create index if not exists newsletter_subscriptions_verification_token_idx
  on public.newsletter_subscriptions (verification_token_hash);
create index if not exists newsletter_subscriptions_download_token_idx
  on public.newsletter_subscriptions (download_token_hash);

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  photo_path text,
  photo_url text,
  author_type text,
  social_links jsonb default '{}'::jsonb,
  featured boolean not null default false,
  wp_id bigint,
  wp_slug text,
  phone text,
  birth_date date,
  residence_city text,
  province text,
  published_works jsonb default '[]'::jsonb,
  author_gallery jsonb default '[]'::jsonb,
  featured_video text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists authors_wp_id_key on public.authors (wp_id);
create index if not exists authors_wp_slug_idx on public.authors (wp_slug);
create index if not exists authors_featured_idx on public.authors (featured);

drop table if exists public.authors_books;
create table public.authors_books (
  author_id uuid not null references public.authors (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  primary key (author_id, book_id)
);

create sequence if not exists public.order_number_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('ORD-' || lpad(nextval('public.order_number_seq')::text, 8, '0')),
  customer_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  total numeric(12, 2) not null,
  status order_status not null default 'pending',
  payment_method text not null default 'mpesa',
  mpesa_transaction_id text,
  mpesa_reference text,
  mpesa_last_response jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_mpesa_transaction_idx on public.orders (mpesa_transaction_id);
create index if not exists orders_payment_method_idx on public.orders (payment_method);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price numeric(12, 2) not null check (price >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  excerpt text,
  body text,
  status content_status not null default 'draft',
  previous_status content_status,
  language language_code not null default 'pt',
  published_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null,
  translation_group_id uuid not null default gen_random_uuid(),
  source_post_id uuid references public.posts(id) on delete set null,
  translation_status public.translation_status,
  translation_source_hash text,
  translated_at timestamptz,
  translation_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_language_idx on public.posts (language);
create unique index if not exists posts_language_slug_unique on public.posts (language, slug);
create index if not exists posts_translation_group_idx on public.posts (translation_group_id);
create index if not exists posts_source_post_idx on public.posts (source_post_id);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists partners_active_idx on public.partners (is_active);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_weight integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists services_active_idx on public.services (is_active);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  cover_url text,
  link text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_active_idx on public.projects (is_active);

-- Helper functions (after tables exist)
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

create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_transaction_id text,
  p_reference text,
  p_amount numeric,
  p_response jsonb default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  if v_order.status = 'paid' then
    return json_build_object(
      'success', true,
      'order_id', v_order.id,
      'status', v_order.status
    );
  end if;

  if p_amount is not null and v_order.total <> p_amount then
    raise exception 'Amount mismatch. Expected %, got %', v_order.total, p_amount;
  end if;

  update public.orders
  set
    status = 'paid',
    paid_at = now(),
    mpesa_transaction_id = coalesce(p_transaction_id, mpesa_transaction_id),
    mpesa_reference = coalesce(p_reference, mpesa_reference),
    mpesa_last_response = coalesce(p_response, mpesa_last_response),
    updated_at = now()
  where id = v_order.id;

  return json_build_object(
    'success', true,
    'order_id', v_order.id,
    'status', 'paid'
  );
end;
$$;

create or replace function public.mark_order_failed(
  p_order_id uuid,
  p_transaction_id text,
  p_reference text,
  p_response jsonb default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  update public.orders
  set
    status = 'failed',
    mpesa_transaction_id = coalesce(p_transaction_id, mpesa_transaction_id),
    mpesa_reference = coalesce(p_reference, mpesa_reference),
    mpesa_last_response = coalesce(p_response, mpesa_last_response),
    updated_at = now()
  where id = v_order.id;

  return json_build_object(
    'success', true,
    'order_id', v_order.id,
    'status', 'failed'
  );
end;
$$;

grant execute on function public.mark_order_paid(uuid, text, text, numeric, jsonb) to service_role;
grant execute on function public.mark_order_failed(uuid, text, text, jsonb) to service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.authors enable row level security;
alter table public.authors_books enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.posts enable row level security;
alter table public.partners enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;

-- Ensure new columns exist on existing deployments
alter table public.books
  add column if not exists description_json jsonb,
  add column if not exists cover_path text,
  add column if not exists featured boolean default false,
  add column if not exists isbn text,
  add column if not exists publisher text,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.profiles
  add column if not exists photo_path text,
  add column if not exists email text,
  add column if not exists birth_date date,
  add column if not exists residence_city text,
  add column if not exists province text,
  add column if not exists published_works jsonb default '[]'::jsonb,
  add column if not exists author_gallery jsonb default '[]'::jsonb,
  add column if not exists featured_video text,
  add column if not exists author_type text,
  add column if not exists featured boolean default false;

alter table public.authors
  add column if not exists author_type text,
  add column if not exists wp_id bigint,
  add column if not exists wp_slug text,
  add column if not exists bio text,
  add column if not exists photo_path text,
  add column if not exists photo_url text,
  add column if not exists social_links jsonb default '{}'::jsonb,
  add column if not exists featured boolean default false,
  add column if not exists phone text,
  add column if not exists birth_date date,
  add column if not exists residence_city text,
  add column if not exists province text,
  add column if not exists published_works jsonb default '[]'::jsonb,
  add column if not exists author_gallery jsonb default '[]'::jsonb,
  add column if not exists featured_video text;

alter table public.orders
  add column if not exists payment_method text default 'mpesa',
  add column if not exists mpesa_transaction_id text,
  add column if not exists mpesa_reference text,
  add column if not exists mpesa_last_response jsonb,
  add column if not exists paid_at timestamptz;

-- Profiles policies
drop policy if exists "Profiles: user can view own profile" on public.profiles;
create policy "Profiles: user can view own profile" on public.profiles
  for select using (auth.uid() = id);

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

-- Newsletter subscriptions policies
alter table public.newsletter_subscriptions enable row level security;

drop policy if exists "Newsletter: admins full access" on public.newsletter_subscriptions;
create policy "Newsletter: admins full access" on public.newsletter_subscriptions
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

-- Posts policies
drop policy if exists "Posts: public can read published" on public.posts;
create policy "Posts: public can read published" on public.posts
  for select using (status = 'published');

drop policy if exists "Posts: admins full access" on public.posts;
create policy "Posts: admins full access" on public.posts
  for all using (public.is_admin()) with check (public.is_admin());

-- Partners policies
drop policy if exists "Partners: public can read active" on public.partners;
create policy "Partners: public can read active" on public.partners
  for select using (is_active);

drop policy if exists "Partners: admins full access" on public.partners;
create policy "Partners: admins full access" on public.partners
  for all using (public.is_admin()) with check (public.is_admin());

-- Services policies
drop policy if exists "Services: public can read active" on public.services;
create policy "Services: public can read active" on public.services
  for select using (is_active);

drop policy if exists "Services: admins full access" on public.services;
create policy "Services: admins full access" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- Projects policies
drop policy if exists "Projects: public can read active" on public.projects;
create policy "Projects: public can read active" on public.projects
  for select using (is_active);

drop policy if exists "Projects: admins full access" on public.projects;
create policy "Projects: admins full access" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

-- Storage buckets (covers, authors, partners, author-photos)
insert into storage.buckets (id, name, public) values
  ('covers', 'covers', true),
  ('authors', 'authors', true),
  ('partners', 'partners', true),
  ('author-photos', 'author-photos', true)
on conflict (id) do nothing;

-- Storage policies for public assets and admin uploads
do $$
begin
  alter table storage.objects enable row level security;

  drop policy if exists "Storage: public can read covers/authors/partners/author-photos" on storage.objects;
  create policy "Storage: public can read covers/authors/partners/author-photos"
    on storage.objects for select
    using (bucket_id in ('covers','authors','partners','author-photos'));

  drop policy if exists "Storage: admin can manage covers/authors/partners" on storage.objects;
  create policy "Storage: admin can manage covers/authors/partners"
    on storage.objects for all
    using (public.is_admin())
    with check (public.is_admin());

  -- Author-photos storage policies (users can upload to their own folder)
  drop policy if exists "Storage: users can upload own author photos" on storage.objects;
  create policy "Storage: users can upload own author photos"
    on storage.objects for insert
    with check (
      bucket_id = 'author-photos'
      and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_admin()
      )
    );

  drop policy if exists "Storage: users can delete own author photos" on storage.objects;
  create policy "Storage: users can delete own author photos"
    on storage.objects for delete
    using (
      bucket_id = 'author-photos'
      and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_admin()
      )
    );
exception
  when insufficient_privilege then
    raise notice 'Skipping storage.objects policies (insufficient privileges).';
end $$;

-- Digital books storage bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('digital-books', 'digital-books', false, 52428800, array['application/pdf', 'application/epub+zip'])
on conflict (id) do nothing;

do $$
begin
  drop policy if exists "Storage: admin can manage digital books" on storage.objects;
  create policy "Storage: admin can manage digital books"
    on storage.objects for all
    using (bucket_id = 'digital-books' and public.is_admin())
    with check (bucket_id = 'digital-books' and public.is_admin());
exception
  when insufficient_privilege then
    raise notice 'Skipping storage.objects policies for digital books (insufficient privileges).';
end $$;

-- Simple published/active defaults
update public.posts set status = 'published' where status is null;
update public.partners set is_active = true where is_active is null;
update public.services set is_active = true where is_active is null;
update public.projects set is_active = true where is_active is null;

-- Publications (PDF flipbook viewer)
do $$
begin
  create type public.display_mode as enum ('single', 'double');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  pdf_path text not null,
  pdf_url text,
  file_size_bytes bigint,
  page_count integer,
  cover_path text,
  cover_url text,
  table_of_contents jsonb default '[]'::jsonb,
  display_mode display_mode not null default 'double',
  page_width integer not null default 400,
  page_height integer not null default 600,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  publish_date timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

create unique index if not exists publications_slug_idx on public.publications(slug);
create index if not exists publications_active_idx on public.publications(is_active, publish_date desc);

create table if not exists public.publication_pages (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  page_number integer not null,
  image_path text not null,
  image_url text,
  thumbnail_path text,
  thumbnail_url text,
  width integer,
  height integer,
  text_content text,
  created_at timestamptz not null default now(),
  unique(publication_id, page_number)
);

create index if not exists publication_pages_pub_idx on public.publication_pages(publication_id, page_number);

-- Publications RLS
alter table public.publications enable row level security;
alter table public.publication_pages enable row level security;

drop policy if exists "Publications: public can read active" on public.publications;
create policy "Publications: public can read active" on public.publications
  for select using (is_active = true);

drop policy if exists "Publications: admins full access" on public.publications;
create policy "Publications: admins full access" on public.publications
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "PublicationPages: public can read pages of active publications" on public.publication_pages;
create policy "PublicationPages: public can read pages of active publications" on public.publication_pages
  for select using (
    exists (
      select 1 from public.publications
      where publications.id = publication_pages.publication_id
      and publications.is_active = true
    )
  );

drop policy if exists "PublicationPages: admins full access" on public.publication_pages;
create policy "PublicationPages: admins full access" on public.publication_pages
  for all using (public.is_admin()) with check (public.is_admin());

-- Publications storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('publications', 'publications', true, 52428800, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

do $$
begin
  drop policy if exists "Storage: public can read publications" on storage.objects;
  create policy "Storage: public can read publications"
    on storage.objects for select
    using (bucket_id = 'publications');

  drop policy if exists "Storage: admin can manage publications" on storage.objects;
  create policy "Storage: admin can manage publications"
    on storage.objects for insert
    with check (bucket_id = 'publications' and public.is_admin());

  drop policy if exists "Storage: admin can delete publications" on storage.objects;
  create policy "Storage: admin can delete publications"
    on storage.objects for delete
    using (bucket_id = 'publications' and public.is_admin());
exception
  when insufficient_privilege then
    raise notice 'Skipping storage.objects policies for publications (insufficient privileges).';
end $$;
