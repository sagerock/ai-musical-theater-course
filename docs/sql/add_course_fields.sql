-- Add missing fields to courses table
ALTER TABLE courses ADD COLUMN school TEXT;
ALTER TABLE courses ADD COLUMN instructor TEXT;
ALTER TABLE courses ADD COLUMN instructor_email TEXT;

-- Verify the new columns were added
\d courses;

-- Check if any existing courses need to be updated with default values
SELECT id, title, school, instructor, instructor_email FROM courses LIMIT 5;
EOF < /dev/null