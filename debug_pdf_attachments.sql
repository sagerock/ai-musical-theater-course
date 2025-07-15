-- Debug PDF attachments for instructor dashboard
-- This will help understand why PDFs aren't showing up

-- 1. Check if there are any PDF attachments in the database
SELECT 
  'Total PDF attachments in database:' as info,
  COUNT(*) as count
FROM pdf_attachments;

-- 2. Show all PDF attachments with their details
SELECT 
  'All PDF attachments:' as info,
  id,
  chat_id,
  file_name,
  file_size,
  created_at
FROM pdf_attachments
ORDER BY created_at DESC;

-- 3. Check the chat relationships
SELECT 
  'PDF attachments with chat details:' as info,
  pa.id as attachment_id,
  pa.file_name,
  pa.created_at as attachment_created,
  c.id as chat_id,
  c.user_id,
  c.project_id,
  c.course_id,
  c.created_at as chat_created
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id
ORDER BY pa.created_at DESC;

-- 4. Check projects with course relationships
SELECT 
  'Projects with course info:' as info,
  p.id as project_id,
  p.title,
  p.course_id,
  p.created_by
FROM projects p
WHERE p.id IN (
  SELECT DISTINCT c.project_id 
  FROM pdf_attachments pa
  JOIN chats c ON pa.chat_id = c.id
  WHERE c.project_id IS NOT NULL
);

-- 5. Check users associated with PDF attachments
SELECT 
  'Users who uploaded PDFs:' as info,
  u.id as user_id,
  u.name,
  u.email
FROM users u
WHERE u.id IN (
  SELECT DISTINCT c.user_id 
  FROM pdf_attachments pa
  JOIN chats c ON pa.chat_id = c.id
  WHERE c.user_id IS NOT NULL
);

-- 6. Full join to see the complete picture
SELECT 
  'Complete PDF attachment data:' as info,
  pa.file_name,
  pa.created_at as pdf_uploaded,
  c.prompt,
  c.course_id,
  p.title as project_title,
  u.name as user_name,
  u.email as user_email
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id
LEFT JOIN projects p ON c.project_id = p.id
LEFT JOIN users u ON c.user_id = u.id
ORDER BY pa.created_at DESC;