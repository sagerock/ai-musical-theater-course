-- Check current RLS status and policies on projects table

-- 1. Check if RLS is enabled on projects table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'projects';

-- 2. List all policies on projects table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- 3. Test a simple query to see current behavior
-- This will show if RLS is actually working
SELECT COUNT(*) as total_projects FROM projects;

-- 4. Check permissions granted to different roles
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'projects' 
AND table_schema = 'public';