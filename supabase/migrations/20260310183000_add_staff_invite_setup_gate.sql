alter table public.profiles
  add column if not exists must_set_password boolean not null default false;

comment on column public.profiles.must_set_password is
  'When true, the user must complete password setup before dashboard access is allowed.';
