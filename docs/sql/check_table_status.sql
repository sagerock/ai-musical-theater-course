-- Check the current status of the pdf_attachments table
-- Run this in your Supabase SQL editor

-- 1. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '❌ RLS ENABLED (This is the problem!)'
    ELSE '✅ RLS DISABLED'
  END as status
FROM pg_tables 
WHERE tablename = 'pdf_attachments';

-- 2. Check what policies exist on the table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'pdf_attachments';

-- 3. Show the table structure
\d pdf_attachments;

-- 4. Check if the table exists at all
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'pdf_attachments'
) as table_exists;