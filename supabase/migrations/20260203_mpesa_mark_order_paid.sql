-- M-Pesa: mark order paid/failed helpers

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
