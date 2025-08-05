-- FINAL Database schema for PDF upload feature
-- This version has proper type casting for all UUID comparisons
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
CREATE POLICY "Students can view their own attachments" 
  ON chat_attachments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_attachments.chat_id 
      AND chats.user_id::text = auth.uid()::text
    )
  );

-- Students can only insert attachments for their own chats
CREATE POLICY "Students can insert attachments for their chats" 
  ON chat_attachments FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_attachments.chat_id 
      AND chats.user_id::text = auth.uid()::text
    )
  );

-- Instructors can view all attachments for their courses
CREATE POLICY "Instructors can view course attachments" 
  ON chat_attachments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      JOIN projects ON chats.project_id = projects.id 
      JOIN course_memberships ON projects.course_id = course_memberships.course_id 
      WHERE chats.id = chat_attachments.chat_id 
      AND course_memberships.user_id::text = auth.uid()::text 
      AND course_memberships.role = 'instructor'
      AND course_memberships.status = 'approved'
    )
  );

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for PDF files - with proper type casting
CREATE POLICY "Students can upload PDFs for their chats"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments' 
    AND name ~ ('^' || auth.uid()::text || '/')
  );

CREATE POLICY "Students can view their own PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments' 
    AND name ~ ('^' || auth.uid()::text || '/')
  );

CREATE POLICY "Instructors can view course PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments' 
    AND EXISTS (
      SELECT 1 FROM chat_attachments ca
      JOIN chats c ON ca.chat_id = c.id
      JOIN projects p ON c.project_id = p.id
      JOIN course_memberships cm ON p.course_id = cm.course_id
      WHERE ca.storage_path = name
      AND cm.user_id::text = auth.uid()::text
      AND cm.role = 'instructor'
      AND cm.status = 'approved'
    )
  );