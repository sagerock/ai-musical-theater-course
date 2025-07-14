-- FORCE DISABLE RLS - Direct approach to completely remove all restrictions
-- Run this in your Supabase SQL editor

-- 1. First, drop the table if it exists and recreate without RLS
DROP TABLE IF EXISTS chat_attachments CASCADE;

-- 2. Recreate the table without RLS enabled
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

-- 3. Add indexes for performance
CREATE INDEX idx_chat_attachments_chat_id ON chat_attachments(chat_id);
CREATE INDEX idx_chat_attachments_created_at ON chat_attachments(created_at);

-- 4. Explicitly disable RLS (should be off by default, but just to be sure)
ALTER TABLE chat_attachments DISABLE ROW LEVEL SECURITY;

-- 5. Remove ALL storage policies for the chat-attachments bucket
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname LIKE '%chat-attachments%' OR policyname LIKE '%chat_attachments%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.schemaname) || '.' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- 6. Create completely open storage policies for chat-attachments
CREATE POLICY "chat_attachments_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "chat_attachments_select_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "chat_attachments_delete_policy"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-attachments');

-- 7. Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;