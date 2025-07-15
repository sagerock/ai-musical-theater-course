-- Test direct queries to understand the data structure
-- This will help us get user and project data without going through chats

-- 1. Check what's in pdf_attachments table
SELECT 
  'PDF attachments structure:' as info,
  id,
  chat_id,
  file_name,
  file_size,
  created_at
FROM pdf_attachments
ORDER BY created_at DESC;

-- 2. Check what's in chats table (if accessible)
SELECT 
  'Chats table structure:' as info,
  id,
  user_id,
  project_id,
  course_id,
  prompt,
  created_at
FROM chats
WHERE id IN (
  SELECT chat_id FROM pdf_attachments
)
ORDER BY created_at DESC;

-- 3. Check users table
SELECT 
  'Users table:' as info,
  id,
  name,
  email,
  created_at
FROM users
WHERE id IN (
  SELECT user_id FROM chats WHERE id IN (
    SELECT chat_id FROM pdf_attachments
  )
)
ORDER BY created_at DESC;

-- 4. Check projects table
SELECT 
  'Projects table:' as info,
  id,
  title,
  created_by,
  course_id,
  created_at
FROM projects
WHERE id IN (
  SELECT project_id FROM chats WHERE id IN (
    SELECT chat_id FROM pdf_attachments
  )
)
ORDER BY created_at DESC;

-- 5. Try to get all data in one query (this might fail due to permissions)
SELECT 
  'Complete data:' as info,
  pa.file_name,
  pa.created_at as pdf_created,
  c.prompt,
  c.course_id,
  u.name as user_name,
  u.email as user_email,
  p.title as project_title
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN projects p ON c.project_id = p.id
ORDER BY pa.created_at DESC;