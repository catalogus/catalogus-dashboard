-- Book promotions + shop effective price
-- Created: 2026-02-06

-- ================================================
-- 1. Add promotion fields to books
-- ================================================

alter table public.books
  add column if not exists promo_type text,
  add column if not exists promo_price_mzn numeric(12, 2),
  add column if not exists promo_start_date date,
  add column if not exists promo_end_date date;

alter table public.books
  drop constraint if exists books_promo_type_check;
alter table public.books
  add constraint books_promo_type_check
  check (promo_type is null or promo_type in ('promocao', 'pre-venda'));

-- ================================================
-- 2. Create a shop view with effective price
-- ================================================

drop view if exists public.books_shop;

create view public.books_shop
with (security_invoker = true) as
select
  b.*,
  (
    b.promo_type is not null
    and (b.promo_start_date is null or current_date >= b.promo_start_date)
    and (b.promo_end_date is null or current_date <= b.promo_end_date)
  ) as promo_is_active,
  case
    when b.promo_type is not null
      and (b.promo_start_date is null or current_date >= b.promo_start_date)
      and (b.promo_end_date is null or current_date <= b.promo_end_date)
      and b.promo_price_mzn is not null
      and b.promo_price_mzn < b.price_mzn
    then b.promo_price_mzn
    else b.price_mzn
  end as effective_price_mzn
from public.books b;

grant select on public.books_shop to anon;
grant select on public.books_shop to authenticated;

-- ================================================
-- 3. Update shop metadata RPC to use effective price
-- ================================================

create or replace function get_shop_metadata()
returns json
language plpgsql
security definer
as $$
declare
  v_categories json;
  v_price_range json;
begin
  -- Get unique categories from active books
  select json_agg(distinct category order by category)
  into v_categories
  from books
  where is_active = true
    and category is not null;

  -- Get price range based on effective price
  select json_build_object(
    'min', 0,
    'max', ceil(coalesce(max(effective_price_mzn), 10000) / 100) * 100
  )
  into v_price_range
  from books_shop
  where is_active = true
    and effective_price_mzn is not null;

  return json_build_object(
    'categories', coalesce(v_categories, '[]'::json),
    'priceRange', v_price_range
  );
end;
$$;

grant execute on function get_shop_metadata() to authenticated;
grant execute on function get_shop_metadata() to anon;

comment on function get_shop_metadata() is
  'Returns shop filter metadata (categories and price range) using effective promo pricing';
