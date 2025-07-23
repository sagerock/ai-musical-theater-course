-- Create storage policies for pdf-uploads bucket
-- Run this after creating the pdf-uploads bucket in Supabase dashboard

-- Allow authenticated users to upload to pdf-uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-uploads', 'pdf-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload to pdf-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view pdf-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete from pdf-uploads" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow authenticated users to upload to pdf-uploads"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pdf-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow authenticated users to view pdf-uploads"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pdf-uploads' 
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR role = 'instructor')
      )
    )
  );

CREATE POLICY "Allow authenticated users to delete from pdf-uploads"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pdf-uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );