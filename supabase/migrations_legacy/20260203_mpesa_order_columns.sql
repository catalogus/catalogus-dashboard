-- Add M-Pesa metadata columns to orders

alter table public.orders
  add column if not exists payment_method text default 'mpesa',
  add column if not exists mpesa_reference text,
  add column if not exists mpesa_last_response jsonb,
  add column if not exists paid_at timestamptz;

create index if not exists orders_mpesa_transaction_idx
  on public.orders (mpesa_transaction_id);

create index if not exists orders_payment_method_idx
  on public.orders (payment_method);
