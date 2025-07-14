-- COMPLETE RLS FIX - Disable all RLS policies for PDF attachments
-- This will allow the PDF upload feature to work without permission issues
-- Run this in your Supabase SQL editor

-- 1. Disable RLS on chat_attachments table
ALTER TABLE chat_attachments DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on chat_attachments table
DROP POLICY IF EXISTS "Students can view their own attachments" ON chat_attachments;
DROP POLICY IF EXISTS "Students can insert attachments for their chats" ON chat_attachments;
DROP POLICY IF EXISTS "Instructors can view course attachments" ON chat_attachments;
DROP POLICY IF EXISTS "Users can view chat attachments they have access to" ON chat_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their chats" ON chat_attachments;
DROP POLICY IF EXISTS "Users can update their own attachments" ON chat_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON chat_attachments;

-- 3. Drop all existing storage policies for chat-attachments bucket
DROP POLICY IF EXISTS "Students can upload PDFs for their chats" ON storage.objects;
DROP POLICY IF EXISTS "Students can view their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can view course PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view PDFs" ON storage.objects;

-- 4. Create simple, permissive storage policies
CREATE POLICY "Allow authenticated users to upload to chat-attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to view chat-attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to delete from chat-attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-attachments' 
    AND auth.role() = 'authenticated'
  );

-- 5. Verify the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;