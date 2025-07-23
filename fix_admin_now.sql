-- =============================================================================
-- IMMEDIATE ADMIN FIX - Run this now to fix the admin role
-- =============================================================================

-- Force update the user to admin role right now
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
    updated_at
FROM public.users 
WHERE email = 'sage+admin@sagerock.com';

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

RUN THIS SCRIPT RIGHT NOW:

1. This will immediately set sage+admin@sagerock.com to admin role
2. The syncUserToSupabase function will now preserve this admin role
3. After running this, refresh your browser
4. You should see: "Existing user role: admin -> Final role: admin"
5. Then you'll be able to access /admin

The key is that the sync function now preserves existing admin roles,
but we need to set the admin role in the database first!

*/
