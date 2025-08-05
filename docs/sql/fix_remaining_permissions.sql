-- Fix remaining permission issues for users and projects tables
-- This should resolve the "Unknown Student" and "Unknown Project" issues

-- 1. Check current RLS status on users and projects tables
SELECT 
  'Current RLS status for users/projects:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'projects') 
AND schemaname = 'public'
ORDER BY tablename;

-- 2. Disable RLS on users and projects tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- 3. Grant explicit permissions to service_role
GRANT ALL ON users TO service_role;
GRANT ALL ON projects TO service_role;

-- 4. Grant permissions to authenticated and anon as well
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON projects TO authenticated;
GRANT SELECT ON projects TO anon;

-- 5. Verify RLS is disabled
SELECT 
  'After disabling RLS:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'projects') 
AND schemaname = 'public'
ORDER BY tablename;

-- 6. Test the queries that were failing
-- Test users query
SELECT 
  'Users query test:' as info,
  COUNT(*) as user_count
FROM users
WHERE id IN ('cgMjgpefXKfo70xaA1LD84LO9dI2', 'TJzSQdlPbGQbaLNCZemTFc4DMHp2');

-- Test projects query
SELECT 
  'Projects query test:' as info,
  COUNT(*) as project_count
FROM projects
WHERE id IN ('3edc7a73-60b1-483a-b716-c35ac408eba2', '6b747b08-674e-4495-991d-4abdf2820ceb');

-- 7. Test the complete join that should now work
SELECT 
  'Complete join test:' as info,
  pa.file_name,
  u.name as user_name,
  u.email as user_email,
  p.title as project_title
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN projects p ON c.project_id = p.id
ORDER BY pa.created_at DESC
LIMIT 2;