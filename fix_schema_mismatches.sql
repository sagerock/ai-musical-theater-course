-- =============================================================================
-- FIX SCHEMA MISMATCHES - Align Database Schema with App Expectations
-- =============================================================================

-- Based on the error logs, the app expects certain columns and relationships
-- that don't exist in the current schema. This script will add the missing
-- schema elements to make the app fully functional.

-- =============================================================================
-- 1. ADD MISSING COLUMNS
-- =============================================================================

-- Add course_id column to tags table (app expects this for course-based tagging)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tags' 
        AND column_name = 'course_id'
    ) THEN
        ALTER TABLE public.tags ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
        COMMENT ON COLUMN public.tags.course_id IS 'Optional course association for course-specific tags';
    END IF;
END $$;

-- Add prompt column to chats table (app expects this for storing chat prompts)
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

-- =============================================================================
-- 2. CREATE MISSING TABLES (if needed)
-- =============================================================================

-- Create instructor_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.instructor_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_visible_to_student BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.instructor_notes IS 'Notes that instructors can add to student projects';
COMMENT ON COLUMN public.instructor_notes.project_id IS 'Reference to the project this note belongs to';
COMMENT ON COLUMN public.instructor_notes.instructor_id IS 'Reference to the instructor who created this note';
COMMENT ON COLUMN public.instructor_notes.content IS 'The note content';
COMMENT ON COLUMN public.instructor_notes.is_visible_to_student IS 'Whether the student can see this note';

-- =============================================================================
-- 3. ADD MISSING INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for tags course_id lookup
CREATE INDEX IF NOT EXISTS idx_tags_course_id ON public.tags(course_id);

-- Index for instructor_notes project lookup
CREATE INDEX IF NOT EXISTS idx_instructor_notes_project_id ON public.instructor_notes(project_id);

-- Index for instructor_notes instructor lookup
CREATE INDEX IF NOT EXISTS idx_instructor_notes_instructor_id ON public.instructor_notes(instructor_id);

-- Index for instructor_notes visibility
CREATE INDEX IF NOT EXISTS idx_instructor_notes_visibility ON public.instructor_notes(project_id, is_visible_to_student);

-- =============================================================================
-- 4. DISABLE RLS ON NEW TABLES (for now)
-- =============================================================================

-- Disable RLS on instructor_notes to match current app functionality
ALTER TABLE public.instructor_notes DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. GRANT PERMISSIONS ON NEW TABLES
-- =============================================================================

-- Grant permissions to anon and authenticated roles for instructor_notes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructor_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructor_notes TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- 6. VERIFICATION QUERIES
-- =============================================================================

-- Verify tags table has course_id column
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tags' 
AND column_name IN ('id', 'name', 'course_id')
ORDER BY column_name;

-- Verify chats table has prompt column
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chats' 
AND column_name IN ('id', 'content', 'prompt', 'created_by')
ORDER BY column_name;

-- Verify instructor_notes table exists with proper structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instructor_notes'
ORDER BY ordinal_position;

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO FIX ALL SCHEMA MISMATCHES:

1. Run this script in your Supabase SQL editor
2. Restart your React app to clear any cached schema info
3. Test project functionality - all schema errors should be resolved

WHAT THIS FIXES:
- Adds missing course_id column to tags table
- Adds missing prompt column to chats table  
- Creates instructor_notes table with proper relationships
- Adds necessary indexes for performance
- Grants proper permissions to anon/authenticated roles
- Disables RLS on new tables to match current app state

AFTER THIS WORKS:
- Your app should be 100% functional with no schema errors
- All features (projects, chats, tags, instructor notes) should work properly
- No more "column does not exist" or "relationship not found" errors

*/
