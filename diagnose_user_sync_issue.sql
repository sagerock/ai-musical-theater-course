-- Diagnose user synchronization issue between auth.users and public.users

-- Check auth.users table (Supabase Auth users)
SELECT 'auth.users' as table_name, COUNT(*) as user_count FROM auth.users;

-- Check public.users table (our application users)  
SELECT 'public.users' as table_name, COUNT(*) as user_count FROM users;

-- Find users in auth.users but not in public.users (sync gap)
SELECT 
  'Missing in public.users' as issue,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 5;

-- Find users in public.users but not in auth.users (orphaned)
SELECT 
  'Orphaned in public.users' as issue,
  pu.id,
  pu.email,
  pu.created_at
FROM users pu
LEFT JOIN auth.users au ON pu.id = au.id  
WHERE au.id IS NULL
ORDER BY pu.created_at DESC
LIMIT 5;