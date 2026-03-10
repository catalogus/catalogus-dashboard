-- Refresh books_shop view to include digital book columns
-- Created: 2026-02-06

-- Ensure digital access type exists
DO $$
BEGIN
  CREATE TYPE public.digital_access AS ENUM ('paid', 'free');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ensure digital book columns exist
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS is_digital boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS digital_access public.digital_access,
  ADD COLUMN IF NOT EXISTS digital_file_path text,
  ADD COLUMN IF NOT EXISTS digital_file_url text;

ALTER TABLE public.books
  DROP CONSTRAINT IF EXISTS books_digital_access_check;
ALTER TABLE public.books
  ADD CONSTRAINT books_digital_access_check
  CHECK (is_digital = false OR digital_access IS NOT NULL);

-- Recreate view to pick up any new columns
DROP VIEW IF EXISTS public.books_shop;

CREATE VIEW public.books_shop
WITH (security_invoker = true) AS
SELECT
  b.*,
  (
    b.promo_type IS NOT NULL
    AND (
      (b.promo_type = 'pre-venda'
        AND (b.promo_end_date IS NULL OR current_date <= b.promo_end_date))
      OR (
        b.promo_type <> 'pre-venda'
        AND (b.promo_start_date IS NULL OR current_date >= b.promo_start_date)
        AND (b.promo_end_date IS NULL OR current_date <= b.promo_end_date)
      )
    )
  ) AS promo_is_active,
  CASE
    WHEN b.promo_type IS NOT NULL
      AND (
        (b.promo_type = 'pre-venda'
          AND (b.promo_end_date IS NULL OR current_date <= b.promo_end_date))
        OR (
          b.promo_type <> 'pre-venda'
          AND (b.promo_start_date IS NULL OR current_date >= b.promo_start_date)
          AND (b.promo_end_date IS NULL OR current_date <= b.promo_end_date)
        )
      )
      AND b.promo_price_mzn IS NOT NULL
      AND b.promo_price_mzn < b.price_mzn
    THEN b.promo_price_mzn
    ELSE b.price_mzn
  END AS effective_price_mzn
FROM public.books b;

GRANT SELECT ON public.books_shop TO anon;
GRANT SELECT ON public.books_shop TO authenticated;
