alter table public.authors
  add column if not exists featured boolean default false;

create index if not exists authors_featured_idx on public.authors (featured);
