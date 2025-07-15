-- Grant explicit permissions to service role for all tables
-- This should fix the permission denied errors

-- 1. Check what role we're using
SELECT 
  'Current database role:' as info,
  current_user as current_role,
  session_user as session_role;

-- 2. Check existing permissions for service_role
SELECT 
  'Service role permissions:' as info,
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE grantee = 'service_role' 
AND table_name IN ('chats', 'pdf_attachments', 'projects', 'users')
ORDER BY table_name, privilege_type;

-- 3. Grant explicit permissions to service_role
GRANT ALL ON chats TO service_role;
GRANT ALL ON pdf_attachments TO service_role;
GRANT ALL ON projects TO service_role;
GRANT ALL ON users TO service_role;

-- 4. Also grant permissions to authenticated role (fallback)
GRANT ALL ON chats TO authenticated;
GRANT ALL ON pdf_attachments TO authenticated;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON users TO authenticated;

-- 5. Grant permissions to anon role as well
GRANT SELECT ON chats TO anon;
GRANT SELECT ON pdf_attachments TO anon;
GRANT SELECT ON projects TO anon;
GRANT SELECT ON users TO anon;

-- 6. Verify permissions were granted
SELECT 
  'After granting permissions:' as info,
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE grantee IN ('service_role', 'authenticated', 'anon')
AND table_name IN ('chats', 'pdf_attachments', 'projects', 'users')
ORDER BY table_name, grantee, privilege_type;

-- 7. Test the query again
SELECT 
  'Permission test:' as info,
  COUNT(pa.*) as pdf_count,
  COUNT(c.*) as chat_count
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id;