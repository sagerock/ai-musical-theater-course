-- Debug current user state to understand the 409 error

-- Check what users currently exist in both tables
SELECT 'auth.users count' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'public.users count', COUNT(*) FROM users;

-- Check most recent users in auth.users
SELECT 'Recent auth users' as info, id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 3;

-- Check most recent users in public.users  
SELECT 'Recent public users' as info, id, name, email, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 3;

-- Check recent project creation attempts
SELECT 'Recent projects' as info, id, title, created_by, created_at,
       CASE WHEN EXISTS (SELECT 1 FROM users WHERE id = projects.created_by) 
            THEN 'Valid User' 
            ELSE 'INVALID USER' 
       END as user_status
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;