-- Digital books + newsletter subscriptions
-- Created: 2026-02-06

-- ================================================
-- 1. Digital book fields
-- ================================================

do $$
begin
  create type public.digital_access as enum ('paid', 'free');
exception
  when duplicate_object then null;
end $$;

alter table public.books
  add column if not exists is_digital boolean not null default false,
  add column if not exists digital_access public.digital_access,
  add column if not exists digital_file_path text,
  add column if not exists digital_file_url text;

alter table public.books
  drop constraint if exists books_digital_access_check;
alter table public.books
  add constraint books_digital_access_check
  check (is_digital = false or digital_access is not null);

-- ================================================
-- 2. Newsletter subscriptions (double opt-in)
-- ================================================

do $$
begin
  create type public.newsletter_status as enum ('pending', 'verified');
exception
  when duplicate_object then null;
end $$;

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

alter table public.newsletter_subscriptions enable row level security;

drop policy if exists "Newsletter: admins full access" on public.newsletter_subscriptions;
create policy "Newsletter: admins full access" on public.newsletter_subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- ================================================
-- 3. Digital books storage bucket (private)
-- ================================================

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

-- ================================================
-- 4. Update atomic checkout to skip stock for digital items
-- ================================================

create or replace function create_order_atomic(
  p_customer_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_total NUMERIC,
  p_items JSONB
)
returns json
language plpgsql
security definer
as $$
declare
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_book_id UUID;
  v_quantity INTEGER;
  v_price NUMERIC;
  v_current_stock INTEGER;
  v_is_digital BOOLEAN;
  v_digital_access public.digital_access;
begin
  select 'ORD-' || lpad(nextval('order_number_seq')::text, 8, '0')
  into v_order_number;

  insert into orders (
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    total,
    status,
    payment_method,
    order_number,
    created_at
  )
  values (
    p_customer_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_total,
    'pending',
    'mpesa',
    v_order_number,
    now()
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_book_id := (v_item->>'book_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;

    select stock, is_digital, digital_access
    into v_current_stock, v_is_digital, v_digital_access
    from books
    where id = v_book_id;

    if v_current_stock is null then
      raise exception 'Book % not found', v_book_id;
    end if;

    if coalesce(v_is_digital, false) and v_digital_access = 'free' then
      raise exception 'Free digital books cannot be purchased (%).', v_book_id;
    end if;

    if not coalesce(v_is_digital, false) then
      if v_current_stock < v_quantity then
        raise exception 'Insufficient stock for book %. Available: %, Requested: %',
          v_book_id, v_current_stock, v_quantity;
      end if;
    end if;

    insert into order_items (order_id, book_id, quantity, price)
    values (v_order_id, v_book_id, v_quantity, v_price);

    if not coalesce(v_is_digital, false) then
      update books
      set stock = stock - v_quantity
      where id = v_book_id;
    end if;
  end loop;

  return json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );

exception
  when others then
    return json_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;
