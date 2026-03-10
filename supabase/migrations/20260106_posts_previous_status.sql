-- Adds previous_status to track restores
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS previous_status public.content_status;
