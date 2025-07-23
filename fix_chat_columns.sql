-- =============================================================================
-- FIX REMAINING CHAT COLUMNS - Complete Chat Table Schema
-- =============================================================================

-- The chat POST request is still failing with PGRST204, which means the app
-- is trying to insert into columns that don't exist in the chats table.
-- Let's ensure the chats table has all the columns the app expects.

-- =============================================================================
-- 1. CHECK CURRENT CHATS TABLE STRUCTURE
-- =============================================================================

-- First, let's see what columns currently exist in the chats table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chats'
ORDER BY ordinal_position;

-- =============================================================================
-- 2. ADD ALL MISSING COLUMNS TO CHATS TABLE
-- =============================================================================

-- Add prompt column (if not already added)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'prompt'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN prompt TEXT;
        COMMENT ON COLUMN public.chats.prompt IS 'User prompt/input that generated this chat';
    END IF;
END $$;

-- Add response column (AI response)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'response'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN response TEXT;
        COMMENT ON COLUMN public.chats.response IS 'AI response to the user prompt';
    END IF;
END $$;

-- Add title column (chat title/summary)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'title'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN title TEXT;
        COMMENT ON COLUMN public.chats.title IS 'Title or summary of the chat';
    END IF;
END $$;

-- Add project_id column (link to projects)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
        COMMENT ON COLUMN public.chats.project_id IS 'Optional reference to associated project';
    END IF;
END $$;

-- Add status column (for chat state tracking)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chats' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.chats ADD COLUMN status TEXT DEFAULT 'active';
        COMMENT ON COLUMN public.chats.status IS 'Status of the chat (active, archived, etc.)';
    END IF;
END $$;

-- =============================================================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for project_id lookup
CREATE INDEX IF NOT EXISTS idx_chats_project_id ON public.chats(project_id);

-- Index for status lookup
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats(status);

-- =============================================================================
-- 4. VERIFICATION QUERY
-- =============================================================================

-- Verify the chats table now has all expected columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chats'
ORDER BY ordinal_position;

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO FIX THE REMAINING CHAT ISSUES:

1. Run this script in your Supabase SQL editor
2. Test chat functionality in your React app
3. The chat POST requests should now work without 400 errors

WHAT THIS FIXES:
- Adds all missing columns that the chat functionality expects
- Ensures chats table has: prompt, response, title, project_id, status
- Adds proper indexes for performance
- Maintains existing data and relationships

AFTER THIS WORKS:
- Chat functionality should be 100% working
- No more PGRST204 "column not found" errors
- Users should be able to send and receive chat messages

*/
