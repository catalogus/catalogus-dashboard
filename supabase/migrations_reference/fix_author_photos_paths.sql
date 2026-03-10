-- Fix author-photos storage policies to support correct path format
-- Path format should be: userid/timestamp-filename.jpg (without bucket name prefix)

-- Drop existing policies
DROP POLICY IF EXISTS "Storage: users can upload own author photos" ON storage.objects;
DROP POLICY IF EXISTS "Storage: users can delete own author photos" ON storage.objects;

-- Recreate with corrected logic that supports both old and new path formats temporarily
-- New format: userid/file.jpg -> foldername[1] = userid
-- Old buggy format: author-photos/userid/file.jpg -> foldername[2] = userid
CREATE POLICY "Storage: users can upload own author photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'author-photos'
    AND (
      -- New correct format: userid/file.jpg
      (storage.foldername(name))[1] = auth.uid()::text
      -- Also support old format temporarily: author-photos/userid/file.jpg
      OR (storage.foldername(name))[2] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY "Storage: users can delete own author photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'author-photos'
    AND (
      -- New correct format: userid/file.jpg
      (storage.foldername(name))[1] = auth.uid()::text
      -- Also support old format temporarily: author-photos/userid/file.jpg
      OR (storage.foldername(name))[2] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Note: Existing photos with old path format (author-photos/userid/file.jpg)
-- will still work but new uploads will use the correct format (userid/file.jpg)
