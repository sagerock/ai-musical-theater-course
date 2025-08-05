-- TEMPORARY: Disable RLS for chat_attachments to test functionality
-- This removes all access restrictions temporarily
-- Run this in your Supabase SQL editor

-- Disable RLS temporarily
ALTER TABLE chat_attachments DISABLE ROW LEVEL SECURITY;

-- Note: This allows all authenticated users to access all attachments
-- This is ONLY for testing - you should re-enable RLS after testing
-- To re-enable later, run: ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;