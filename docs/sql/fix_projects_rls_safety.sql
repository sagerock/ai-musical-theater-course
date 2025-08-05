-- MAKE PROJECTS RLS POLICIES SAFER TO AVOID POTENTIAL RECURSION

-- ============================================================================
-- SAFER PROJECTS POLICIES - AVOID COMPLEX JOINS THAT COULD CAUSE RECURSION
-- ============================================================================

-- Drop existing projects policies
DROP POLICY IF EXISTS "projects_access_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;  
DROP POLICY IF EXISTS "projects_update_policy" ON projects;

-- ============================================================================
-- CREATE SAFER PROJECTS POLICIES
-- ============================================================================

-- Users can see their own projects (direct ownership check - no recursion risk)
CREATE POLICY "projects_own_access" ON projects
FOR SELECT USING (
  created_by::text = auth.uid()::text
);

-- Global admins can see all projects
CREATE POLICY "projects_admin_access" ON projects
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_global_admin = true)
);

-- Instructors can see projects in their courses (using function to be safe)
CREATE OR REPLACE FUNCTION can_access_course_projects(target_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is an instructor in this course
  RETURN EXISTS (
    SELECT 1 FROM course_memberships 
    WHERE course_id = target_course_id 
    AND user_id::text = auth.uid()::text 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "projects_instructor_course_access" ON projects
FOR SELECT USING (
  can_access_course_projects(course_id)
);

-- Students can create projects in courses they're enrolled in
CREATE POLICY "projects_create_enrolled" ON projects
FOR INSERT WITH CHECK (
  created_by::text = auth.uid()::text AND
  (EXISTS (
    SELECT 1 FROM course_memberships 
    WHERE course_id = projects.course_id 
    AND user_id::text = auth.uid()::text 
    AND status = 'approved'
  ) OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_global_admin = true))
);

-- Users can update their own projects, instructors can update course projects
CREATE POLICY "projects_update_policy" ON projects
FOR UPDATE USING (
  created_by::text = auth.uid()::text OR
  can_access_course_projects(course_id) OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_global_admin = true)
);

-- ============================================================================
-- VERIFY PROJECTS POLICIES
-- ============================================================================

SELECT 
  'Fixed Projects Policies' as status,
  count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'projects';

SELECT 
  '🔧 PROJECTS RLS MADE SAFER! 🔧' as status,
  NOW() as fixed_at,
  'Reduced recursion risk with helper functions' as improvement;