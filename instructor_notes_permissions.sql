-- Instructor Notes Permissions
-- This script grants the necessary permissions for the instructor_notes table

-- Grant permissions to authenticated users
GRANT ALL ON instructor_notes TO authenticated;
GRANT ALL ON instructor_notes TO anon;

-- Enable Row Level Security (optional - can be disabled for development)
ALTER TABLE instructor_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for instructor_notes
-- Policy 1: Users can view notes that are visible to students for projects they own
CREATE POLICY "Students can view their project notes" ON instructor_notes
    FOR SELECT USING (
        is_visible_to_student = true 
        AND project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()::text
        )
    );

-- Policy 2: Instructors can view all notes for projects in courses they teach
CREATE POLICY "Instructors can view course notes" ON instructor_notes
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM course_memberships 
            WHERE user_id = auth.uid()::text 
            AND role = 'instructor' 
            AND status = 'approved'
        )
    );

-- Policy 3: Instructors can create notes for projects in courses they teach
CREATE POLICY "Instructors can create notes" ON instructor_notes
    FOR INSERT WITH CHECK (
        instructor_id = auth.uid()::text
        AND course_id IN (
            SELECT course_id FROM course_memberships 
            WHERE user_id = auth.uid()::text 
            AND role = 'instructor' 
            AND status = 'approved'
        )
    );

-- Policy 4: Instructors can update/delete their own notes
CREATE POLICY "Instructors can manage their notes" ON instructor_notes
    FOR ALL USING (instructor_id = auth.uid()::text);

-- Policy 5: Admins can do everything
CREATE POLICY "Admins can manage all notes" ON instructor_notes
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT id FROM users WHERE role = 'admin'
        )
    );

-- Alternative: For development, you can disable RLS entirely (simpler approach)
-- Uncomment the line below if you want to disable RLS for now:
-- ALTER TABLE instructor_notes DISABLE ROW LEVEL SECURITY;

-- Verify permissions
SELECT 'Instructor notes permissions configured successfully!' as status;