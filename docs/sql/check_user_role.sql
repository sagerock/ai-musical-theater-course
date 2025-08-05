-- =============================================================================
-- CHECK USER ROLE IN DATABASE
-- =============================================================================

-- Check what role sage+admin@sagerock.com actually has in the database
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

-- Also check if there are any other users with this email pattern
SELECT 
    id,
    name,
    email,
    role,
    is_global_admin
FROM public.users 
WHERE email LIKE '%sage%admin%';

-- Check the admin_emails table to see if the email is registered
SELECT * FROM public.admin_emails WHERE email = 'sage+admin@sagerock.com';

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

RUN THIS SCRIPT TO CHECK:

1. What role the user actually has in the database
2. Whether the make_user_admin.sql script was applied
3. Whether the admin_emails setup is working

EXPECTED RESULTS:
- User should have role = 'admin' and is_global_admin = true
- If not, we need to run the make_user_admin.sql script

*/
