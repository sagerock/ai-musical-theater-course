-- Course-Specific Tags Migration (FIXED VERSION)
-- This script updates the tags table to be course-specific

-- Step 1: Add course_id column to tags table (UUID type to match courses.id)
ALTER TABLE tags ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Step 2: Create index for better performance
CREATE INDEX idx_tags_course_id ON tags(course_id);

-- Step 3: Create unique constraint for tag names within courses
-- (removes the global unique constraint and makes it course-specific)
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
ALTER TABLE tags ADD CONSTRAINT unique_tag_name_per_course UNIQUE (name, course_id);

-- Step 4: Keep existing tags as global tags (course_id = NULL)
-- All existing tags will remain available to all courses
-- No UPDATE needed since course_id defaults to NULL

-- Step 5: Verify the migration worked
SELECT 'Course tags migration completed successfully!' as status;

-- Step 6: Show current tags structure
SELECT 
  COUNT(*) as total_tags,
  COUNT(course_id) as course_specific_tags,
  COUNT(*) - COUNT(course_id) as global_tags
FROM tags;