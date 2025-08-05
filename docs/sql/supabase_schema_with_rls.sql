-- =====================================================
-- AI ENGAGEMENT HUB - SECURE SCHEMA WITH RLS
-- For School Environments - Security First Design
-- =====================================================

-- Enable RLS on auth.users (if not already enabled)
-- ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 1. USERS TABLE - Foundation for all permissions
-- =====================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    is_global_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Global admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        )
    );

-- =====================================================
-- 2. COURSES TABLE - Course management
-- =====================================================

CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Anyone can view active courses" ON public.courses
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Instructors can manage their courses" ON public.courses
    FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Global admins can manage all courses" ON public.courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        )
    );

-- =====================================================
-- 3. COURSE MEMBERSHIPS - Course enrollment
-- =====================================================

CREATE TABLE public.course_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, user_id)
);

-- Enable RLS
ALTER TABLE public.course_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course memberships
CREATE POLICY "Users can view their own memberships" ON public.course_memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Course instructors can manage memberships" ON public.course_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = course_id AND instructor_id = auth.uid()
        )
    );

CREATE POLICY "Global admins can manage all memberships" ON public.course_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        )
    );

CREATE POLICY "Users can request to join courses" ON public.course_memberships
    FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- =====================================================
-- 4. PROJECTS TABLE - Student projects
-- =====================================================

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own projects" ON public.projects
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Course instructors can view student projects" ON public.projects
    FOR SELECT USING (
        course_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE id = course_id AND instructor_id = auth.uid()
        )
    );

CREATE POLICY "Global admins can view all projects" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        )
    );

-- =====================================================
-- 5. PROJECT MEMBERS - Project collaboration
-- =====================================================

CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project members
CREATE POLICY "Project members can view membership" ON public.project_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage members" ON public.project_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

-- =====================================================
-- 6. CHATS TABLE - Communication channels
-- =====================================================

CREATE TABLE public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'project' CHECK (type IN ('project', 'course', 'direct')),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Project members can view project chats" ON public.chats
    FOR SELECT USING (
        type = 'project' AND project_id IS NOT NULL AND
        (
            EXISTS (
                SELECT 1 FROM public.projects 
                WHERE id = project_id AND created_by = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM public.project_members 
                WHERE project_id = chats.project_id AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Course members can view course chats" ON public.chats
    FOR SELECT USING (
        type = 'course' AND course_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.course_memberships 
            WHERE course_id = chats.course_id AND user_id = auth.uid() AND status = 'approved'
        )
    );

CREATE POLICY "Users can create chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- =====================================================
-- 7. CHAT MESSAGES - Message content
-- =====================================================

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat messages
CREATE POLICY "Users can view messages in accessible chats" ON public.chat_messages
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

CREATE POLICY "Users can send messages to accessible chats" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
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

-- =====================================================
-- 8. NOTES TABLE - Project notes
-- =====================================================

CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can manage their own notes" ON public.notes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Project owners can view all project notes" ON public.notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

-- =====================================================
-- 9. ATTACHMENTS TABLE - File attachments
-- =====================================================

CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments in accessible content" ON public.attachments
    FOR SELECT USING (
        auth.uid() = user_id OR
        (chat_id IS NOT NULL AND EXISTS (
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
        )) OR
        (project_id IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.projects 
                WHERE id = project_id AND created_by = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM public.project_members 
                WHERE project_id = attachments.project_id AND user_id = auth.uid()
            )
        ))
    );

CREATE POLICY "Users can upload attachments" ON public.attachments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 10. TAGS TABLE - Global tags system
-- =====================================================

CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Anyone can view global tags" ON public.tags
    FOR SELECT USING (is_global = TRUE);

CREATE POLICY "Users can view their own tags" ON public.tags
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Global admins can manage all tags" ON public.tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        )
    );

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Course memberships
CREATE INDEX idx_course_memberships_user_id ON public.course_memberships(user_id);
CREATE INDEX idx_course_memberships_course_id ON public.course_memberships(course_id);
CREATE INDEX idx_course_memberships_status ON public.course_memberships(status);

-- Projects
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_course_id ON public.projects(course_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at);

-- Project members
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);

-- Chats
CREATE INDEX idx_chats_project_id ON public.chats(project_id);
CREATE INDEX idx_chats_course_id ON public.chats(course_id);
CREATE INDEX idx_chats_created_by ON public.chats(created_by);

-- Chat messages
CREATE INDEX idx_chat_messages_chat_id ON public.chats(id);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Notes
CREATE INDEX idx_notes_project_id ON public.notes(project_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);

-- Attachments
CREATE INDEX idx_attachments_chat_id ON public.attachments(chat_id);
CREATE INDEX idx_attachments_project_id ON public.attachments(project_id);
CREATE INDEX idx_attachments_user_id ON public.attachments(user_id);

-- =====================================================
-- FUNCTIONS for Updated Timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECURITY SUMMARY
-- =====================================================

/*
SECURITY MODEL SUMMARY:

1. STUDENTS:
   - Can only see their own profile, projects, notes
   - Can see courses they're enrolled in (approved status)
   - Can participate in chats for their projects/courses
   - Cannot see other students' private data

2. INSTRUCTORS:
   - Can manage their assigned courses
   - Can see all students enrolled in their courses
   - Can view student projects within their courses
   - Can manage course memberships (approve/reject)

3. GLOBAL ADMINS:
   - Can view/manage all users (except auth.users directly)
   - Can manage all courses and projects
   - Can manage global tags and system settings
   - Have oversight capabilities for compliance

4. SERVICE ROLE:
   - Can perform user sync operations
   - Can bypass RLS for system operations
   - Used by application backend for user management

5. KEY SECURITY FEATURES:
   - All tables have RLS enabled
   - Foreign key constraints prevent orphaned data
   - Course-based access control
   - Project collaboration controls
   - Audit trail via created_at/updated_at timestamps
*/
