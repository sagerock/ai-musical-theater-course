-- Multi-Tenant Course System Schema Updates

-- 1. Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  semester VARCHAR(50), -- "Spring", "Fall", "Summer"
  year INTEGER,
  course_code VARCHAR(20) UNIQUE NOT NULL, -- "MT-SP25", "DT-F25"
  created_by UUID REFERENCES users(id) ON DELETE CASCADE, -- Admin who created it
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create course_memberships table (replaces simple user roles)
CREATE TABLE IF NOT EXISTS course_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id), -- Who approved them
  UNIQUE(course_id, user_id)
);

-- 3. Add course_id to existing tables for data isolation
ALTER TABLE projects ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- 4. Update users table to include global admin role
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_global_admin BOOLEAN DEFAULT false;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_course_memberships_course ON course_memberships(course_id);
CREATE INDEX IF NOT EXISTS idx_course_memberships_user ON course_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_course_memberships_status ON course_memberships(status);
CREATE INDEX IF NOT EXISTS idx_projects_course ON projects(course_id);
CREATE INDEX IF NOT EXISTS idx_chats_course ON chats(course_id);

-- 6. Create views for easier querying
CREATE OR REPLACE VIEW course_members_view AS
SELECT 
  cm.*,
  u.name as user_name,
  u.email as user_email,
  c.name as course_name,
  c.course_code
FROM course_memberships cm
JOIN users u ON cm.user_id = u.id
JOIN courses c ON cm.course_id = c.id;

-- 7. RLS (Row Level Security) policies for course data isolation
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_memberships ENABLE ROW LEVEL SECURITY;

-- Allow users to see courses they're members of
CREATE POLICY "Users can view their courses" ON courses FOR SELECT 
USING (
  id IN (
    SELECT course_id FROM course_memberships 
    WHERE user_id = auth.uid() AND status = 'approved'
  ) OR
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true
  )
);

-- Allow users to see their own course memberships
CREATE POLICY "Users can view their memberships" ON course_memberships FOR SELECT 
USING (
  user_id = auth.uid() OR
  course_id IN (
    SELECT course_id FROM course_memberships 
    WHERE user_id = auth.uid() AND role IN ('instructor', 'admin') AND status = 'approved'
  ) OR
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_global_admin = true
  )
);

-- 8. Sample data for testing
INSERT INTO courses (name, description, semester, year, course_code, created_by) 
VALUES 
  ('Musical Theater AI - Spring 2025', 'Exploring AI tools in musical theater production', 'Spring', 2025, 'MT-SP25', (SELECT id FROM users WHERE is_global_admin = true LIMIT 1))
ON CONFLICT (course_code) DO NOTHING;

-- 9. Function to generate unique course codes
CREATE OR REPLACE FUNCTION generate_course_code(course_name TEXT, semester TEXT, year INTEGER)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate base code from course name and semester/year
  base_code := UPPER(LEFT(REGEXP_REPLACE(course_name, '[^A-Za-z]', '', 'g'), 2)) || 
               '-' || 
               CASE 
                 WHEN semester = 'Spring' THEN 'SP'
                 WHEN semester = 'Fall' THEN 'F'
                 WHEN semester = 'Summer' THEN 'SU'
                 ELSE 'XX'
               END ||
               RIGHT(year::TEXT, 2);
  
  final_code := base_code;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM courses WHERE course_code = final_code) LOOP
    final_code := base_code || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;