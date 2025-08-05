-- Fix storage bucket policies for pdf-uploads
-- This removes restrictive policies that are blocking uploads

-- First, check what policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%pdf-uploads%';

-- Drop all existing policies for pdf-uploads bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload to pdf-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view pdf-uploads" ON storage.objects; 
DROP POLICY IF EXISTS "Allow authenticated users to delete from pdf-uploads" ON storage.objects;

-- Create simple, permissive policies for development
CREATE POLICY "pdf-uploads upload access"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pdf-uploads');

CREATE POLICY "pdf-uploads select access"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'pdf-uploads');

CREATE POLICY "pdf-uploads update access"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pdf-uploads');

CREATE POLICY "pdf-uploads delete access"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'pdf-uploads');