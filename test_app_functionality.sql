-- Test that service role can still access data for dashboard functionality

-- Test service role access to projects (should work)
SET ROLE service_role;
SELECT COUNT(*) as service_projects FROM projects;
RESET ROLE;

-- Test service role access to chats (should work) 
SET ROLE service_role;
SELECT COUNT(*) as service_chats FROM chats;
RESET ROLE;

-- Test that authenticated users can access their own data
-- (This would normally be done through the application, but we can verify the policy structure)

-- Show the actual policies to understand what we've implemented
SELECT tablename, policyname, cmd, qual as "USING condition" 
FROM pg_policies 
WHERE tablename IN ('projects', 'chats')
ORDER BY tablename, policyname;