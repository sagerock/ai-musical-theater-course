-- Fix for chat_attachments permissions issue
-- Run this in your Supabase SQL editor

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Students can view their own attachments" ON chat_attachments;
DROP POLICY IF EXISTS "Students can insert attachments for their chats" ON chat_attachments;
DROP POLICY IF EXISTS "Instructors can view course attachments" ON chat_attachments;

-- Create simplified policies that should work
-- Allow users to view attachments for chats they can access
CREATE POLICY "Users can view chat attachments they have access to"
  ON chat_attachments FOR SELECT 
  USING (
    -- Users can see attachments for their own chats
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()::text
    )
    OR
    -- Instructors can see attachments for chats in their courses
    chat_id IN (
      SELECT c.id FROM chats c
      JOIN projects p ON c.project_id = p.id 
      WHERE p.course_id IN (
        SELECT course_id FROM course_memberships 
        WHERE user_id = auth.uid()::text 
        AND role = 'instructor'
        AND status = 'approved'
      )
    )
  );

-- Allow users to insert attachments for their own chats
CREATE POLICY "Users can insert attachments for their chats"
  ON chat_attachments FOR INSERT 
  WITH CHECK (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()::text
    )
  );

-- Allow users to update/delete their own attachments
CREATE POLICY "Users can update their own attachments"
  ON chat_attachments FOR UPDATE 
  USING (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own attachments"
  ON chat_attachments FOR DELETE 
  USING (
    chat_id IN (
      SELECT id FROM chats 
      WHERE user_id = auth.uid()::text
    )
  );