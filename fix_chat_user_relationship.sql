-- =============================================================================
-- FIX CHAT-USER RELATIONSHIP AMBIGUITY
-- =============================================================================

-- The chats table now has both 'created_by' and 'user_id' columns that reference
-- the users table, causing Supabase to be confused about which relationship to use.
-- We need to either remove one or make the relationship explicit.

-- SOLUTION: Remove the created_by column since we now have user_id
-- (After copying any existing data to user_id)

-- =============================================================================
-- 1. ENSURE DATA IS MIGRATED
-- =============================================================================

-- Copy any remaining created_by data to user_id (in case previous migration missed some)
UPDATE public.chats 
SET user_id = created_by 
WHERE user_id IS NULL AND created_by IS NOT NULL;

-- =============================================================================
-- 2. REMOVE THE REDUNDANT COLUMN
-- =============================================================================

-- Drop the created_by column to eliminate the relationship ambiguity
ALTER TABLE public.chats DROP COLUMN IF EXISTS created_by;

-- =============================================================================
-- 3. VERIFICATION
-- =============================================================================

-- Verify the chats table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chats'
ORDER BY ordinal_position;

-- Verify there's only one relationship to users now
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'chats'
AND ccu.table_name = 'users';

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO FIX THE RELATIONSHIP AMBIGUITY:

1. Run this script in your Supabase SQL editor
2. Test chat functionality - the relationship error should be resolved

WHAT THIS FIXES:
- Removes the redundant 'created_by' column from chats table
- Eliminates the ambiguity between 'created_by' and 'user_id' relationships
- Ensures all existing data is preserved in the 'user_id' column
- Resolves the "more than one relationship was found" error

AFTER THIS WORKS:
- Chat queries should work without relationship ambiguity errors
- Your app should be 100% functional!

*/
