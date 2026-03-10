-- Shop Metadata RPC Function
-- Created: 2026-01-11
-- Description: Batch categories and price range queries into single RPC call

-- ================================================
-- Create shop metadata RPC function
-- ================================================

CREATE OR REPLACE FUNCTION get_shop_metadata()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_categories json;
  v_price_range json;
BEGIN
  -- Get unique categories from active books
  SELECT json_agg(DISTINCT category ORDER BY category)
  INTO v_categories
  FROM books
  WHERE is_active = true
    AND category IS NOT NULL;

  -- Get price range (min is always 0, max is highest price rounded up)
  SELECT json_build_object(
    'min', 0,
    'max', CEIL(COALESCE(MAX(price_mzn), 10000) / 100) * 100
  )
  INTO v_price_range
  FROM books
  WHERE is_active = true
    AND price_mzn IS NOT NULL;

  -- Return combined result
  RETURN json_build_object(
    'categories', COALESCE(v_categories, '[]'::json),
    'priceRange', v_price_range
  );
END;
$$;

-- ================================================
-- Grant execute to authenticated and anon users
-- ================================================

GRANT EXECUTE ON FUNCTION get_shop_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION get_shop_metadata() TO anon;

-- ================================================
-- Add comment for documentation
-- ================================================

COMMENT ON FUNCTION get_shop_metadata() IS 'Returns shop filter metadata (categories and price range) in a single call';

-- ================================================
-- Test the function
-- ================================================

DO $$
DECLARE
  v_result json;
BEGIN
  SELECT get_shop_metadata() INTO v_result;
  RAISE NOTICE 'Shop metadata RPC created successfully. Result: %', v_result;
END $$;
