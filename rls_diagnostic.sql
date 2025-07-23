-- =============================================================================
-- RLS DIAGNOSTIC SCRIPT
-- =============================================================================

-- This script will help us understand exactly what RLS policies exist
-- and why the user sync is still failing with 403 errors.

-- =============================================================================
-- 1. CHECK IF RLS IS ENABLED ON THE USERS TABLE
-- =============================================================================

SELECT 
    c.relname as tablename,
    c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'users';


-- =============================================================================
-- 2. LIST ALL POLICIES ON THE USERS TABLE
-- =============================================================================

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
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;


-- =============================================================================
-- 3. CHECK CURRENT USER AUTHENTICATION STATUS
-- =============================================================================

SELECT 
    auth.uid() as current_user_id,
    auth.jwt() as jwt_claims,
    current_user as postgres_user,
    session_user as session_user;


-- =============================================================================
-- 4. TEST USER INSERT PERMISSIONS MANUALLY
-- =============================================================================

-- This will show us exactly what happens when we try to insert a user
-- Replace 'test-user-id' with an actual auth user ID if needed

-- UNCOMMENT AND MODIFY THE FOLLOWING TO TEST:
-- INSERT INTO public.users (id, name, email, role, is_global_admin)
-- VALUES ('test-user-id', 'Test User', 'test@example.com', 'student', false);


-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

RUN THIS DIAGNOSTIC SCRIPT IN YOUR SUPABASE SQL EDITOR:

1. Execute sections 1-3 to understand the current state
2. If needed, uncomment and modify section 4 to test insert permissions
3. Share the results so we can identify the exact issue

This will tell us:
- Whether RLS is properly enabled
- What policies actually exist (vs what we think we created)
- Whether the user is properly authenticated
- What specific error occurs during insert

*/
