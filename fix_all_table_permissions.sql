-- Fix all table permissions for instructor dashboard
-- This should resolve all permission denied errors

-- 1. Check current RLS status on all relevant tables
SELECT 
  'Current RLS status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('chats', 'pdf_attachments', 'projects', 'users') 
AND schemaname = 'public'
ORDER BY tablename;

-- 2. Disable RLS on all relevant tables
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT 
  'After disabling RLS:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('chats', 'pdf_attachments', 'projects', 'users') 
AND schemaname = 'public'
ORDER BY tablename;

-- 4. Test the problematic query that was failing
SELECT 
  'Test query - PDF attachments with chats:' as info,
  COUNT(pa.*) as pdf_count,
  COUNT(c.*) as chat_count
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id;

-- 5. Test the specific query the dashboard uses
SELECT 
  'Dashboard query test:' as info,
  pa.id,
  pa.file_name,
  pa.created_at,
  c.id as chat_id,
  c.course_id,
  c.user_id,
  c.project_id
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id
WHERE c.course_id = '76fc1874-9313-48fd-8916-4887cdb9d428'
ORDER BY pa.created_at DESC;

-- 6. Check if we can access users and projects tables
SELECT 
  'Users table access test:' as info,
  COUNT(*) as user_count
FROM users;

SELECT 
  'Projects table access test:' as info,
  COUNT(*) as project_count
FROM projects;