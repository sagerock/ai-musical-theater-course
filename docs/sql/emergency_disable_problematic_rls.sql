-- EMERGENCY: DISABLE RLS ON PROBLEMATIC TABLES TO RESTORE APP FUNCTIONALITY
-- This is a temporary solution to get the app working while we design better policies

-- ============================================================================
-- STEP 1: DISABLE RLS ON TABLES CAUSING INFINITE RECURSION
-- ============================================================================

-- Disable RLS on users table (causing most problems)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on course_memberships table (also causing recursion)
ALTER TABLE course_memberships DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on the most critical privacy tables
-- ALTER TABLE chats DISABLE ROW LEVEL SECURITY;  -- Keep this enabled for now
-- ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;  -- Keep this enabled for now

-- ============================================================================
-- STEP 2: CLEAN UP ALL EXISTING POLICIES ON DISABLED TABLES
-- ============================================================================

-- Drop all users policies
DROP POLICY IF EXISTS "users_own_access" ON users;
DROP POLICY IF EXISTS "users_own_update" ON users;
DROP POLICY IF EXISTS "users_own_insert" ON users;
DROP POLICY IF EXISTS "users_admin_access" ON users;
DROP POLICY IF EXISTS "users_instructor_students_access" ON users;

-- Drop all course_memberships policies  
DROP POLICY IF EXISTS "memberships_own_simple" ON course_memberships;
DROP POLICY IF EXISTS "memberships_insert_simple" ON course_memberships;
DROP POLICY IF EXISTS "memberships_update_simple" ON course_memberships;
DROP POLICY IF EXISTS "memberships_admin_simple" ON course_memberships;
DROP POLICY IF EXISTS "memberships_instructor_course_access" ON course_memberships;
DROP POLICY IF EXISTS "memberships_instructor_update" ON course_memberships;

-- ============================================================================
-- STEP 3: SIMPLIFY REMAINING RLS POLICIES TO AVOID DEPENDENCIES
-- ============================================================================

-- Simplify chats policies to avoid referencing users or course_memberships
DROP POLICY IF EXISTS "chats_own_access" ON chats;
DROP POLICY IF EXISTS "chats_own_insert" ON chats;
DROP POLICY IF EXISTS "chats_own_update" ON chats;
DROP POLICY IF EXISTS "chats_admin_access" ON chats;
DROP POLICY IF EXISTS "chats_instructor_course_access" ON chats;

-- Create ultra-simple chats policies
CREATE POLICY "chats_user_only" ON chats
FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "chats_insert_user" ON chats
FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "chats_update_user" ON chats
FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Simplify PDF policies to avoid complex joins
DROP POLICY IF EXISTS "pdf_own_access" ON pdf_attachments;
DROP POLICY IF EXISTS "pdf_own_insert" ON pdf_attachments;
DROP POLICY IF EXISTS "pdf_admin_access" ON pdf_attachments;
DROP POLICY IF EXISTS "pdf_instructor_course_access" ON pdf_attachments;

-- Create ultra-simple PDF policies
CREATE POLICY "pdf_user_only" ON pdf_attachments
FOR SELECT USING (
  chat_id IN (SELECT id FROM chats WHERE user_id::text = auth.uid()::text)
);

CREATE POLICY "pdf_insert_user" ON pdf_attachments
FOR INSERT WITH CHECK (
  chat_id IN (SELECT id FROM chats WHERE user_id::text = auth.uid()::text)
);

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Check RLS status
SELECT 
  'RLS Status After Emergency Fix' as check_type,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = 'public') as policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'course_memberships', 'pdf_attachments', 'projects', 'instructor_notes', 'reflections')
ORDER BY tablename;

-- Test queries that were failing
SELECT 'Users Test' as test, count(*) FROM users;
SELECT 'Course Memberships Test' as test, count(*) FROM course_memberships;
SELECT 'Chats Test' as test, count(*) FROM chats;

-- ============================================================================
-- RESULTS & NEXT STEPS
-- ============================================================================

SELECT 
  '🚨 EMERGENCY FIX APPLIED 🚨' as status,
  NOW() as applied_at,
  'App should now work - RLS disabled on problematic tables' as result,
  'Users and course_memberships have no privacy protection' as warning,
  'Chats and PDFs still have basic user-only protection' as partial_privacy;

-- Show what privacy we still have
SELECT 
  'Remaining Privacy Protection:' as summary,
  'Chats: User can only see own conversations' as chats_privacy,
  'PDFs: User can only see own uploaded documents' as pdf_privacy,
  'Users: NO PRIVACY - all users visible to all users' as users_privacy,
  'Course Memberships: NO PRIVACY - all memberships visible' as memberships_privacy;