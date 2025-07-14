-- Create a new attachments table with a different name to avoid RLS issues
-- Run this in your Supabase SQL editor

-- 1. Create the new table (RLS is disabled by default)
CREATE TABLE pdf_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX idx_pdf_attachments_chat_id ON pdf_attachments(chat_id);
CREATE INDEX idx_pdf_attachments_created_at ON pdf_attachments(created_at);

-- 3. Explicitly disable RLS (should be off by default, but just to be sure)
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;

-- 4. Create a new storage bucket with a different name
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'pdf-uploads', 
  'pdf-uploads', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf']
);

-- 5. Create simple storage policies for the new bucket
CREATE POLICY "allow_all_pdf_uploads_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdf-uploads');

CREATE POLICY "allow_all_pdf_uploads_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdf-uploads');

CREATE POLICY "allow_all_pdf_uploads_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'pdf-uploads');

CREATE POLICY "allow_all_pdf_uploads_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdf-uploads');

-- 6. Verify the table has no RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'pdf_attachments';

-- 7. Show that no policies exist on the table
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'pdf_attachments';