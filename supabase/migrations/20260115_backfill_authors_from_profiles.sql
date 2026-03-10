-- Backfill author records for approved author profiles.
insert into public.authors (
  name,
  bio,
  photo_url,
  photo_path,
  social_links,
  phone,
  birth_date,
  residence_city,
  province,
  published_works,
  author_gallery,
  featured_video,
  author_type,
  profile_id,
  claim_status,
  claimed_at
)
select
  coalesce(p.name, 'Autor') as name,
  p.bio,
  p.photo_url,
  p.photo_path,
  coalesce(p.social_links, '{}'::jsonb) as social_links,
  p.phone,
  p.birth_date,
  p.residence_city,
  p.province,
  coalesce(p.published_works, '[]'::jsonb) as published_works,
  coalesce(p.author_gallery, '[]'::jsonb) as author_gallery,
  p.featured_video,
  coalesce(p.author_type, 'Autor Registrado') as author_type,
  p.id as profile_id,
  'approved'::public.claim_status as claim_status,
  now() as claimed_at
from public.profiles p
where p.role = 'author'
  and p.status = 'approved'
  and not exists (
    select 1
    from public.authors a
    where a.profile_id = p.id
  );
