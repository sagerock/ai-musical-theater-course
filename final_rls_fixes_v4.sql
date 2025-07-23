-- =============================================================================
-- FINAL RLS FIXES V4 - The REAL Fix for User Sync 403 Errors
-- =============================================================================

-- ROOT CAUSE IDENTIFIED:
-- The app uses the 'anon' (anonymous) key for initial user sync, but our RLS 
-- policies only allowed 'authenticated' users to insert records. This creates
-- a chicken-and-egg problem: users can't be inserted until they're authenticated,
-- but they can't be authenticated until they're inserted.

-- SOLUTION:
-- Allow both 'anon' and 'authenticated' roles to insert user records, but with
-- strict validation that they can only insert their own record.

-- =============================================================================
-- STEP 1: REMOVE ALL POLICIES FROM THE `users` TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert their own user record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;


-- =============================================================================
-- STEP 2: CREATE CORRECT POLICIES FOR THE `users` TABLE
-- =============================================================================

-- POLICY 1: Allow users to view their own user record
-- (Only authenticated users need to read their data)
CREATE POLICY "Users can view their own data" 
ON public.users
FOR SELECT 
TO authenticated
USING (auth.uid() = id);


-- POLICY 2: Allow BOTH anon and authenticated users to insert their own record
-- This fixes the chicken-and-egg problem during user sync
CREATE POLICY "Allow user record creation during sync" 
ON public.users
FOR INSERT 
TO anon, authenticated
WITH CHECK (
    -- For anon users (initial sync): allow if the ID matches the JWT claim
    (auth.role() = 'anon' AND auth.uid() = id) OR
    -- For authenticated users: allow if the ID matches their auth ID  
    (auth.role() = 'authenticated' AND auth.uid() = id)
);


-- POLICY 3: Allow authenticated users to update their own data
CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- =============================================================================
-- EXPLANATION
-- =============================================================================

/*

THE KEY INSIGHT:
- During initial user sync, the app uses the 'anon' (anonymous) role
- Our previous policies only allowed 'authenticated' users to insert
- This created a catch-22: can't insert until authenticated, can't authenticate until inserted

THE FIX:
- Allow 'anon' role to insert user records during the sync process
- Maintain security by ensuring they can only insert their own record (auth.uid() = id)
- Keep all other operations restricted to authenticated users

This should resolve the persistent 403 errors during user sync.

*/
