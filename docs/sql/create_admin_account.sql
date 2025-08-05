-- =============================================================================
-- CREATE ADMIN ACCOUNT - sage+admin@sagerock.com
-- =============================================================================

-- This script creates an admin account in the users table.
-- Note: The user will still need to sign up through Supabase Auth first,
-- but this ensures their account gets admin privileges when they do.

-- =============================================================================
-- METHOD 1: Create admin user record (for when they sign up via Auth)
-- =============================================================================

-- Insert admin user record
-- Note: You'll need to replace the UUID with the actual Supabase Auth UUID after signup
INSERT INTO public.users (
    id,
    name,
    email,
    role,
    is_global_admin,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(), -- This will be replaced by actual Auth UUID during signup
    'Sage Admin',
    'sage+admin@sagerock.com',
    'admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    is_global_admin = true,
    updated_at = NOW();

-- =============================================================================
-- METHOD 2: Update existing user to admin (if they already signed up)
-- =============================================================================

-- If the user already exists, make them an admin
UPDATE public.users 
SET 
    role = 'admin',
    is_global_admin = true,
    updated_at = NOW()
WHERE email = 'sage+admin@sagerock.com';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check if the admin user exists and has correct permissions
SELECT 
    id,
    name,
    email,
    role,
    is_global_admin,
    created_at
FROM public.users 
WHERE email = 'sage+admin@sagerock.com';

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

TO CREATE THE ADMIN ACCOUNT:

OPTION A - If sage+admin@sagerock.com hasn't signed up yet:
1. Run this script in Supabase SQL editor
2. Have the admin user sign up normally through your app
3. The syncUserToSupabase function will automatically update their role to admin

OPTION B - If sage+admin@sagerock.com already signed up:
1. Run this script in Supabase SQL editor
2. The UPDATE statement will make them an admin immediately

WHAT THIS DOES:
- Creates/updates user record with admin role
- Sets is_global_admin = true for full system access
- Ensures admin privileges across all courses and features

ADMIN CAPABILITIES:
- Full access to all courses and projects
- User management capabilities
- System-wide analytics and reporting
- Course creation and management
- Global tag and content management

SECURITY NOTE:
- Admin accounts have elevated privileges
- Ensure this email is secure and trusted
- Consider enabling 2FA for admin accounts in production

*/
