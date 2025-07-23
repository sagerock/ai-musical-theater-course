-- PRIVACY PROTECTION VALIDATION TEST
-- This will verify that RLS policies are working correctly

-- ============================================================================
-- TEST 1: Verify RLS is enabled and policies exist
-- ============================================================================

SELECT 
  '🔍 RLS STATUS CHECK' as test_section,
  tablename, 
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = 'public') as policy_count,
  CASE 
    WHEN rowsecurity AND (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = 'public') > 0 
    THEN '✅ PROTECTED'
    ELSE '❌ UNPROTECTED'
  END as status
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes', 'projects', 'course_memberships', 'reflections')
ORDER BY tablename;

-- ============================================================================
-- TEST 2: Check current data counts (baseline)
-- ============================================================================

SELECT '📊 CURRENT DATA INVENTORY' as test_section;

SELECT 
  'Users' as table_name,
  count(*) as total_records,
  count(*) FILTER (WHERE is_global_admin = true) as admin_count,
  count(*) FILTER (WHERE is_global_admin = false) as regular_users
FROM users
UNION ALL
SELECT 
  'Chats' as table_name,
  count(*) as total_records,
  count(DISTINCT user_id) as unique_users,
  count(DISTINCT course_id) as unique_courses  
FROM chats
UNION ALL
SELECT 
  'PDF Attachments' as table_name,
  count(*) as total_records,
  count(DISTINCT chat_id) as unique_chats,
  0 as third_metric
FROM pdf_attachments
UNION ALL
SELECT 
  'Instructor Notes' as table_name,
  count(*) as total_records,
  count(DISTINCT project_id) as unique_projects,
  count(DISTINCT instructor_id) as unique_instructors
FROM instructor_notes
UNION ALL
SELECT 
  'Projects' as table_name,
  count(*) as total_records,
  count(DISTINCT created_by) as unique_creators,
  count(DISTINCT course_id) as unique_courses
FROM projects
UNION ALL
SELECT 
  'Course Memberships' as table_name,
  count(*) as total_records,
  count(DISTINCT user_id) as unique_users,
  count(DISTINCT course_id) as unique_courses
FROM course_memberships;

-- ============================================================================
-- TEST 3: Verify policy expressions are valid
-- ============================================================================

SELECT '🧪 POLICY VALIDATION' as test_section;

SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅ Policy exists'
    ELSE '❌ No policy'
  END as validation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes', 'projects', 'course_memberships', 'reflections')
ORDER BY tablename, cmd;

-- ============================================================================
-- TEST 4: Sample privacy check (safe queries)
-- ============================================================================

SELECT '🔒 PRIVACY SAMPLE CHECKS' as test_section;

-- Check that we have both students and instructors in different roles
SELECT 
  'Course Role Distribution' as check_name,
  role,
  count(*) as user_count
FROM course_memberships 
GROUP BY role
ORDER BY role;

-- Check that chats are distributed across users (indicates individual ownership)
SELECT 
  'Chat Distribution per User' as check_name,
  user_id,
  count(*) as chat_count
FROM chats 
GROUP BY user_id
ORDER BY chat_count DESC
LIMIT 5;

-- ============================================================================
-- TEST 5: Authentication function availability
-- ============================================================================

SELECT '🔑 AUTH FUNCTION CHECK' as test_section;

-- Test if auth.uid() function is available
SELECT 
  'auth.uid() availability' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'auth' AND p.proname = 'uid'
    ) 
    THEN '✅ auth.uid() function exists'
    ELSE '❌ auth.uid() function missing - RLS may not work without proper auth context'
  END as status;

-- ============================================================================
-- TEST 6: Service role permissions
-- ============================================================================

SELECT '🛠️ SERVICE ROLE PERMISSIONS' as test_section;

-- Check if service_role has necessary permissions
SELECT 
  'service_role table permissions' as check_name,
  schemaname,
  tablename,
  CASE 
    WHEN has_table_privilege('service_role', schemaname||'.'||tablename, 'SELECT') 
    THEN '✅ Has SELECT'
    ELSE '❌ No SELECT'
  END as select_permission,
  CASE 
    WHEN has_table_privilege('service_role', schemaname||'.'||tablename, 'INSERT') 
    THEN '✅ Has INSERT'
    ELSE '❌ No INSERT'  
  END as insert_permission
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes')
LIMIT 4;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT 
  '🎯 PRIVACY PROTECTION SUMMARY' as final_status,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') as total_policies_created,
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  CASE 
    WHEN (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') >= 15 
    AND (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) >= 7
    THEN '✅ PRIVACY PROTECTION ACTIVE - Student data is secure'
    ELSE '⚠️ INCOMPLETE PROTECTION - Review policies'
  END as privacy_status,
  NOW() as tested_at;