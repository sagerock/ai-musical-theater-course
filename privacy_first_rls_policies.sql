-- Privacy-First RLS Policies for AI Engagement Hub
-- Designed to protect student privacy while enabling instructor oversight

-- ============================================================================
-- CRITICAL: Enable RLS on all privacy-sensitive tables
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE - Personal Information Protection
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "users_view_own_profile" ON users
FOR SELECT USING (
  id = auth.uid()
);

-- Instructors can view students in their courses  
CREATE POLICY "instructors_view_course_students" ON users
FOR SELECT USING (
  id IN (
    SELECT cm_student.user_id 
    FROM course_memberships cm_student
    JOIN course_memberships cm_instructor ON cm_student.course_id = cm_instructor.course_id
    WHERE cm_instructor.user_id = auth.uid() 
    AND cm_instructor.role IN ('instructor', 'admin')
    AND cm_instructor.status = 'approved'
    AND cm_student.status = 'approved'
  )
);

-- Global admins can view all users
CREATE POLICY "global_admins_view_all_users" ON users
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile" ON users
FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- CHATS TABLE - AI Interaction Privacy (MOST CRITICAL)
-- ============================================================================

-- Students can only view their own AI interactions
CREATE POLICY "students_view_own_chats" ON chats
FOR SELECT USING (
  user_id = auth.uid()
);

-- Instructors can view chats from students in their courses
CREATE POLICY "instructors_view_course_chats" ON chats
FOR SELECT USING (
  course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  )
);

-- Global admins can view all chats
CREATE POLICY "global_admins_view_all_chats" ON chats
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Students can create their own chats
CREATE POLICY "students_create_own_chats" ON chats
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role = 'student'
    AND status = 'approved'
  )
);

-- ============================================================================
-- PDF_ATTACHMENTS TABLE - Student Document Privacy
-- ============================================================================

-- Students can view their own uploaded documents
CREATE POLICY "students_view_own_attachments" ON pdf_attachments
FOR SELECT USING (
  chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
);

-- Instructors can view attachments from students in their courses
CREATE POLICY "instructors_view_course_attachments" ON pdf_attachments
FOR SELECT USING (
  chat_id IN (
    SELECT c.id FROM chats c
    JOIN course_memberships cm ON c.course_id = cm.course_id
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('instructor', 'admin')
    AND cm.status = 'approved'
  )
);

-- Global admins can view all attachments
CREATE POLICY "global_admins_view_all_attachments" ON pdf_attachments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Students can upload attachments to their own chats
CREATE POLICY "students_upload_own_attachments" ON pdf_attachments
FOR INSERT WITH CHECK (
  chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
);

-- ============================================================================
-- INSTRUCTOR_NOTES TABLE - Private Instructor Notes
-- ============================================================================

-- Only instructors can view/create notes in their courses
CREATE POLICY "instructors_manage_course_notes" ON instructor_notes
FOR ALL USING (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN course_memberships cm ON p.course_id = cm.course_id
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('instructor', 'admin')
    AND cm.status = 'approved'
  )
);

-- Global admins can view all notes
CREATE POLICY "global_admins_view_all_notes" ON instructor_notes
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- ============================================================================
-- PROJECTS TABLE - Student Project Privacy
-- ============================================================================

-- Students can view their own projects
CREATE POLICY "students_view_own_projects" ON projects
FOR SELECT USING (
  created_by = auth.uid()
);

-- Instructors can view projects in their courses
CREATE POLICY "instructors_view_course_projects" ON projects
FOR SELECT USING (
  course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  )
);

-- Global admins can view all projects
CREATE POLICY "global_admins_view_all_projects" ON projects
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Students can create projects in their enrolled courses
CREATE POLICY "students_create_course_projects" ON projects
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND status = 'approved'
  )
);

-- ============================================================================
-- COURSE_MEMBERSHIPS TABLE - Enrollment Privacy
-- ============================================================================

-- Users can view their own memberships
CREATE POLICY "users_view_own_memberships" ON course_memberships
FOR SELECT USING (
  user_id = auth.uid()
);

-- Instructors can view memberships in their courses
CREATE POLICY "instructors_view_course_memberships" ON course_memberships
FOR SELECT USING (
  course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  )
);

-- Global admins can view all memberships
CREATE POLICY "global_admins_view_all_memberships" ON course_memberships
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- ============================================================================
-- REFLECTIONS TABLE - Student Personal Reflections
-- ============================================================================

-- Students can only view their own reflections
CREATE POLICY "students_view_own_reflections" ON reflections
FOR SELECT USING (
  user_id = auth.uid()
);

-- Instructors can view reflections from their course students
CREATE POLICY "instructors_view_course_reflections" ON reflections
FOR SELECT USING (
  chat_id IN (
    SELECT c.id FROM chats c
    JOIN course_memberships cm ON c.course_id = cm.course_id
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('instructor', 'admin')
    AND cm.status = 'approved'
  )
);

-- Students can create their own reflections
CREATE POLICY "students_create_own_reflections" ON reflections
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Students can update their own reflections
CREATE POLICY "students_update_own_reflections" ON reflections
FOR UPDATE USING (
  user_id = auth.uid()
);

-- ============================================================================
-- SERVICE ROLE BYPASS - For backend operations
-- ============================================================================

-- Grant service role bypass privileges for legitimate backend operations
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- ============================================================================
-- AUDIT LOG - Track policy changes
-- ============================================================================

-- Create audit table for RLS policy changes
CREATE TABLE IF NOT EXISTS rls_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'modified', 'dropped'
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log this initial policy deployment
INSERT INTO rls_audit_log (table_name, policy_name, action, changed_by) VALUES
('users', 'privacy_first_policies', 'created', (SELECT id FROM users WHERE is_global_admin = true LIMIT 1)),
('chats', 'privacy_first_policies', 'created', (SELECT id FROM users WHERE is_global_admin = true LIMIT 1)),
('pdf_attachments', 'privacy_first_policies', 'created', (SELECT id FROM users WHERE is_global_admin = true LIMIT 1)),
('instructor_notes', 'privacy_first_policies', 'created', (SELECT id FROM users WHERE is_global_admin = true LIMIT 1)),
('projects', 'privacy_first_policies', 'created', (SELECT id FROM users WHERE is_global_admin = true LIMIT 1)),
('course_memberships', 'privacy_first_policies', 'created', (SELECT id FROM users WHERE is_global_admin = true LIMIT 1)),
('reflections', 'privacy_first_policies', 'created', (SELECT id FROM users WHERE is_global_admin = true LIMIT 1));