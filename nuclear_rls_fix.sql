-- =============================================================================
-- NUCLEAR RLS FIX - Temporary Solution to Get App Working
-- =============================================================================

-- IMPORTANT: This is a TEMPORARY fix to get your app working immediately.
-- It temporarily disables RLS on key tables so we can test the app functionality.
-- Once the app is working, we can re-enable RLS incrementally with proper policies.

-- WARNING: This reduces security temporarily. Only use in development/testing.

-- =============================================================================
-- STEP 1: TEMPORARILY DISABLE RLS ON PROBLEMATIC TABLES
-- =============================================================================

-- Disable RLS on users table (allows user sync to work)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on course_memberships table (allows course queries to work)
ALTER TABLE public.course_memberships DISABLE ROW LEVEL SECURITY;

-- Disable RLS on project_members table (allows project queries to work)
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on projects table (allows project access)
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on chats table (allows chat queries to work)
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;


-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check which tables have RLS disabled (should show 'f' for the tables above)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
JOIN pg_class ON pg_class.relname = pg_tables.tablename
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE schemaname = 'public' 
AND tablename IN ('users', 'course_memberships', 'project_members', 'projects', 'chats')
ORDER BY tablename;


-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO GET YOUR APP WORKING IMMEDIATELY:

1. Run this entire script in your Supabase SQL editor
2. Restart your React app (`npm start`)  
3. Test login, dashboard, and all functionality
4. Once everything is working, we can re-enable RLS table by table with proper policies

NEXT STEPS AFTER APP IS WORKING:
- Re-enable RLS on one table at a time
- Test each table's policies individually
- Build up security incrementally
- Ensure each policy works before moving to the next

This approach will let us:
1. Confirm the app works without RLS interference
2. Identify which specific policies are causing issues
3. Build security back up properly, one piece at a time

*/
