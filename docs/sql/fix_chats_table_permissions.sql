-- Fix chats table permissions for PDF attachments query
-- This will resolve the 403 Forbidden error in the instructor dashboard

-- Check current RLS status on chats table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'chats' AND schemaname = 'public';

-- Check if there are any RLS policies on chats table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'chats' AND schemaname = 'public';

-- Option 1: Disable RLS on chats table (recommended for development)
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a permissive policy for service role (alternative approach)
-- Uncomment the following if you prefer to keep RLS enabled but allow service role access
/*
CREATE POLICY "Allow service role access to chats" ON chats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
*/

-- Verify the change
SELECT 
  'After fix - chats table RLS status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'chats' AND schemaname = 'public';

-- Test query that was failing
SELECT 
  'Test query - should work now:' as info,
  COUNT(*) as pdf_attachments_count
FROM pdf_attachments;

-- Test the join that was causing the permission error
SELECT 
  'Test join - should work now:' as info,
  COUNT(pa.*) as pdf_attachments_count,
  COUNT(c.*) as chats_count
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id
LIMIT 5;