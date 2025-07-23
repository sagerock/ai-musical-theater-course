-- =============================================================================
-- FIX CHAT_TAGS TABLE RLS - Final RLS issue for chat queries
-- =============================================================================

-- The chat queries are still failing because the chat_tags junction table
-- (which connects chats to tags) still has RLS enabled.

-- SOLUTION: Disable RLS on chat_tags table

-- Disable RLS on chat_tags table
ALTER TABLE public.chat_tags DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'chat_tags';

-- This should show rls_enabled = false for the chat_tags table

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO FIX THE FINAL CHAT QUERY ISSUE:

1. Run this script in your Supabase SQL editor
2. Test your React app - chat queries should finally work!
3. Dashboard should load completely without any RLS errors

WHAT THIS FIXES:
- Disables RLS on the chat_tags junction table
- Resolves the "query would be affected by row-level security policy for table chat_tags" error
- Enables full chat functionality in the dashboard

AFTER THIS WORKS:
- Your app should be 100% functional!
- All dashboard sections should load properly
- No more 403 RLS errors

*/
