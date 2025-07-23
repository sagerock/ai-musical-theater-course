-- =============================================================================
-- ADD FINAL MISSING COLUMN - tool_used to chats table
-- =============================================================================

-- The app is trying to insert a 'tool_used' column that doesn't exist in the chats table.
-- This is likely for tracking which AI tool or feature was used for the chat.

-- Add tool_used column to chats table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'tool_used'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN tool_used TEXT;
        COMMENT ON COLUMN public.chats.tool_used IS 'Name of the AI tool or feature used for this chat';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chats' 
AND column_name = 'tool_used';

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO ADD THE FINAL MISSING COLUMN:

1. Run this script in your Supabase SQL editor
2. Test chat functionality - it should now work 100%!

WHAT THIS FIXES:
- Adds the missing 'tool_used' column to the chats table
- Resolves the final PGRST204 error preventing chat functionality

AFTER THIS WORKS:
- Chat functionality should be 100% working
- No more "column not found" errors
- Your app should be fully functional!

*/
