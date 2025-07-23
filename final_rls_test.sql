-- Final comprehensive RLS test

-- Test that anonymous access is blocked on all tables
SET ROLE anon;
SELECT 
  'projects' as table_name, 
  COUNT(*) as anon_access_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ BLOCKED' ELSE '❌ ACCESSIBLE' END as rls_status
FROM projects
UNION ALL
SELECT 'chats', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ BLOCKED' ELSE '❌ ACCESSIBLE' END FROM chats
UNION ALL  
SELECT 'users', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ BLOCKED' ELSE '❌ ACCESSIBLE' END FROM users
UNION ALL
SELECT 'course_memberships', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ BLOCKED' ELSE '❌ ACCESSIBLE' END FROM course_memberships
UNION ALL
SELECT 'pdf_attachments', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ BLOCKED' ELSE '❌ ACCESSIBLE' END FROM pdf_attachments
UNION ALL
SELECT 'instructor_notes', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ BLOCKED' ELSE '❌ ACCESSIBLE' END FROM instructor_notes
UNION ALL
SELECT 'reflections', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ BLOCKED' ELSE '❌ ACCESSIBLE' END FROM reflections
ORDER BY table_name;
RESET ROLE;

-- Test that service role can still access everything
SET ROLE service_role;
SELECT 
  'SERVICE ROLE ACCESS - ' || table_name as test_name,
  record_count,
  CASE WHEN record_count > 0 THEN '✅ WORKING' ELSE '⚠️ EMPTY' END as status
FROM (
  SELECT 'projects' as table_name, COUNT(*) as record_count FROM projects
  UNION ALL
  SELECT 'chats', COUNT(*) FROM chats
  UNION ALL  
  SELECT 'users', COUNT(*) FROM users
  UNION ALL
  SELECT 'course_memberships', COUNT(*) FROM course_memberships
  UNION ALL
  SELECT 'pdf_attachments', COUNT(*) FROM pdf_attachments
  UNION ALL
  SELECT 'instructor_notes', COUNT(*) FROM instructor_notes
  UNION ALL
  SELECT 'reflections', COUNT(*) FROM reflections
) subq
ORDER BY table_name;
RESET ROLE;