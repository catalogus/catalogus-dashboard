alter table public.authors
  add column if not exists gender text,
  add constraint authors_gender_check check (gender in ('male', 'female'));

alter table public.profiles
  add column if not exists gender text,
  add constraint profiles_gender_check check (gender in ('male', 'female'));

drop view if exists public.public_profiles;

create view public.public_profiles as
select
  p.id,
  p.name,
  p.bio,
  p.photo_url,
  p.photo_path,
  p.social_links,
  p.birth_date,
  p.residence_city,
  p.province,
  p.published_works,
  p.author_gallery,
  p.featured_video,
  p.author_type,
  p.gender,
  p.role,
  p.status
from public.profiles p
where
  (p.role = 'author' and p.status in ('pending', 'approved'))
  or exists (
    select 1
    from public.posts post
    where post.author_id = p.id
      and post.status = 'published'
  );

grant select on public.public_profiles to anon;
grant select on public.public_profiles to authenticated;
