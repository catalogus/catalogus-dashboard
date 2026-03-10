alter table public.profiles
  add column if not exists featured boolean default false;

create index if not exists profiles_featured_idx on public.profiles (featured);
