-- Secure order pricing & totals
-- Created: 2026-02-06

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
  v_unit_price NUMERIC;
  v_current_stock INTEGER;
  v_is_digital BOOLEAN;
  v_digital_access public.digital_access;
  v_total NUMERIC := 0;
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
    0,
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

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid quantity for book %', v_book_id;
    end if;

    select
      stock,
      is_digital,
      digital_access,
      effective_price_mzn
    into v_current_stock, v_is_digital, v_digital_access, v_unit_price
    from books_shop
    where id = v_book_id
      and is_active = true;

    if v_unit_price is null then
      raise exception 'Book % not available for purchase', v_book_id;
    end if;

    if coalesce(v_is_digital, false) and v_digital_access = 'free' then
      raise exception 'Free digital books cannot be purchased (%).', v_book_id;
    end if;

    if not coalesce(v_is_digital, false) then
      if v_current_stock is null then
        raise exception 'Book % not found', v_book_id;
      end if;
      if v_current_stock < v_quantity then
        raise exception 'Insufficient stock for book %. Available: %, Requested: %',
          v_book_id, v_current_stock, v_quantity;
      end if;
    end if;

    insert into order_items (order_id, book_id, quantity, price)
    values (v_order_id, v_book_id, v_quantity, v_unit_price);

    if not coalesce(v_is_digital, false) then
      update books
      set stock = stock - v_quantity
      where id = v_book_id;
    end if;

    v_total := v_total + (v_unit_price * v_quantity);
  end loop;

  if p_total is not null and abs(p_total - v_total) > 0.01 then
    raise exception 'Total mismatch. Expected %, received %', v_total, p_total;
  end if;

  update orders
  set total = v_total
  where id = v_order_id;

  return json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );

exception
  when others then
    return json_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;

comment on function create_order_atomic(UUID, TEXT, TEXT, TEXT, NUMERIC, JSONB) is
  'Atomically creates an order with server-validated pricing and stock checks. Returns total computed from books_shop.';
