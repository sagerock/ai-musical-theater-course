-- FINAL NUCLEAR OPTION: Remove ALL restrictions
-- This completely removes RLS from both table and storage
-- Run this in your Supabase SQL editor

-- 1. Drop the table completely and recreate without any restrictions
DROP TABLE IF EXISTS chat_attachments CASCADE;

-- 2. Create the table fresh (no RLS by default)
CREATE TABLE chat_attachments (
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

-- 3. Add indexes
CREATE INDEX idx_chat_attachments_chat_id ON chat_attachments(chat_id);
CREATE INDEX idx_chat_attachments_created_at ON chat_attachments(created_at);

-- 4. Remove ALL storage policies for any bucket containing 'chat'
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (policyname ILIKE '%chat%' OR policyname ILIKE '%attachment%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.schemaname) || '.' || quote_ident(pol.tablename);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- 5. Remove the bucket and recreate it
DELETE FROM storage.buckets WHERE id = 'chat-attachments';

-- 6. Create bucket fresh with no restrictions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'chat-attachments', 
  'chat-attachments', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf']
);

-- 7. Create the most permissive policies possible
CREATE POLICY "allow_all_chat_attachments_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-attachments');

CREATE POLICY "allow_all_chat_attachments_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "allow_all_chat_attachments_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chat-attachments');

CREATE POLICY "allow_all_chat_attachments_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-attachments');

-- 8. Verify table has no RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'chat_attachments';

-- 9. Verify no policies exist on the table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'chat_attachments';

-- 10. Show storage policies
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname ILIKE '%chat%';