-- Adjust pre-venda promo logic to show immediately until end date
-- Created: 2026-02-06

-- Recreate books_shop view with pre-venda rules

drop view if exists public.books_shop;

create view public.books_shop
with (security_invoker = true) as
select
  b.*,
  (
    b.promo_type is not null
    and (
      (b.promo_type = 'pre-venda'
        and (b.promo_end_date is null or current_date <= b.promo_end_date))
      or (
        b.promo_type <> 'pre-venda'
        and (b.promo_start_date is null or current_date >= b.promo_start_date)
        and (b.promo_end_date is null or current_date <= b.promo_end_date)
      )
    )
  ) as promo_is_active,
  case
    when b.promo_type is not null
      and (
        (b.promo_type = 'pre-venda'
          and (b.promo_end_date is null or current_date <= b.promo_end_date))
        or (
          b.promo_type <> 'pre-venda'
          and (b.promo_start_date is null or current_date >= b.promo_start_date)
          and (b.promo_end_date is null or current_date <= b.promo_end_date)
        )
      )
      and b.promo_price_mzn is not null
      and b.promo_price_mzn < b.price_mzn
    then b.promo_price_mzn
    else b.price_mzn
  end as effective_price_mzn
from public.books b;

grant select on public.books_shop to anon;
grant select on public.books_shop to authenticated;
