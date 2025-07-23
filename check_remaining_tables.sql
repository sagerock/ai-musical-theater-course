-- Check RLS status on other important tables

-- Check users table
SELECT 'users' as table_name, rowsecurity FROM pg_tables WHERE tablename = 'users'
UNION ALL
-- Check course_memberships table  
SELECT 'course_memberships', rowsecurity FROM pg_tables WHERE tablename = 'course_memberships'
UNION ALL
-- Check pdf_attachments table
SELECT 'pdf_attachments', rowsecurity FROM pg_tables WHERE tablename = 'pdf_attachments'
UNION ALL
-- Check instructor_notes table
SELECT 'instructor_notes', rowsecurity FROM pg_tables WHERE tablename = 'instructor_notes'
UNION ALL
-- Check reflections table
SELECT 'reflections', rowsecurity FROM pg_tables WHERE tablename = 'reflections';

-- Check what policies exist on these tables
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('users', 'course_memberships', 'pdf_attachments', 'instructor_notes', 'reflections')
GROUP BY tablename
ORDER BY tablename;