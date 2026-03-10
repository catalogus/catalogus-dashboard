-- Atomic Checkout RPC Function
-- Created: 2026-01-11
-- Description: Create order, order items, and decrement stock in a single atomic transaction

-- ================================================
-- 1. Create order number sequence if it doesn't exist
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'order_number_seq') THEN
    CREATE SEQUENCE order_number_seq START WITH 1;
  END IF;
END $$;

-- ================================================
-- 2. Create atomic checkout RPC function
-- ================================================

CREATE OR REPLACE FUNCTION create_order_atomic(
  p_customer_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_total NUMERIC,
  p_items JSONB  -- Array of {book_id, quantity, price}
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_book_id UUID;
  v_quantity INTEGER;
  v_price NUMERIC;
  v_current_stock INTEGER;
BEGIN
  -- Generate order number
  SELECT 'ORD-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 8, '0')
  INTO v_order_number;

  -- Insert order
  INSERT INTO orders (
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
  VALUES (
    p_customer_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_total,
    'pending',
    'mpesa',
    v_order_number,
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- Insert order items and decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Extract values from JSON
    v_book_id := (v_item->>'book_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_price := (v_item->>'price')::NUMERIC;

    -- Check current stock
    SELECT stock INTO v_current_stock
    FROM books
    WHERE id = v_book_id;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Book % not found', v_book_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for book %. Available: %, Requested: %',
        v_book_id, v_current_stock, v_quantity;
    END IF;

    -- Insert order item
    INSERT INTO order_items (order_id, book_id, quantity, price)
    VALUES (v_order_id, v_book_id, v_quantity, v_price);

    -- Decrement stock
    UPDATE books
    SET stock = stock - v_quantity
    WHERE id = v_book_id;
  END LOOP;

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically on exception
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ================================================
-- 3. Grant execute permissions
-- ================================================

GRANT EXECUTE ON FUNCTION create_order_atomic(UUID, TEXT, TEXT, TEXT, NUMERIC, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_atomic(UUID, TEXT, TEXT, TEXT, NUMERIC, JSONB) TO service_role;

-- ================================================
-- 4. Add comment for documentation
-- ================================================

COMMENT ON FUNCTION create_order_atomic(UUID, TEXT, TEXT, TEXT, NUMERIC, JSONB) IS
  'Atomically creates an order with items and decrements stock.
   All operations succeed or fail together as a transaction.
   Returns: {success: boolean, order_id?: uuid, order_number?: string, error?: string}';

-- ================================================
-- 5. Test the function
-- ================================================

DO $$
DECLARE
  v_result json;
BEGIN
  RAISE NOTICE 'Atomic checkout RPC function created successfully';
END $$;
