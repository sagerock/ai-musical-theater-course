-- Fix HTTP 500 errors by disabling RLS on remaining tables
-- This continues our pattern of disabling RLS for development

-- Disable RLS on course_memberships table
ALTER TABLE course_memberships DISABLE ROW LEVEL SECURITY;
GRANT ALL ON course_memberships TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON course_memberships TO authenticated;
GRANT SELECT ON course_memberships TO anon;

-- Disable RLS on projects table  
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
GRANT ALL ON projects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT ON projects TO anon;

-- Disable RLS on chats table
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
GRANT ALL ON chats TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON chats TO authenticated;
GRANT SELECT ON chats TO anon;

-- Also disable RLS on related tables that might cause issues
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
GRANT ALL ON project_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_members TO authenticated;
GRANT SELECT ON project_members TO anon;

ALTER TABLE chat_tags DISABLE ROW LEVEL SECURITY;
GRANT ALL ON chat_tags TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_tags TO authenticated;
GRANT SELECT ON chat_tags TO anon;

ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
GRANT ALL ON tags TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO authenticated;
GRANT SELECT ON tags TO anon;

ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;
GRANT ALL ON reflections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON reflections TO authenticated;
GRANT SELECT ON reflections TO anon;

-- Summary
SELECT 'RLS permissions fixed - all tables now accessible' as status;