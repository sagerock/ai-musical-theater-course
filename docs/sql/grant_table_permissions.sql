-- =============================================================================
-- GRANT TABLE PERMISSIONS - The REAL Fix for 403 Errors
-- =============================================================================

-- ROOT CAUSE IDENTIFIED:
-- The 403 errors were not caused by RLS policies, but by missing basic table 
-- permissions for the 'anon' and 'authenticated' roles. Your app uses these
-- roles to access the database, but they don't have SELECT, INSERT, UPDATE, 
-- DELETE permissions on the tables.

-- SOLUTION:
-- Grant the necessary table permissions to both 'anon' and 'authenticated' roles.

-- =============================================================================
-- GRANT PERMISSIONS TO ANON ROLE (for initial user sync and public access)
-- =============================================================================

-- Users table permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Course memberships permissions  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_memberships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_memberships TO authenticated;

-- Project members permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;

-- Projects permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;

-- Chats permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO authenticated;

-- Additional tables that might be needed
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_tags TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflections TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;


-- =============================================================================
-- GRANT SEQUENCE PERMISSIONS (for auto-incrementing IDs)
-- =============================================================================

-- Grant usage on sequences so INSERT operations can generate IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check granted permissions for anon role
SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE grantee = 'anon' 
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- Check granted permissions for authenticated role  
SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
AND table_schema = 'public'
ORDER BY table_name, privilege_type;


-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO FIX THE REAL ROOT CAUSE:

1. Run this entire script in your Supabase SQL editor
2. Restart your React app (`npm start`)
3. Test login, user sync, and dashboard functionality

This should finally resolve all 403 permission errors!

WHAT THIS FIXES:
- Grants basic table permissions (SELECT, INSERT, UPDATE, DELETE) to anon and authenticated roles
- Allows your app to actually access the database tables
- Resolves the "permission denied for table ..." errors
- Enables user sync, dashboard loading, and all app functionality

NEXT STEPS AFTER THIS WORKS:
- Re-enable RLS on tables one by one with proper policies
- Build up security incrementally while maintaining functionality
- Test each RLS policy to ensure it works with the granted permissions

*/
