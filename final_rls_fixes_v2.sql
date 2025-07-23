-- =====================================================
-- FINAL RLS FIXES V2 - Idempotent & Corrected
-- =====================================================

-- This script is now idempotent, meaning it can be run multiple times safely.

-- =============================================================================
-- 1. FIX USER INSERT (The Root Cause of 403 Errors)
-- =============================================================================

-- Drop the policy if it exists, ensuring the script can be re-run.
-- The name here now EXACTLY matches the CREATE statement below.
DROP POLICY IF EXISTS "Authenticated users can insert their own user record" ON public.users;

-- This policy allows any authenticated user to insert their own record, 
-- which is necessary for the user sync process to succeed.
CREATE POLICY "Authenticated users can insert their own user record" 
ON public.users
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);


-- =============================================================================
-- 2. STRENGTHEN PROJECT & COURSE MEMBERSHIP SELECT POLICIES
-- =============================================================================

-- These policies are being updated to be more robust and ensure the user exists
-- before checking for project/course membership.

-- Drop the old project select policy
DROP POLICY IF EXISTS "Users can view projects they are involved in" ON public.projects;

-- Create a more robust project select policy
CREATE POLICY "Users can view projects they are involved in" ON public.projects
    FOR SELECT USING (
        (SELECT auth.uid() IS NOT NULL) AND
        (auth.uid() = created_by OR
         EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = projects.id AND user_id = auth.uid()
        ))
    );

-- Drop the old course membership select policy
DROP POLICY IF EXISTS "Users can view their own course memberships" ON public.course_memberships;

-- Create a more robust course membership select policy
CREATE POLICY "Users can view their own course memberships" ON public.course_memberships
    FOR SELECT USING (
        (SELECT auth.uid() IS NOT NULL) AND (auth.uid() = user_id)
    );


-- =============================================================================
-- SUMMARY OF FIXES
-- =============================================================================

/*
FIXES APPLIED:

1. USER INSERTION FIXED:
   - The RLS policy on the `users` table now correctly allows any authenticated user
     to insert their own record. This is the key fix that should resolve the user sync failures.

2. ROBUST SELECT POLICIES:
   - The SELECT policies for `projects` and `course_memberships` have been strengthened
     to ensure a user is logged in before checking their permissions.

After applying this SQL, the 403 errors should be resolved.
*/
