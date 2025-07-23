-- =============================================================================
-- MAKE SAGE+ADMIN@SAGEROCK.COM AN ADMIN - Direct Update
-- =============================================================================

-- Based on the console logs, the user sage+admin@sagerock.com exists but has role 'student'
-- Let's directly update their role to 'admin' and set is_global_admin to true

-- Update the user to admin role
UPDATE public.users 
SET 
    role = 'admin',
    is_global_admin = true,
    updated_at = NOW()
WHERE email = 'sage+admin@sagerock.com';

-- Verify the update worked
SELECT 
    id,
    name,
    email,
    role,
    is_global_admin,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'sage+admin@sagerock.com';

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO MAKE THE USER AN ADMIN:

1. Run this script in your Supabase SQL editor
2. The user sage+admin@sagerock.com will immediately become an admin
3. Refresh your browser or logout/login to see the admin access

WHAT THIS DOES:
- Updates the existing user record to have role = 'admin'
- Sets is_global_admin = true for full system access
- Updates the timestamp to reflect the change

AFTER RUNNING:
- The user should be able to access /admin
- The AuthContext should recognize them as an admin
- Admin navigation should appear

*/
