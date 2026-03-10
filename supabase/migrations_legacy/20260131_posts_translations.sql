-- ============================================
-- Posts Translations (PT/EN)
-- Adds translation linkage + status and localized
-- fields for categories/tags.
-- ============================================

-- 1) Translation status enum
DO $$ BEGIN
  CREATE TYPE public.translation_status AS ENUM ('pending', 'review', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) Extend posts table for translations
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS translation_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS source_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS translation_status public.translation_status,
  ADD COLUMN IF NOT EXISTS translation_source_hash text,
  ADD COLUMN IF NOT EXISTS translated_at timestamptz,
  ADD COLUMN IF NOT EXISTS translation_error text;

-- 3) Slug uniqueness should be per language
DO $$ BEGIN
  ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_slug_key;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS posts_language_slug_unique
  ON public.posts (language, slug);

CREATE INDEX IF NOT EXISTS posts_translation_group_idx
  ON public.posts (translation_group_id);

CREATE INDEX IF NOT EXISTS posts_source_post_idx
  ON public.posts (source_post_id);

-- 4) Localized fields for categories/tags (PT base + EN columns)
ALTER TABLE public.post_categories
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS slug_en text,
  ADD COLUMN IF NOT EXISTS description_en text;

ALTER TABLE public.post_tags
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS slug_en text,
  ADD COLUMN IF NOT EXISTS description_en text;

CREATE UNIQUE INDEX IF NOT EXISTS post_categories_slug_en_unique
  ON public.post_categories (slug_en)
  WHERE slug_en IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS post_tags_slug_en_unique
  ON public.post_tags (slug_en)
  WHERE slug_en IS NOT NULL;
