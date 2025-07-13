-- Update Global Tags to General Project Management Tags
-- This script replaces the current global tags with more universal ones

-- Step 1: Clear existing global tags (course_id IS NULL)
DELETE FROM tags WHERE course_id IS NULL;

-- Step 2: Insert new general project management tags (course_id will be NULL for global tags)
INSERT INTO tags (name, description) VALUES
    ('Research', 'Research and information gathering'),
    ('Planning', 'Project planning and organization'),
    ('Brainstorming', 'Idea generation and creative thinking'),
    ('Problem Solving', 'Working through challenges and obstacles'),
    ('Analysis', 'Data analysis and evaluation'),
    ('Writing', 'Content creation and writing assistance'),
    ('Editing', 'Revision and improvement of work'),
    ('Collaboration', 'Group work and team coordination'),
    ('Presentation', 'Preparing presentations and reports'),
    ('Review', 'Reviewing and feedback on work'),
    ('Documentation', 'Creating documentation and records'),
    ('Learning', 'Acquiring new knowledge and skills'),
    ('Synthesis', 'Combining ideas and information'),
    ('Critical Thinking', 'Analysis and evaluation of concepts'),
    ('Creative Process', 'Creative development and exploration');

-- Step 3: Verify the new tags
SELECT 'Updated global tags successfully!' as status;

-- Step 4: Show the new global tags
SELECT name, description 
FROM tags 
WHERE course_id IS NULL 
ORDER BY name;