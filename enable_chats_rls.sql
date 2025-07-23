-- Enable RLS on chats table
-- Policies already exist, we just need to enable RLS

-- Enable RLS on chats table
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'chats';

-- Test anonymous access (should be blocked after RLS is enabled)
SET ROLE anon;
SELECT COUNT(*) as anon_accessible_chats FROM chats;
RESET ROLE;