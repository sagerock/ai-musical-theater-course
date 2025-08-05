-- =====================================================
-- RLS & SCHEMA FIXES V2 - Final Adjustments
-- =====================================================

-- =====================================================
-- 1. FIX PROJECT QUERIES - Allow members to view projects
-- =====================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

-- Allow users to view projects they created OR are members of
CREATE POLICY "Users can view projects they are involved in" ON public.projects
    FOR SELECT USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = id AND user_id = auth.uid()
        )
    );

-- =====================================================
-- 2. FIX CHAT SCHEMA - No code changes needed, app needs to be updated
-- =====================================================

-- The schema is correct with `created_by` on the chats table.
-- The application code needs to be updated to query `created_by` instead of `user_id`.
-- This is a code change, not a schema change.

-- =====================================================
-- SUMMARY OF FIXES
-- =====================================================

/*
FIXES APPLIED:

1. PROJECT QUERY FIX:
   - Updated RLS policy on `projects` table
   - Allows users to view projects they are members of
   - This should resolve the "query would be affected by row-level security" error

2. CHAT SCHEMA FIX:
   - The schema is correct; the app needs to be updated
   - The app should query `created_by` on the `chats` table
   - This will resolve the "column chats.user_id does not exist" error
*/
