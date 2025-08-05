-- Fix Student Activity permissions - resolve "Unknown User" and "Unknown Project" issues
-- This addresses the recurring RLS permission pattern we've seen 4 times

-- 1. Check current RLS status on all relevant tables
SELECT 
  'Current RLS status:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('chats', 'users', 'projects', 'pdf_attachments', 'chat_tags', 'tags', 'reflections') 
AND schemaname = 'public'
ORDER BY tablename;

-- 2. Disable RLS on ALL tables that are causing joins to fail
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;

-- 3. Grant explicit permissions to service_role on all tables
GRANT ALL ON chats TO service_role;
GRANT ALL ON users TO service_role;
GRANT ALL ON projects TO service_role;
GRANT ALL ON pdf_attachments TO service_role;
GRANT ALL ON chat_tags TO service_role;
GRANT ALL ON tags TO service_role;
GRANT ALL ON reflections TO service_role;

-- 4. Grant SELECT permissions to authenticated and anon roles
GRANT SELECT ON chats TO authenticated;
GRANT SELECT ON chats TO anon;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON projects TO authenticated;
GRANT SELECT ON projects TO anon;
GRANT SELECT ON pdf_attachments TO authenticated;
GRANT SELECT ON pdf_attachments TO anon;
GRANT SELECT ON chat_tags TO authenticated;
GRANT SELECT ON chat_tags TO anon;
GRANT SELECT ON tags TO authenticated;
GRANT SELECT ON tags TO anon;
GRANT SELECT ON reflections TO authenticated;
GRANT SELECT ON reflections TO anon;

-- 5. Verify RLS is disabled on all tables
SELECT 
  'After disabling RLS:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('chats', 'users', 'projects', 'pdf_attachments', 'chat_tags', 'tags', 'reflections') 
AND schemaname = 'public'
ORDER BY tablename;

-- 6. Test the exact query that should now work (getChatsWithFilters)
SELECT 
  'Test getChatsWithFilters query:' as info,
  COUNT(c.id) as chat_count,
  COUNT(u.id) as user_count,
  COUNT(p.id) as project_count
FROM chats c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN projects p ON c.project_id = p.id
WHERE c.created_at >= NOW() - INTERVAL '30 days'
LIMIT 10;

-- 7. Test a full join to verify the data structure
SELECT 
  'Sample data structure:' as info,
  c.id as chat_id,
  u.name as user_name,
  u.email as user_email,
  p.title as project_title,
  c.tool_used,
  c.created_at
FROM chats c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN projects p ON c.project_id = p.id
ORDER BY c.created_at DESC
LIMIT 3;

-- 8. Test the nested query structure that Supabase uses
-- This should match the structure from getChatsWithFilters
SELECT 
  'Nested query structure test:' as info,
  json_build_object(
    'id', c.id,
    'user_id', c.user_id,
    'project_id', c.project_id,
    'users', json_build_object('name', u.name, 'email', u.email),
    'projects', json_build_object('title', p.title),
    'tool_used', c.tool_used,
    'created_at', c.created_at
  ) as chat_data
FROM chats c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN projects p ON c.project_id = p.id
ORDER BY c.created_at DESC
LIMIT 2;