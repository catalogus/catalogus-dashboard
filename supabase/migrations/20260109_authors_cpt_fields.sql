alter table public.authors
  add column if not exists wp_id bigint,
  add column if not exists wp_slug text,
  add column if not exists bio text,
  add column if not exists photo_url text,
  add column if not exists phone text,
  add column if not exists birth_date date,
  add column if not exists residence_city text,
  add column if not exists province text,
  add column if not exists published_works jsonb default '[]'::jsonb,
  add column if not exists author_gallery jsonb default '[]'::jsonb,
  add column if not exists featured_video text,
  add column if not exists author_type text;

create unique index if not exists authors_wp_id_key on public.authors (wp_id);
create index if not exists authors_wp_slug_idx on public.authors (wp_slug);
