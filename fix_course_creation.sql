-- =============================================================================
-- FIX COURSE CREATION ISSUES
-- =============================================================================

-- 1. Fix RLS on courses table for admin access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see courses they are members of" ON courses;
DROP POLICY IF EXISTS "Users can view courses they are members of" ON courses;
DROP POLICY IF EXISTS "Only instructors can create courses" ON courses;

-- Create admin-friendly RLS policies for courses
CREATE POLICY "Admins can do everything on courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_global_admin = true
    )
  );

CREATE POLICY "Course members can view courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_memberships 
      WHERE course_memberships.course_id = courses.id 
      AND course_memberships.user_id = auth.uid()
      AND course_memberships.status = 'approved'
    )
  );

CREATE POLICY "Instructors can create courses" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.role = 'instructor' OR users.is_global_admin = true)
    )
  );

-- 2. Create the missing generate_course_code RPC function
CREATE OR REPLACE FUNCTION generate_course_code(
  course_name TEXT,
  semester TEXT,
  year INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 1;
  code_exists BOOLEAN;
BEGIN
  -- Generate base code from course name (first 3 letters + semester + year)
  base_code := UPPER(LEFT(REGEXP_REPLACE(course_name, '[^A-Za-z]', '', 'g'), 3)) || 
               UPPER(LEFT(semester, 2)) || 
               RIGHT(year::TEXT, 2);
  
  -- Ensure we have at least 3 characters from course name
  IF LENGTH(REGEXP_REPLACE(course_name, '[^A-Za-z]', '', 'g')) < 3 THEN
    base_code := UPPER(LEFT(REGEXP_REPLACE(course_name || 'XXX', '[^A-Za-z]', '', 'g'), 3)) || 
                 UPPER(LEFT(semester, 2)) || 
                 RIGHT(year::TEXT, 2);
  END IF;
  
  final_code := base_code;
  
  -- Check if code already exists and increment if needed
  LOOP
    SELECT EXISTS(SELECT 1 FROM courses WHERE course_code = final_code) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
    
    final_code := base_code || LPAD(counter::TEXT, 2, '0');
    counter := counter + 1;
    
    -- Prevent infinite loop
    IF counter > 99 THEN
      final_code := base_code || TO_CHAR(EXTRACT(EPOCH FROM NOW())::INTEGER % 1000, 'FM000');
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_code;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_course_code(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_course_code(TEXT, TEXT, INTEGER) TO anon;

-- 3. Ensure courses table has all required columns
-- Check if we need to add any missing columns
DO $$
BEGIN
  -- Add course_code column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'course_code') THEN
    ALTER TABLE courses ADD COLUMN course_code TEXT UNIQUE;
  END IF;
  
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'created_by') THEN
    ALTER TABLE courses ADD COLUMN created_by UUID REFERENCES users(id);
  END IF;
  
  -- Add semester column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'semester') THEN
    ALTER TABLE courses ADD COLUMN semester TEXT DEFAULT 'Spring';
  END IF;
  
  -- Add year column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'courses' AND column_name = 'year') THEN
    ALTER TABLE courses ADD COLUMN year INTEGER DEFAULT EXTRACT(YEAR FROM NOW());
  END IF;
END $$;

-- 4. Create index on course_code for performance
CREATE INDEX IF NOT EXISTS idx_courses_course_code ON courses(course_code);

-- 5. Test the function
SELECT generate_course_code('Introduction to Computer Science', 'Spring', 2025) as sample_code;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check RLS policies on courses
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'courses';

-- Check if function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'generate_course_code';

-- Check courses table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

RUN THIS SCRIPT TO FIX COURSE CREATION:

1. Fixes RLS policies to allow admin access to courses
2. Creates the missing generate_course_code RPC function
3. Ensures all required columns exist in courses table
4. Adds proper indexes for performance

AFTER RUNNING:
- Admin should be able to view all courses
- Course creation should work without 404/403 errors
- Course codes will be automatically generated
- All course CRUD operations should work

*/
