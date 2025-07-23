-- =============================================================================
-- DEBUG COURSE RLS ISSUES
-- =============================================================================

-- 1. Check current user context
SELECT 
    auth.uid() as current_auth_uid,
    auth.role() as current_auth_role;

-- 2. Check if current user is recognized as admin
SELECT 
    id,
    email,
    role,
    is_global_admin,
    'Current user admin check' as note
FROM users 
WHERE id = auth.uid();

-- 3. Check all RLS policies on courses table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'courses'
ORDER BY policyname;

-- 4. Test the admin policy logic directly
SELECT 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_global_admin = true
    ) as admin_policy_check;

-- 5. Check if there are any courses in the table
SELECT 
    COUNT(*) as total_courses,
    'Total courses in table' as note
FROM courses;

-- 6. Try to select courses with explicit admin check
SELECT 
    c.*,
    'Direct course query' as note
FROM courses c
WHERE EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_global_admin = true
);

-- 7. Check if RLS is enabled on courses table
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    'RLS status' as note
FROM pg_tables 
WHERE tablename = 'courses';

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

RUN THIS SCRIPT TO DIAGNOSE THE COURSE RLS ISSUE:

This will show:
1. Your current auth context
2. Whether you're recognized as admin
3. All RLS policies on courses
4. Whether the admin policy logic works
5. If there are courses in the table
6. Direct course query test
7. RLS status on courses table

This will help us identify why you can't see courses despite being admin.

*/
