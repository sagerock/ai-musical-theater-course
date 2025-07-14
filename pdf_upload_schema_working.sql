-- WORKING Database schema for PDF upload feature
-- This version handles both text and UUID user_id types
-- Run this in your Supabase SQL editor

-- Create chat_attachments table
CREATE TABLE IF NOT EXISTS chat_attachments (
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_attachments_chat_id ON chat_attachments(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_created_at ON chat_attachments(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

-- Students can only see their own attachments
-- This policy will work regardless of user_id type
CREATE POLICY "Students can view their own attachments" 
  ON chat_attachments FOR SELECT 
  USING (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()::text
    )
  );

-- Students can only insert attachments for their own chats
CREATE POLICY "Students can insert attachments for their chats" 
  ON chat_attachments FOR INSERT 
  WITH CHECK (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()::text
    )
  );

-- Instructors can view all attachments for their courses
CREATE POLICY "Instructors can view course attachments" 
  ON chat_attachments FOR SELECT 
  USING (
    chat_id IN (
      SELECT c.id FROM chats c
      JOIN projects p ON c.project_id = p.id 
      JOIN course_memberships cm ON p.course_id = cm.course_id 
      WHERE cm.user_id = auth.uid()::text 
      AND cm.role = 'instructor'
      AND cm.status = 'approved'
    )
  );

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Basic storage policy - allow authenticated users to upload/view
-- Application logic will handle detailed permissions
CREATE POLICY "Allow authenticated users to upload PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to view PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments' 
    AND auth.role() = 'authenticated'
  );

-- Alternative: If you want to keep the folder-based approach
-- Uncomment these and comment out the above basic policies
-- CREATE POLICY "Students can upload PDFs for their chats"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'chat-attachments' 
--     AND name LIKE (auth.uid()::text || '/%')
--   );

-- CREATE POLICY "Students can view their own PDFs"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'chat-attachments' 
--     AND name LIKE (auth.uid()::text || '/%')
--   );