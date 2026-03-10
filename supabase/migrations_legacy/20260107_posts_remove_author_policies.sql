-- Remove author post policies (authors cannot create/edit posts)
DROP POLICY IF EXISTS "Posts: authors can read own" ON public.posts;
DROP POLICY IF EXISTS "Posts: authors can edit own drafts" ON public.posts;
