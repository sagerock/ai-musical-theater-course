-- Instructor Notes Schema
-- This creates a system for instructors to leave notes on student projects

-- Create instructor_notes table
CREATE TABLE instructor_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    instructor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_visible_to_student BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_instructor_notes_project_id ON instructor_notes(project_id);
CREATE INDEX idx_instructor_notes_instructor_id ON instructor_notes(instructor_id);
CREATE INDEX idx_instructor_notes_course_id ON instructor_notes(course_id);
CREATE INDEX idx_instructor_notes_created_at ON instructor_notes(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_instructor_notes_updated_at 
    BEFORE UPDATE ON instructor_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 'Instructor notes schema created successfully!' as status;

-- Show the table structure
\d instructor_notes;