-- Quick query to view contact requests
SELECT 
  id,
  name,
  email,
  organization,
  role,
  LEFT(message, 100) as message_preview,
  status,
  created_at
FROM contact_requests
ORDER BY created_at DESC;