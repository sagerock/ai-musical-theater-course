-- Simple script to disable RLS on pdf_attachments table
-- Run this in your Supabase SQL editor

-- 1. Disable RLS on the existing table
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies on the table (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Students can view their own attachments" ON pdf_attachments;
DROP POLICY IF EXISTS "Students can insert attachments for their chats" ON pdf_attachments;
DROP POLICY IF EXISTS "Instructors can view course attachments" ON pdf_attachments;
DROP POLICY IF EXISTS "Users can view chat attachments they have access to" ON pdf_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their chats" ON pdf_attachments;
DROP POLICY IF EXISTS "Users can update their own attachments" ON pdf_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON pdf_attachments;

-- 3. Verify RLS is now disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'pdf_attachments';

-- Expected result: rowsecurity should be 'f' (false)