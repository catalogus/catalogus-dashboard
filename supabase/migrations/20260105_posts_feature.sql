-- ============================================
-- Posts Feature Migration
-- Creates categories, tags, and extends posts table
-- ============================================

-- ============================================
-- 0. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. EXTEND POSTS TABLE
-- ============================================

-- Add new columns to existing posts table
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS featured_image_path text,
  ADD COLUMN IF NOT EXISTS content_json jsonb,
  ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'post',
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Update content_status enum to include new statuses
DO $$ BEGIN
  -- Drop existing policies that depend on status column
  DROP POLICY IF EXISTS "Posts: public can read published" ON public.posts;
  DROP POLICY IF EXISTS "Posts: admins full access" ON public.posts;
  DROP POLICY IF EXISTS "Posts: authors can read own" ON public.posts;
  DROP POLICY IF EXISTS "Posts: authors can edit own drafts" ON public.posts;

  -- Drop the default constraint first
  ALTER TABLE public.posts ALTER COLUMN status DROP DEFAULT;

  -- Drop old enum if exists and recreate
  ALTER TYPE public.content_status RENAME TO content_status_old;

  CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'scheduled', 'trash', 'pending');

  -- Update posts table to use new enum
  ALTER TABLE public.posts
    ALTER COLUMN status TYPE public.content_status USING status::text::public.content_status;

  -- Re-add default
  ALTER TABLE public.posts ALTER COLUMN status SET DEFAULT 'draft'::public.content_status;

  -- Drop old enum
  DROP TYPE public.content_status_old;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS posts_featured_idx ON public.posts (featured);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON public.posts (published_at DESC);

-- ============================================
-- 2. CREATE CATEGORIES TABLE (Hierarchical)
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES public.post_categories(id) ON DELETE SET NULL,
  order_weight integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_categories_slug_idx ON public.post_categories (slug);
CREATE INDEX IF NOT EXISTS post_categories_parent_idx ON public.post_categories (parent_id);
CREATE INDEX IF NOT EXISTS post_categories_active_idx ON public.post_categories (is_active);

-- ============================================
-- 3. CREATE TAGS TABLE (Flat)
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_tags_slug_idx ON public.post_tags (slug);
CREATE INDEX IF NOT EXISTS post_tags_name_idx ON public.post_tags (name);

-- ============================================
-- 4. CREATE JUNCTION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_categories_map (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.post_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.post_tags_map (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.post_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS post_categories_map_post_idx ON public.post_categories_map (post_id);
CREATE INDEX IF NOT EXISTS post_categories_map_category_idx ON public.post_categories_map (category_id);
CREATE INDEX IF NOT EXISTS post_tags_map_post_idx ON public.post_tags_map (post_id);
CREATE INDEX IF NOT EXISTS post_tags_map_tag_idx ON public.post_tags_map (tag_id);

-- ============================================
-- 5. CREATE STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_categories_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags_map ENABLE ROW LEVEL SECURITY;

-- Posts RLS (policies were dropped earlier to allow enum change)
CREATE POLICY "Posts: public can read published"
  ON public.posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Posts: admins full access"
  ON public.posts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Posts: authors can read own"
  ON public.posts FOR SELECT
  USING (author_id = auth.uid());

CREATE POLICY "Posts: authors can edit own drafts"
  ON public.posts FOR UPDATE
  USING (author_id = auth.uid() AND status IN ('draft', 'pending'))
  WITH CHECK (author_id = auth.uid());

-- Categories RLS
DROP POLICY IF EXISTS "Categories: public can read active" ON public.post_categories;
DROP POLICY IF EXISTS "Categories: admins full access" ON public.post_categories;

CREATE POLICY "Categories: public can read active"
  ON public.post_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Categories: admins full access"
  ON public.post_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Tags RLS
DROP POLICY IF EXISTS "Tags: public can read active" ON public.post_tags;
DROP POLICY IF EXISTS "Tags: admins full access" ON public.post_tags;

CREATE POLICY "Tags: public can read active"
  ON public.post_tags FOR SELECT
  USING (is_active = true);

CREATE POLICY "Tags: admins full access"
  ON public.post_tags FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Junction tables RLS
DROP POLICY IF EXISTS "Post categories map: public can read" ON public.post_categories_map;
DROP POLICY IF EXISTS "Post categories map: admins manage" ON public.post_categories_map;
DROP POLICY IF EXISTS "Post tags map: public can read" ON public.post_tags_map;
DROP POLICY IF EXISTS "Post tags map: admins manage" ON public.post_tags_map;

CREATE POLICY "Post categories map: public can read"
  ON public.post_categories_map FOR SELECT
  USING (true);

CREATE POLICY "Post categories map: admins manage"
  ON public.post_categories_map FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Post tags map: public can read"
  ON public.post_tags_map FOR SELECT
  USING (true);

CREATE POLICY "Post tags map: admins manage"
  ON public.post_tags_map FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 7. STORAGE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Post images: public read" ON storage.objects;
DROP POLICY IF EXISTS "Post images: admins upload" ON storage.objects;
DROP POLICY IF EXISTS "Post images: admins delete" ON storage.objects;

CREATE POLICY "Post images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Post images: admins upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images' AND public.is_admin());

CREATE POLICY "Post images: admins delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-images' AND public.is_admin());

-- ============================================
-- 8. AUTO-UPDATE TIMESTAMPS TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS post_categories_updated_at ON public.post_categories;
CREATE TRIGGER post_categories_updated_at
  BEFORE UPDATE ON public.post_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS post_tags_updated_at ON public.post_tags;
CREATE TRIGGER post_tags_updated_at
  BEFORE UPDATE ON public.post_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 9. SEED DATA (Sample categories and tags)
-- ============================================

INSERT INTO public.post_categories (name, slug, description, parent_id, order_weight) VALUES
  ('News', 'news', 'Latest news and updates', NULL, 1),
  ('Tutorials', 'tutorials', 'How-to guides and tutorials', NULL, 2),
  ('Reviews', 'reviews', 'Book reviews and recommendations', NULL, 3),
  ('Interviews', 'interviews', 'Author and publisher interviews', NULL, 4),
  ('Events', 'events', 'Literary events and announcements', NULL, 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.post_tags (name, slug, description) VALUES
  ('Fiction', 'fiction', 'Fiction literature'),
  ('Non-Fiction', 'non-fiction', 'Non-fiction works'),
  ('Poetry', 'poetry', 'Poetry and verse'),
  ('Literary Analysis', 'literary-analysis', 'Analysis and critique'),
  ('Writing Tips', 'writing-tips', 'Tips for writers'),
  ('Publishing', 'publishing', 'Publishing industry news'),
  ('Mozambique', 'mozambique', 'Mozambican literature'),
  ('Portuguese Language', 'portuguese-language', 'Portuguese language content')
ON CONFLICT (slug) DO NOTHING;
