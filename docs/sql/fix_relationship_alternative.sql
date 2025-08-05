-- =============================================================================
-- FIX CHAT-USER RELATIONSHIP AMBIGUITY - Alternative Solution
-- =============================================================================

-- Since we can't drop the created_by column due to RLS policy dependencies,
-- we'll use an alternative approach: make the query relationships explicit
-- by using foreign key names or updating the app queries.

-- SOLUTION: Instead of dropping the column, we'll ensure both columns have
-- the same data and document which one to use for queries.

-- =============================================================================
-- 1. ENSURE DATA CONSISTENCY
-- =============================================================================

-- Make sure both columns have the same data
UPDATE public.chats 
SET user_id = created_by 
WHERE user_id IS NULL AND created_by IS NOT NULL;

UPDATE public.chats 
SET created_by = user_id 
WHERE created_by IS NULL AND user_id IS NOT NULL;

-- =============================================================================
-- 2. ADD CONSTRAINT TO KEEP THEM IN SYNC
-- =============================================================================

-- Add a check constraint to ensure both columns always have the same value
-- (This will prevent future data inconsistency)
DO $$
BEGIN
    -- Only add the constraint if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chats_user_consistency'
    ) THEN
        ALTER TABLE public.chats 
        ADD CONSTRAINT chats_user_consistency 
        CHECK (user_id = created_by OR (user_id IS NULL AND created_by IS NULL));
    END IF;
END $$;

-- =============================================================================
-- 3. VERIFICATION
-- =============================================================================

-- Verify both columns have consistent data
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN user_id = created_by THEN 1 END) as matching_rows,
    COUNT(CASE WHEN user_id IS NULL AND created_by IS NULL THEN 1 END) as both_null_rows,
    COUNT(CASE WHEN user_id != created_by OR (user_id IS NULL) != (created_by IS NULL) THEN 1 END) as inconsistent_rows
FROM public.chats;

-- Show the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chats'
AND column_name IN ('user_id', 'created_by')
ORDER BY column_name;

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO FIX THE RELATIONSHIP AMBIGUITY (ALTERNATIVE APPROACH):

1. Run this script in your Supabase SQL editor
2. The relationship ambiguity should be resolved by data consistency

WHAT THIS FIXES:
- Ensures both user_id and created_by columns have consistent data
- Adds a constraint to keep them synchronized
- Avoids dropping the column that RLS policies depend on
- Resolves the relationship ambiguity through data consistency

ALTERNATIVE SOLUTIONS IF THIS DOESN'T WORK:
1. Update the app queries to be more specific about which relationship to use
2. Remove the RLS policies first, then drop the column
3. Use explicit relationship names in Supabase queries

AFTER THIS WORKS:
- Chat queries should work without relationship ambiguity errors
- Both columns will remain but stay synchronized
- Your app should be 100% functional!

*/
