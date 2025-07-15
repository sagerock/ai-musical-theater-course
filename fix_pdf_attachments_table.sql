-- Fix PDF attachments table and create proper foreign key relationship
-- Run this in your Supabase SQL editor

-- 1. Create the pdf_attachments table with proper foreign key
CREATE TABLE IF NOT EXISTS pdf_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdf_attachments_chat_id ON pdf_attachments(chat_id);
CREATE INDEX IF NOT EXISTS idx_pdf_attachments_created_at ON pdf_attachments(created_at);

-- 3. Disable RLS for development
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;

-- 4. Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'pdf-uploads', 
  'pdf-uploads', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Create permissive storage policies
DROP POLICY IF EXISTS "Allow authenticated users to upload to pdf-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view pdf-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete from pdf-uploads" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload to pdf-uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pdf-uploads' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to view pdf-uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdf-uploads' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to delete from pdf-uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pdf-uploads' 
    AND auth.role() = 'authenticated'
  );

-- 6. Test the table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'pdf_attachments'
ORDER BY ordinal_position;

-- 7. Test foreign key relationship
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'pdf_attachments';