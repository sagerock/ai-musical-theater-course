-- =============================================================================
-- ADD ALL REMAINING MISSING CHAT COLUMNS - Complete Fix
-- =============================================================================

-- The app keeps revealing missing columns one by one. Let's add all the columns
-- the chat functionality expects to avoid this whack-a-mole situation.

-- =============================================================================
-- ADD ALL MISSING COLUMNS
-- =============================================================================

-- Add tool_used column (if not already added)
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

-- Add user_id column (the app expects this instead of/in addition to created_by)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        COMMENT ON COLUMN public.chats.user_id IS 'Reference to the user who created this chat';
    END IF;
END $$;

-- Add content column (for chat content/messages)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'content'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN content TEXT;
        COMMENT ON COLUMN public.chats.content IS 'Chat content or message text';
    END IF;
END $$;

-- Add model column (for AI model used)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'model'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN model TEXT;
        COMMENT ON COLUMN public.chats.model IS 'AI model used for this chat';
    END IF;
END $$;

-- Add tokens_used column (for token tracking)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'tokens_used'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN tokens_used INTEGER;
        COMMENT ON COLUMN public.chats.tokens_used IS 'Number of tokens used for this chat';
    END IF;
END $$;

-- =============================================================================
-- UPDATE EXISTING DATA (if needed)
-- =============================================================================

-- If there's existing data with created_by but no user_id, copy it over
UPDATE public.chats 
SET user_id = created_by 
WHERE user_id IS NULL AND created_by IS NOT NULL;

-- =============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for user_id lookup
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);

-- Index for tool_used lookup
CREATE INDEX IF NOT EXISTS idx_chats_tool_used ON public.chats(tool_used);

-- Index for model lookup
CREATE INDEX IF NOT EXISTS idx_chats_model ON public.chats(model);

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Verify all columns are now present
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chats'
ORDER BY ordinal_position;

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO ADD ALL REMAINING MISSING CHAT COLUMNS:

1. Run this script in your Supabase SQL editor
2. Test chat functionality - it should finally work 100%!

WHAT THIS FIXES:
- Adds tool_used column (for AI tool tracking)
- Adds user_id column (what the app expects for user reference)
- Adds content column (for chat messages)
- Adds model column (for AI model tracking)
- Adds tokens_used column (for usage tracking)
- Copies existing created_by data to user_id if needed
- Adds performance indexes

AFTER THIS WORKS:
- Chat functionality should be 100% working
- No more "column not found" errors
- Your app should be fully functional!

*/
