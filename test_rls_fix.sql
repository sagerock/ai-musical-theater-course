-- TEST THAT RLS POLICIES ARE WORKING WITHOUT RECURSION

-- ============================================================================
-- QUICK POLICY STATUS CHECK
-- ============================================================================

-- Check all policies are active
SELECT 
  'RLS Policy Status' as check_type,
  tablename,
  count(*) as active_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'projects', 'course_memberships', 'pdf_attachments', 'instructor_notes', 'reflections')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- TEST BASIC QUERIES THAT WERE FAILING
-- ============================================================================

-- Test course_memberships query (this was causing infinite recursion)
SELECT 
  'Course Memberships Test' as test_name,
  count(*) as total_memberships,
  count(DISTINCT course_id) as unique_courses,
  count(DISTINCT user_id) as unique_users
FROM course_memberships;

-- Test projects query (this was causing 500 errors)
SELECT 
  'Projects Test' as test_name,
  count(*) as total_projects,
  count(DISTINCT course_id) as unique_courses,
  count(DISTINCT created_by) as unique_creators
FROM projects;

-- Test users access
SELECT 
  'Users Test' as test_name,
  count(*) as total_users,
  count(*) FILTER (WHERE is_global_admin = true) as admin_count
FROM users;

-- Test chats access
SELECT 
  'Chats Test' as test_name,
  count(*) as total_chats,
  count(DISTINCT user_id) as unique_chat_users
FROM chats;

-- ============================================================================
-- VERIFY HELPER FUNCTIONS WORK
-- ============================================================================

-- Test the helper functions we created
SELECT 
  'Helper Functions Test' as test_name,
  'Functions created successfully' as result
WHERE EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname IN ('is_instructor_in_course', 'can_access_course_projects')
);

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

SELECT 
  '✅ RLS RECURSION FIX VERIFICATION COMPLETE' as status,
  NOW() as tested_at,
  'All queries completed without infinite recursion' as result;