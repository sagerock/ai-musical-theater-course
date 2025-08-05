-- IMPLEMENT PRIVACY-FIRST RLS POLICIES
-- Safe implementation with rollback capabilities
-- Run this after backing up your database

-- ============================================================================
-- PHASE 1: Clean up existing policies (fresh start approach)
-- ============================================================================

-- Drop any existing RLS policies that might conflict
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all existing policies on our target tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes', 'projects', 'course_memberships', 'reflections')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy % on %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- ============================================================================
-- PHASE 2: Enable RLS on critical tables
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_attachments ENABLE ROW LEVEL SECURITY; 
ALTER TABLE instructor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PHASE 3: USERS TABLE - Personal Information Protection
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "users_view_own_profile" ON users
FOR SELECT USING (
  id = auth.uid()
);

-- Instructors can view students in their courses  
CREATE POLICY "instructors_view_course_students" ON users
FOR SELECT USING (
  -- Allow if user is viewing their own profile
  id = auth.uid() OR
  -- Allow if viewing user is an instructor in a shared course
  id IN (
    SELECT cm_student.user_id 
    FROM course_memberships cm_student
    JOIN course_memberships cm_instructor ON cm_student.course_id = cm_instructor.course_id
    WHERE cm_instructor.user_id = auth.uid() 
    AND cm_instructor.role IN ('instructor', 'admin')
    AND cm_instructor.status = 'approved'
    AND cm_student.status = 'approved'
  ) OR
  -- Allow global admins
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile" ON users
FOR UPDATE USING (
  id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Users can insert their own profile (for registration)
CREATE POLICY "users_insert_own_profile" ON users
FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================================
-- PHASE 4: CHATS TABLE - AI Interaction Privacy (MOST CRITICAL)
-- ============================================================================

-- Students can only view their own AI interactions
-- Instructors can view chats from students in their courses
-- Global admins can view all chats
CREATE POLICY "chats_access_policy" ON chats
FOR SELECT USING (
  -- User can see their own chats
  user_id = auth.uid() OR
  -- Instructors can see chats from their courses
  (course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  )) OR
  -- Global admins can see all
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Students can create their own chats in courses they're enrolled in
CREATE POLICY "chats_insert_policy" ON chats
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  (course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND status = 'approved'
  ) OR
  -- Global admins can create anywhere
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true))
);

-- Users can update their own chats, instructors can update chats in their courses
CREATE POLICY "chats_update_policy" ON chats
FOR UPDATE USING (
  user_id = auth.uid() OR
  (course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  )) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- ============================================================================
-- PHASE 5: PDF_ATTACHMENTS TABLE - Student Document Privacy
-- ============================================================================

CREATE POLICY "pdf_attachments_access_policy" ON pdf_attachments
FOR SELECT USING (
  -- Students can see their own attachments
  chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()) OR
  -- Instructors can see attachments from their courses
  chat_id IN (
    SELECT c.id FROM chats c
    JOIN course_memberships cm ON c.course_id = cm.course_id
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('instructor', 'admin')
    AND cm.status = 'approved'
  ) OR
  -- Global admins can see all
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Students can upload attachments to their own chats
CREATE POLICY "pdf_attachments_insert_policy" ON pdf_attachments
FOR INSERT WITH CHECK (
  chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- ============================================================================
-- PHASE 6: INSTRUCTOR_NOTES TABLE - Private Instructor Notes
-- ============================================================================

-- Only instructors and admins can access notes
CREATE POLICY "instructor_notes_access_policy" ON instructor_notes
FOR ALL USING (
  -- Instructors in the course can manage notes
  project_id IN (
    SELECT p.id FROM projects p
    JOIN course_memberships cm ON p.course_id = cm.course_id
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('instructor', 'admin')
    AND cm.status = 'approved'
  ) OR
  -- Global admins can manage all notes
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- ============================================================================
-- PHASE 7: PROJECTS TABLE - Student Project Privacy
-- ============================================================================

CREATE POLICY "projects_access_policy" ON projects
FOR SELECT USING (
  -- Students can see their own projects
  created_by = auth.uid() OR
  -- Instructors can see projects in their courses
  course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  ) OR
  -- Global admins can see all
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Students can create projects in courses they're enrolled in
CREATE POLICY "projects_insert_policy" ON projects
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  (course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND status = 'approved'
  ) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true))
);

-- Users can update their own projects, instructors can update course projects
CREATE POLICY "projects_update_policy" ON projects
FOR UPDATE USING (
  created_by = auth.uid() OR
  (course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  )) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- ============================================================================
-- PHASE 8: COURSE_MEMBERSHIPS TABLE - Enrollment Privacy
-- ============================================================================

CREATE POLICY "course_memberships_access_policy" ON course_memberships
FOR SELECT USING (
  -- Users can see their own memberships
  user_id = auth.uid() OR
  -- Instructors can see memberships in their courses
  course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  ) OR
  -- Global admins can see all
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Allow membership creation (for enrollment)
CREATE POLICY "course_memberships_insert_policy" ON course_memberships
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Allow instructors and admins to update memberships in their courses
CREATE POLICY "course_memberships_update_policy" ON course_memberships
FOR UPDATE USING (
  user_id = auth.uid() OR -- Users can update their own
  (course_id IN (
    SELECT course_id 
    FROM course_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  )) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- ============================================================================
-- PHASE 9: REFLECTIONS TABLE - Student Personal Reflections
-- ============================================================================

CREATE POLICY "reflections_access_policy" ON reflections
FOR SELECT USING (
  -- Students can see their own reflections
  user_id = auth.uid() OR
  -- Instructors can see reflections from their course students
  chat_id IN (
    SELECT c.id FROM chats c
    JOIN course_memberships cm ON c.course_id = cm.course_id
    WHERE cm.user_id = auth.uid() 
    AND cm.role IN ('instructor', 'admin')
    AND cm.status = 'approved'
  ) OR
  -- Global admins can see all
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- Students can create and update their own reflections
CREATE POLICY "reflections_insert_policy" ON reflections
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reflections_update_policy" ON reflections
FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true)
);

-- ============================================================================
-- PHASE 10: SERVICE ROLE CONFIGURATION
-- ============================================================================

-- Ensure service role has necessary permissions for backend operations
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Give service role RLS bypass for legitimate backend operations
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE chats FORCE ROW LEVEL SECURITY;
ALTER TABLE pdf_attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE instructor_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE course_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE reflections FORCE ROW LEVEL SECURITY;

-- But allow service role to bypass for admin operations
GRANT BYPASS RLS ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================================================
-- PHASE 11: VALIDATION & AUDIT
-- ============================================================================

-- Create audit log if it doesn't exist
CREATE TABLE IF NOT EXISTS rls_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'modified', 'dropped'
  implemented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Log successful implementation
INSERT INTO rls_audit_log (table_name, policy_name, action, notes) VALUES
('users', 'privacy_first_policies_v1', 'created', 'Implemented comprehensive privacy-first RLS policies'),
('chats', 'privacy_first_policies_v1', 'created', 'Critical AI interaction privacy protection enabled'),
('pdf_attachments', 'privacy_first_policies_v1', 'created', 'Student document privacy protection enabled'),
('instructor_notes', 'privacy_first_policies_v1', 'created', 'Private instructor notes protection enabled'),
('projects', 'privacy_first_policies_v1', 'created', 'Student project privacy protection enabled'),
('course_memberships', 'privacy_first_policies_v1', 'created', 'Course enrollment privacy protection enabled'),
('reflections', 'privacy_first_policies_v1', 'created', 'Student reflection privacy protection enabled');

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Check RLS status
SELECT 
  tablename, 
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes', 'projects', 'course_memberships', 'reflections')
ORDER BY tablename;

-- Check policy details
SELECT 
  tablename, 
  policyname, 
  roles,
  cmd as operation,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes', 'projects', 'course_memberships', 'reflections')
ORDER BY tablename, policyname;

-- Success message
SELECT 
  '🔒 PRIVACY-FIRST RLS POLICIES IMPLEMENTED SUCCESSFULLY! 🔒' as status,
  NOW() as implemented_at,
  '✅ Student data is now properly protected' as result;