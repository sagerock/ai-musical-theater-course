-- =============================================================================
-- SETUP ADMIN EMAIL - sage+admin@sagerock.com
-- =============================================================================

-- Since there's a foreign key constraint requiring the user ID to exist in Supabase Auth first,
-- we'll use a different approach: mark the email as admin so when they sign up, 
-- they automatically get admin privileges.

-- =============================================================================
-- APPROACH: Update existing user OR prepare for future signup
-- =============================================================================

-- Option 1: If the user already exists, make them admin
UPDATE public.users 
SET 
    role = 'admin',
    is_global_admin = true,
    updated_at = NOW()
WHERE email = 'sage+admin@sagerock.com';

-- Check if the update worked
SELECT 
    'Updated existing user' as action,
    id,
    name,
    email,
    role,
    is_global_admin
FROM public.users 
WHERE email = 'sage+admin@sagerock.com';

-- =============================================================================
-- ALTERNATIVE: Create a lookup table for admin emails
-- =============================================================================

-- Create a simple table to mark emails as admin
CREATE TABLE IF NOT EXISTS public.admin_emails (
    email TEXT PRIMARY KEY,
    role TEXT DEFAULT 'admin',
    is_global_admin BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_emails TO anon, authenticated;

-- Add the admin email
INSERT INTO public.admin_emails (email, role, is_global_admin)
VALUES ('sage+admin@sagerock.com', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    is_global_admin = true;

-- Verify the admin email is registered
SELECT * FROM public.admin_emails WHERE email = 'sage+admin@sagerock.com';

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

RECOMMENDED APPROACH:

1. Run this script to:
   - Try to update existing user (if they already signed up)
   - Create admin_emails lookup table
   - Register sage+admin@sagerock.com as admin

2. Update your syncUserToSupabase function to check admin_emails table:
   
   // In AuthContext.js, modify syncUserToSupabase function:
   async function syncUserToSupabase(user, role = 'student', displayName = null) {
     // Check if this email is marked as admin
     const { data: adminCheck } = await supabase
       .from('admin_emails')
       .select('role, is_global_admin')
       .eq('email', user.email)
       .single();
     
     const finalRole = adminCheck?.role || role;
     const isGlobalAdmin = adminCheck?.is_global_admin || false;
     
     const userData = {
       id: user.id,
       name: displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
       email: user.email,
       role: finalRole,
       is_global_admin: isGlobalAdmin,
     };
     
     // ... rest of sync logic
   }

3. Have sage+admin@sagerock.com sign up normally through your app
4. They will automatically get admin privileges!

WHAT THIS DOES:
- Creates a lookup table for admin emails
- Marks sage+admin@sagerock.com as admin
- When they sign up, they'll automatically get admin role
- No foreign key constraint issues

*/
