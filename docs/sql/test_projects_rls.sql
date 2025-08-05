-- Test RLS implementation on projects table
-- This should be run as different users to verify RLS is working

-- Test 1: Check if anonymous access is blocked (this should fail with RLS)
SET ROLE anon;
SELECT COUNT(*) as anon_accessible_projects FROM projects;
RESET ROLE;

-- Test 2: Check total count with service_role (should see all)
SET ROLE service_role;
SELECT COUNT(*) as service_role_accessible_projects FROM projects;
RESET ROLE;

-- Test 3: Sample data to understand structure
SELECT created_by, COUNT(*) as project_count 
FROM projects 
GROUP BY created_by 
ORDER BY project_count DESC 
LIMIT 5;