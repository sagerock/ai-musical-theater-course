-- Fix infinite recursion in RLS policies by dropping all policies first
-- Then disable RLS completely for development

-- Drop ALL existing policies on course_memberships (this breaks the recursion)
DROP POLICY IF EXISTS "Users can view their own memberships" ON course_memberships;
DROP POLICY IF EXISTS "Instructors can view memberships in their courses" ON course_memberships;  
DROP POLICY IF EXISTS "Admins can view all memberships" ON course_memberships;
DROP POLICY IF EXISTS "Users can join courses" ON course_memberships;
DROP POLICY IF EXISTS "course_members_can_read" ON course_memberships;
DROP POLICY IF EXISTS "course_members_can_join" ON course_memberships;
DROP POLICY IF EXISTS "course_members_policy" ON course_memberships;

-- Now disable RLS entirely
ALTER TABLE course_memberships DISABLE ROW LEVEL SECURITY;
GRANT ALL ON course_memberships TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON course_memberships TO authenticated;
GRANT SELECT ON course_memberships TO anon;

-- Drop and disable RLS on projects table
DROP POLICY IF EXISTS "projects_policy" ON projects;
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Project members can view projects" ON projects;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
GRANT ALL ON projects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT ON projects TO anon;

-- Drop and disable RLS on chats table  
DROP POLICY IF EXISTS "chats_policy" ON chats;
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
GRANT ALL ON chats TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON chats TO authenticated;
GRANT SELECT ON chats TO anon;

-- Clean up related tables too
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;

-- Verify no RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;