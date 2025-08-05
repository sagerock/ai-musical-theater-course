-- Enable RLS on remaining tables that have policies but RLS disabled

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on course_memberships table  
ALTER TABLE course_memberships ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reflections table
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Verify all tables now have RLS enabled
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('projects', 'chats', 'users', 'course_memberships', 'pdf_attachments', 'instructor_notes', 'reflections')
ORDER BY tablename;