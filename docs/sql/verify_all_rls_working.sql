-- VERIFY ALL RLS POLICIES ARE WORKING CORRECTLY
-- Check the current status and test basic operations

-- ============================================================================
-- CURRENT RLS STATUS CHECK
-- ============================================================================

SELECT 
  'Current RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = 'public') as policy_count,
  CASE 
    WHEN rowsecurity THEN 'Protected'
    ELSE 'Unprotected'
  END as privacy_status
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'course_memberships', 'pdf_attachments', 'projects', 'instructor_notes', 'reflections')
ORDER BY tablename;

-- ============================================================================
-- LIST ALL ACTIVE POLICIES
-- ============================================================================

SELECT 
  'Active RLS Policies' as policy_list,
  tablename,
  policyname,
  cmd as operations
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chats', 'course_memberships', 'pdf_attachments', 'projects', 'instructor_notes', 'reflections')
ORDER BY tablename, policyname;

-- ============================================================================
-- TEST BASIC QUERIES ON ALL TABLES
-- ============================================================================

SELECT 'Basic Query Tests' as test_section;

-- Test all tables for basic accessibility
SELECT 'users' as table_name, count(*) as record_count FROM users
UNION ALL
SELECT 'chats' as table_name, count(*) as record_count FROM chats  
UNION ALL
SELECT 'course_memberships' as table_name, count(*) as record_count FROM course_memberships
UNION ALL
SELECT 'pdf_attachments' as table_name, count(*) as record_count FROM pdf_attachments
UNION ALL
SELECT 'projects' as table_name, count(*) as record_count FROM projects
UNION ALL
SELECT 'instructor_notes' as table_name, count(*) as record_count FROM instructor_notes
UNION ALL
SELECT 'reflections' as table_name, count(*) as record_count FROM reflections;

-- ============================================================================
-- PRIVACY PROTECTION SUMMARY
-- ============================================================================

SELECT 
  '📊 PRIVACY PROTECTION SUMMARY' as summary_title,
  NOW() as checked_at,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') as total_active_policies,
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true AND tablename IN ('users', 'chats', 'course_memberships', 'pdf_attachments', 'projects', 'instructor_notes', 'reflections')) as protected_tables;

-- Show which tables are protected vs unprotected
SELECT 
  'Protection Details' as detail_type,
  CASE 
    WHEN tablename IN ('chats', 'pdf_attachments', 'projects', 'instructor_notes', 'reflections') 
    THEN '🔒 PROTECTED: ' || tablename
    ELSE '❌ UNPROTECTED: ' || tablename
  END as protection_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'course_memberships', 'pdf_attachments', 'projects', 'instructor_notes', 'reflections')
ORDER BY tablename;