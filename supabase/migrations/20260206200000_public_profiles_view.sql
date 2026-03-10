-- Public profiles view (safe fields only)
-- Created: 2026-02-06

-- Remove public select policies on profiles (use view instead)
drop policy if exists "Profiles: public can read author profiles" on public.profiles;
drop policy if exists "Profiles: public can read published post authors" on public.profiles;

-- Create public-facing view
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT
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
  p.role,
  p.status
FROM public.profiles p
WHERE
  (p.role = 'author' AND p.status IN ('pending', 'approved'))
  OR EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE post.author_id = p.id
      AND post.status = 'published'
  );

GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;
