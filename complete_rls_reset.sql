-- Complete RLS Reset Script
-- Disable RLS on ALL tables to start completely fresh

-- Disable RLS on all main tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;  
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_notes DISABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies that might cause recursion
DROP POLICY IF EXISTS "users_own_projects" ON projects;
DROP POLICY IF EXISTS "users_read_own_projects" ON projects;
DROP POLICY IF EXISTS "members_access_projects" ON projects;
DROP POLICY IF EXISTS "instructors_access_course_projects" ON projects;
DROP POLICY IF EXISTS "admins_access_all_projects" ON projects;
DROP POLICY IF EXISTS "users_own_chats" ON chats;
DROP POLICY IF EXISTS "instructors_access_course_chats" ON chats;
DROP POLICY IF EXISTS "users_read_own_profile" ON users;
DROP POLICY IF EXISTS "course_members_can_read" ON course_memberships;
DROP POLICY IF EXISTS "instructors_can_see_course_members" ON course_memberships;

-- Grant full permissions to all roles to ensure app functionality
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;

-- Verify no RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
EOF < /dev/null