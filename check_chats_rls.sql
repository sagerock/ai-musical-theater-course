-- Check current RLS status on chats table

-- 1. Check if RLS is enabled on chats table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'chats';

-- 2. List all policies on chats table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'chats';

-- 3. Test basic access
SELECT COUNT(*) as total_chats FROM chats;

-- 4. Sample data to understand structure
SELECT user_id, COUNT(*) as chat_count 
FROM chats 
GROUP BY user_id 
ORDER BY chat_count DESC 
LIMIT 5;