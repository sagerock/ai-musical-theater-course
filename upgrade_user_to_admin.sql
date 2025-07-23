-- Upgrade sage+instructor3@sagerock.com to admin for testing
-- Run this in Supabase SQL Editor

UPDATE users 
SET 
  role = 'admin',
  is_global_admin = true
WHERE email = 'sage+instructor3@sagerock.com';

-- Verify the update
SELECT id, name, email, role, is_global_admin 
FROM users 
WHERE email = 'sage+instructor3@sagerock.com';