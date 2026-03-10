-- Admin levels and super admin enforcement

do $$
begin
  create type public.admin_level as enum ('super_admin', 'content_admin');
exception
  when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists admin_level public.admin_level;

update public.profiles
set admin_level = 'content_admin'::public.admin_level
where role = 'admin' and admin_level is null;

update public.profiles
set admin_level = null
where role <> 'admin' and admin_level is not null;

alter table public.profiles
  drop constraint if exists profiles_admin_level_consistency;

alter table public.profiles
  add constraint profiles_admin_level_consistency
  check (
    (role = 'admin' and admin_level is not null)
    or (role <> 'admin' and admin_level is null)
  );

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.admin_level = 'super_admin'
  );
$$;

create or replace function public.is_content_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.admin_level = 'content_admin'
  );
$$;

create or replace function public.enforce_admin_level_guardrails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  super_admin_count integer;
begin
  if tg_op = 'DELETE' then
    if old.role = 'admin' and old.admin_level = 'super_admin' then
      select count(*)
      into super_admin_count
      from public.profiles
      where role = 'admin'
        and admin_level = 'super_admin'
        and id <> old.id;

      if super_admin_count < 1 then
        raise exception 'At least one super admin account is required.';
      end if;
    end if;

    return old;
  end if;

  if new.role <> 'admin' then
    new.admin_level := null;
    return new;
  end if;

  if new.admin_level is null then
    new.admin_level := 'content_admin';
  end if;

  if new.admin_level = 'super_admin' then
    select count(*)
    into super_admin_count
    from public.profiles
    where role = 'admin'
      and admin_level = 'super_admin'
      and id <> new.id;

    if super_admin_count >= 2 then
      raise exception 'Super admin limit reached (max 2).';
    end if;
  end if;

  if tg_op = 'UPDATE'
    and old.role = 'admin'
    and old.admin_level = 'super_admin'
    and not (new.role = 'admin' and new.admin_level = 'super_admin') then
    select count(*)
    into super_admin_count
    from public.profiles
    where role = 'admin'
      and admin_level = 'super_admin'
      and id <> old.id;

    if super_admin_count < 1 then
      raise exception 'At least one super admin account is required.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_admin_level_guardrails on public.profiles;
create trigger profiles_admin_level_guardrails
before insert or update or delete on public.profiles
for each row
execute function public.enforce_admin_level_guardrails();

drop policy if exists "Profiles: admins can upsert" on public.profiles;
create policy "Profiles: admins can upsert" on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "Orders: admins can read all" on public.orders;
create policy "Orders: admins can read all" on public.orders
  for select using (public.is_super_admin());

drop policy if exists "Orders: service/admin can insert" on public.orders;
create policy "Orders: service/admin can insert" on public.orders
  for insert with check (public.is_super_admin() or public.is_service_role());

drop policy if exists "Orders: service/admin can update" on public.orders;
create policy "Orders: service/admin can update" on public.orders
  for update using (public.is_super_admin() or public.is_service_role());

drop policy if exists "OrderItems: admins can read all" on public.order_items;
create policy "OrderItems: admins can read all" on public.order_items
  for select using (public.is_super_admin());

drop policy if exists "OrderItems: service/admin can insert" on public.order_items;
create policy "OrderItems: service/admin can insert" on public.order_items
  for insert with check (public.is_super_admin() or public.is_service_role());

drop policy if exists "OrderItems: service/admin can update" on public.order_items;
create policy "OrderItems: service/admin can update" on public.order_items
  for update using (public.is_super_admin() or public.is_service_role());
