-- =====================================================
-- RLS POLICY FIXES - Allow App to Function Properly
-- =====================================================

-- =====================================================
-- 1. FIX USER SYNC - Allow authenticated users to insert themselves
-- =====================================================

-- Drop the restrictive service role policy and replace with more permissive ones
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- Allow authenticated users to insert their own record (for user sync)
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role for backend operations
CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 2. FIX PROJECT MEMBER QUERIES - More permissive policies
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Project members can view membership" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;

-- More permissive policies that allow the queries to work
CREATE POLICY "Users can view project memberships they're involved in" ON public.project_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id AND created_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        )
    );

CREATE POLICY "Project owners can manage members" ON public.project_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id AND created_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        )
    );

-- Allow users to be added as project members
CREATE POLICY "Users can be added as project members" ON public.project_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id AND created_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        )
    );

-- =====================================================
-- 3. FIX COURSE MEMBERSHIP QUERIES - Allow users to query their memberships
-- =====================================================

-- The existing policies should work, but let's make sure they're not too restrictive
-- Drop and recreate to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.course_memberships;

CREATE POLICY "Users can view their own memberships" ON public.course_memberships
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = course_id AND instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        )
    );

-- =====================================================
-- 4. ADD MISSING TABLES FOR CHAT FUNCTIONALITY
-- =====================================================

-- Create chat_tags table (junction table for chat-tag relationships)
CREATE TABLE IF NOT EXISTS public.chat_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chat_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.chat_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_tags
CREATE POLICY "Users can view chat tags for accessible chats" ON public.chat_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE id = chat_id AND (
                created_by = auth.uid() OR
                (type = 'project' AND project_id IS NOT NULL AND (
                    EXISTS (
                        SELECT 1 FROM public.projects 
                        WHERE id = project_id AND created_by = auth.uid()
                    ) OR
                    EXISTS (
                        SELECT 1 FROM public.project_members 
                        WHERE project_id = chats.project_id AND user_id = auth.uid()
                    )
                )) OR
                (type = 'course' AND course_id IS NOT NULL AND
                    EXISTS (
                        SELECT 1 FROM public.course_memberships 
                        WHERE course_id = chats.course_id AND user_id = auth.uid() AND status = 'approved'
                    )
                )
            )
        )
    );

-- Create reflections table (if needed by the app)
CREATE TABLE IF NOT EXISTS public.reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reflection_type TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reflections
CREATE POLICY "Users can manage their own reflections" ON public.reflections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Project owners can view project reflections" ON public.reflections
    FOR SELECT USING (
        project_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

-- =====================================================
-- 5. ADD INDEXES FOR NEW TABLES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_chat_tags_chat_id ON public.chat_tags(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_tags_tag_id ON public.chat_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_reflections_chat_id ON public.reflections(chat_id);
CREATE INDEX IF NOT EXISTS idx_reflections_project_id ON public.reflections(project_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON public.reflections(user_id);

-- =====================================================
-- 6. ADD TRIGGER FOR REFLECTIONS UPDATED_AT
-- =====================================================

CREATE TRIGGER update_reflections_updated_at BEFORE UPDATE ON public.reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUMMARY OF FIXES
-- =====================================================

/*
FIXES APPLIED:

1. USER SYNC FIX:
   - Added policy to allow authenticated users to insert their own profile
   - This fixes the 403 error on user sync

2. PROJECT MEMBER QUERY FIX:
   - More permissive RLS policies for project_members table
   - Allows users to query projects they're members of
   - Fixes the "query would be affected by row-level security" error

3. COURSE MEMBERSHIP FIX:
   - Ensured users can query their own course memberships
   - Fixes 403 errors on course queries

4. MISSING SCHEMA FIX:
   - Added chat_tags table for chat-tag relationships
   - Added reflections table for chat reflections
   - Fixes "Could not find relationship" errors

5. SECURITY MAINTAINED:
   - Users still can only see their own data
   - Course and project isolation is maintained
   - Admin oversight capabilities preserved
   - RLS policies are functional but secure
*/
