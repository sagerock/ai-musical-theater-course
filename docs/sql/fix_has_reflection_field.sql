-- Fix has_reflection field for all existing chats
-- This script updates the has_reflection field based on actual reflection data

UPDATE chats 
SET has_reflection = (
  SELECT COUNT(*) > 0 
  FROM reflections 
  WHERE reflections.chat_id = chats.id
);

-- Verify the update
SELECT 
  COUNT(*) as total_chats,
  SUM(CASE WHEN has_reflection = true THEN 1 ELSE 0 END) as chats_with_reflections,
  SUM(CASE WHEN has_reflection = false THEN 1 ELSE 0 END) as chats_without_reflections
FROM chats;

-- Double-check by comparing with actual reflection counts
SELECT 
  chats.id,
  chats.has_reflection,
  COUNT(reflections.id) as actual_reflections_count,
  (COUNT(reflections.id) > 0) as should_have_reflection,
  CASE 
    WHEN chats.has_reflection = (COUNT(reflections.id) > 0) THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as status
FROM chats
LEFT JOIN reflections ON reflections.chat_id = chats.id
GROUP BY chats.id, chats.has_reflection
ORDER BY status DESC, chats.id;