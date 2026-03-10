-- ============================================
-- Ensure posts.author_id references profiles
-- to support REST relationship joins.
-- ============================================

DO $$ BEGIN
  ALTER TABLE public.posts
    DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;
