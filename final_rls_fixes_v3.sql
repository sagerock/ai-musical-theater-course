-- =============================================================================
-- FINAL RLS FIXES V3 - Definitive User Table Policies
-- =============================================================================

-- This script takes a more definitive approach by removing ALL existing policies
-- on the `users` table and recreating only the essential ones from scratch.
-- This will eliminate any hidden or conflicting policies that are causing the
-- persistent 403 errors during user sync.

-- =============================================================================
-- STEP 1: REMOVE ALL POLICIES FROM THE `users` TABLE
-- =============================================================================

-- Drop all known and potential policies to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert their own user record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
-- Add any other policy names you might have used here.


-- =============================================================================
-- STEP 2: RECREATE ESSENTIAL POLICIES FOR THE `users` TABLE
-- =============================================================================

-- POLICY 1: Allow users to view their own user record.
-- This is required for the app to function correctly after login.
CREATE POLICY "Users can view their own data" 
ON public.users
FOR SELECT 
USING (auth.uid() = id);


-- POLICY 2: Allow a newly authenticated user to insert their own record.
-- This is the most critical policy to fix the user sync (403 Forbidden) error.
CREATE POLICY "Authenticated users can insert their own user record" 
ON public.users
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);


-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

TO BE PERFORMED IN YOUR SUPABASE SQL EDITOR:

1.  Execute this entire script.

2.  After the script runs successfully, restart your React application (`npm start`).

3.  Log in as a new user.

This should permanently resolve the user insertion and subsequent data loading errors.

*/
