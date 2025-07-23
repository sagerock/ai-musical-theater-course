-- Diagnose user synchronization issue with proper type casting

-- Check current authenticated user
SELECT 
  'Current auth context' as info,
  auth.uid()::text as current_user_id,
  CASE WHEN auth.uid() IS NOT NULL THEN 'authenticated' ELSE 'not authenticated' END as status;

-- Check if current user exists in public.users table
SELECT 
  'Current user in public.users' as check_result,
  CASE WHEN EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text) 
       THEN '✅ EXISTS' 
       ELSE '❌ MISSING' 
  END as user_exists;

-- Check recent projects and their created_by values
SELECT 
  'Recent projects' as info,
  id,
  title,
  created_by,
  CASE WHEN EXISTS (SELECT 1 FROM users WHERE id = projects.created_by) 
       THEN '✅ Valid user' 
       ELSE '❌ Invalid user' 
  END as user_validity,
  created_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;

-- Show sample user data
SELECT 'Sample users' as info, id, name, email FROM users LIMIT 3;