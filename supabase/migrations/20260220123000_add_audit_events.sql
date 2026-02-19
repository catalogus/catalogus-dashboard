create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid null references public.profiles(id) on delete set null,
  actor_role public.user_role null,
  actor_name text null,
  action text not null,
  entity_type text not null,
  entity_id text null,
  outcome text not null default 'success' check (outcome in ('success', 'error')),
  summary text null,
  changed_fields jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_audit_events_occurred_at on public.audit_events (occurred_at desc);
create index if not exists idx_audit_events_actor on public.audit_events (actor_id, occurred_at desc);
create index if not exists idx_audit_events_entity on public.audit_events (entity_type, entity_id, occurred_at desc);
create index if not exists idx_audit_events_error on public.audit_events (occurred_at desc) where outcome = 'error';

alter table public.audit_events enable row level security;

drop policy if exists "Admins can read audit events" on public.audit_events;
create policy "Admins can read audit events"
on public.audit_events
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Admins and authors can insert own audit events" on public.audit_events;
create policy "Admins and authors can insert own audit events"
on public.audit_events
for insert
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'author')
  )
);

create or replace function public.jsonb_changed_keys(old_row jsonb, new_row jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_agg(key order by key), '[]'::jsonb)
  from (
    select key
    from jsonb_object_keys(coalesce(old_row, '{}'::jsonb)) as key
    union
    select key
    from jsonb_object_keys(coalesce(new_row, '{}'::jsonb)) as key
  ) keys
  where coalesce(old_row -> keys.key, 'null'::jsonb) is distinct from coalesce(new_row -> keys.key, 'null'::jsonb);
$$;

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_outcome text default 'success',
  p_summary text default null,
  p_changed_fields jsonb default '[]'::jsonb,
  p_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role;
  v_actor_name text;
  v_event_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select role, name into v_actor_role, v_actor_name
  from public.profiles
  where id = v_actor_id;

  if v_actor_role not in ('admin', 'author') then
    raise exception 'Insufficient permissions to write audit events';
  end if;

  insert into public.audit_events (
    actor_id,
    actor_role,
    actor_name,
    action,
    entity_type,
    entity_id,
    outcome,
    summary,
    changed_fields,
    meta
  )
  values (
    v_actor_id,
    v_actor_role,
    v_actor_name,
    p_action,
    p_entity_type,
    p_entity_id,
    case when p_outcome = 'error' then 'error' else 'success' end,
    left(p_summary, 300),
    coalesce(p_changed_fields, '[]'::jsonb),
    coalesce(p_meta, '{}'::jsonb)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

grant execute on function public.log_audit_event(text, text, text, text, text, jsonb, jsonb) to authenticated;

create or replace function public.purge_old_audit_events(p_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_deleted int := 0;
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = v_actor_id
      and p.role = 'admin'
  ) then
    raise exception 'Only admins can purge audit logs';
  end if;

  delete from public.audit_events
  where occurred_at < now() - make_interval(days => greatest(p_days, 1));

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.purge_old_audit_events(integer) to authenticated;

create or replace function public.audit_tracked_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role;
  v_actor_name text;
  v_old jsonb := '{}'::jsonb;
  v_new jsonb := '{}'::jsonb;
  v_changed_keys jsonb := '[]'::jsonb;
  v_entity_id text;
begin
  if v_actor_id is null then
    return coalesce(new, old);
  end if;

  select role, name into v_actor_role, v_actor_name
  from public.profiles
  where id = v_actor_id;

  if v_actor_role not in ('admin', 'author') then
    return coalesce(new, old);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old) - 'updated_at' - 'created_at';
  end if;

  if tg_op in ('UPDATE', 'INSERT') then
    v_new := to_jsonb(new) - 'updated_at' - 'created_at';
  end if;

  if tg_op = 'UPDATE' then
    v_changed_keys := public.jsonb_changed_keys(v_old, v_new);
    if jsonb_array_length(v_changed_keys) = 0 then
      return new;
    end if;
  elsif tg_op = 'INSERT' then
    v_changed_keys := coalesce((
      select jsonb_agg(key order by key)
      from jsonb_object_keys(v_new) key
    ), '[]'::jsonb);
  else
    v_changed_keys := coalesce((
      select jsonb_agg(key order by key)
      from jsonb_object_keys(v_old) key
    ), '[]'::jsonb);
  end if;

  v_entity_id := coalesce(v_new ->> 'id', v_old ->> 'id');

  insert into public.audit_events (
    actor_id,
    actor_role,
    actor_name,
    action,
    entity_type,
    entity_id,
    outcome,
    summary,
    changed_fields,
    meta
  ) values (
    v_actor_id,
    v_actor_role,
    v_actor_name,
    lower(tg_table_name || '.' || tg_op),
    tg_table_name,
    v_entity_id,
    'success',
    left(initcap(tg_op) || ' em ' || tg_table_name, 300),
    v_changed_keys,
    '{}'::jsonb
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_hero_slides on public.hero_slides;
create trigger trg_audit_hero_slides
after insert or update or delete on public.hero_slides
for each row execute function public.audit_tracked_changes();

drop trigger if exists trg_audit_posts on public.posts;
create trigger trg_audit_posts
after insert or update or delete on public.posts
for each row execute function public.audit_tracked_changes();

drop trigger if exists trg_audit_books on public.books;
create trigger trg_audit_books
after insert or update or delete on public.books
for each row execute function public.audit_tracked_changes();

drop trigger if exists trg_audit_authors on public.authors;
create trigger trg_audit_authors
after insert or update or delete on public.authors
for each row execute function public.audit_tracked_changes();

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
after update on public.profiles
for each row execute function public.audit_tracked_changes();

drop trigger if exists trg_audit_orders on public.orders;
create trigger trg_audit_orders
after update on public.orders
for each row execute function public.audit_tracked_changes();

drop trigger if exists trg_audit_publications on public.publications;
create trigger trg_audit_publications
after insert or update or delete on public.publications
for each row execute function public.audit_tracked_changes();

drop trigger if exists trg_audit_author_claims on public.author_claims;
create trigger trg_audit_author_claims
after insert or update or delete on public.author_claims
for each row execute function public.audit_tracked_changes();
