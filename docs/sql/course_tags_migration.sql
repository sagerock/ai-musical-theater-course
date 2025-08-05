-- Course-Specific Tags Migration
-- This script updates the tags table to be course-specific

-- Step 1: Add course_id column to tags table (UUID type to match courses.id)
ALTER TABLE tags ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Step 2: Create index for better performance
CREATE INDEX idx_tags_course_id ON tags(course_id);

-- Step 3: Create unique constraint for tag names within courses
-- (removes the global unique constraint and makes it course-specific)
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
ALTER TABLE tags ADD CONSTRAINT unique_tag_name_per_course UNIQUE (name, course_id);

-- Step 4: Keep some global tags by setting course_id to NULL for existing tags
-- (These will be available across all courses)
UPDATE tags SET course_id = NULL WHERE course_id IS NULL;

-- Step 5: Add some default course-specific tags for existing courses
-- (This will be handled programmatically in the API)

-- Step 6: Create view for instructors to see all relevant tags (global + course-specific)
CREATE OR REPLACE VIEW instructor_tags AS
SELECT 
  t.*,
  c.name as course_name,
  CASE 
    WHEN t.course_id IS NULL THEN 'Global'
    ELSE c.name
  END as tag_scope
FROM tags t
LEFT JOIN courses c ON t.course_id = c.id;

-- Step 7: Update the tag API functions will be handled in JavaScript
SELECT 'Course tags migration completed!' as status;