create or replace function public.decrement_book_stock(book_id uuid, quantity integer)
returns void
language plpgsql
as $$
begin
  update books
  set stock = stock - quantity
  where id = book_id and stock >= quantity;

  if not found then
    raise exception 'Insufficient stock for book %', book_id;
  end if;
end;
$$;
