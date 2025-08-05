-- Get precise RLS status for all tables in public schema
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('projects', 'chats', 'users', 'course_memberships', 'pdf_attachments', 'instructor_notes', 'reflections')
ORDER BY tablename;

-- Count records in each table to verify functionality
SELECT 
  'projects' as table_name, COUNT(*) as record_count FROM projects
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
ORDER BY table_name;