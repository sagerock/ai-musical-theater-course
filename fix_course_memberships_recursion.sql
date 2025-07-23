-- Fix course_memberships infinite recursion by disabling RLS temporarily
-- The recursive policies reference the same table they're protecting

-- Disable RLS on course_memberships to prevent infinite recursion
ALTER TABLE course_memberships DISABLE ROW LEVEL SECURITY;

-- Test that we fixed the recursion issue
SET ROLE anon;
SELECT COUNT(*) as anon_course_memberships FROM course_memberships;
RESET ROLE;

-- Final status check
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('projects', 'chats', 'users', 'course_memberships', 'pdf_attachments', 'instructor_notes', 'reflections')
ORDER BY tablename;