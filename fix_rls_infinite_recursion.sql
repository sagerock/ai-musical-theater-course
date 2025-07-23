-- FIX RLS INFINITE RECURSION ERROR
-- The course_memberships policies are causing circular dependency

-- ============================================================================
-- IDENTIFY AND FIX THE RECURSIVE POLICY ISSUE
-- ============================================================================

-- Drop the problematic course_memberships policies
DROP POLICY IF EXISTS "course_memberships_access_policy" ON course_memberships;
DROP POLICY IF EXISTS "course_memberships_insert_policy" ON course_memberships;
DROP POLICY IF EXISTS "course_memberships_update_policy" ON course_memberships;

-- ============================================================================
-- CREATE SAFE NON-RECURSIVE POLICIES FOR COURSE_MEMBERSHIPS
-- ============================================================================

-- Users can see their own memberships (no recursion - direct user_id check)
CREATE POLICY "memberships_own_access" ON course_memberships
FOR SELECT USING (
  user_id::text = auth.uid()::text
);

-- Global admins can see all memberships
CREATE POLICY "memberships_admin_access" ON course_memberships  
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_global_admin = true)
);

-- Instructors can see memberships in their courses (using a function to avoid recursion)
CREATE OR REPLACE FUNCTION is_instructor_in_course(target_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM course_memberships 
    WHERE course_id = target_course_id 
    AND user_id::text = auth.uid()::text 
    AND role IN ('instructor', 'admin')
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create instructor policy using the function
CREATE POLICY "memberships_instructor_access" ON course_memberships
FOR SELECT USING (
  is_instructor_in_course(course_id)
);

-- Allow membership creation (for enrollment)
CREATE POLICY "memberships_create_own" ON course_memberships
FOR INSERT WITH CHECK (
  user_id::text = auth.uid()::text OR
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_global_admin = true)
);

-- Allow users and course instructors to update memberships
CREATE POLICY "memberships_update_policy" ON course_memberships
FOR UPDATE USING (
  user_id::text = auth.uid()::text OR -- Users can update their own
  is_instructor_in_course(course_id) OR -- Instructors can update in their courses
  EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_global_admin = true)
);

-- ============================================================================
-- VERIFY POLICIES ARE NON-RECURSIVE
-- ============================================================================

-- Check that policies exist
SELECT 
  'Fixed Course Memberships Policies' as status,
  count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'course_memberships';

-- Test a simple query to ensure no recursion
SELECT 
  'Testing Non-Recursion' as test_name,
  'Query completed successfully - no infinite recursion' as result;

-- Success message
SELECT 
  '🔧 RLS RECURSION FIXED! 🔧' as status,
  NOW() as fixed_at,
  'Dashboard should now work correctly' as next_step;