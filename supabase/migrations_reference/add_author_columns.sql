-- Migration: Add author-related columns to profiles table
-- Run this in Supabase SQL Editor or via: psql < add_author_columns.sql

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_path text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residence_city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS published_works jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS author_gallery jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS featured_video text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS author_type text;

-- Add author_type to authors table
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS author_type text;

-- Create author-photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('author-photos', 'author-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Storage: public can read covers/authors/partners/author-photos" ON storage.objects;
DROP POLICY IF EXISTS "Storage: users can upload own author photos" ON storage.objects;
DROP POLICY IF EXISTS "Storage: users can delete own author photos" ON storage.objects;

-- Create storage policies
CREATE POLICY "Storage: public can read covers/authors/partners/author-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('covers', 'authors', 'partners', 'author-photos'));

CREATE POLICY "Storage: users can upload own author photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'author-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY "Storage: users can delete own author photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'author-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('photo_path', 'email', 'birth_date', 'residence_city', 'province', 'published_works', 'author_gallery', 'featured_video', 'author_type');
