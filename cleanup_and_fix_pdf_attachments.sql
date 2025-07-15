-- Clean up orphaned PDF attachments and fix foreign key relationship
-- This will resolve the foreign key constraint violation

-- 1. First, let's see what data exists in pdf_attachments
SELECT 
  'Current pdf_attachments data:' as info,
  COUNT(*) as total_records,
  COUNT(DISTINCT chat_id) as unique_chat_ids
FROM pdf_attachments;

-- 2. Check which chat_ids in pdf_attachments don't exist in chats table
SELECT 
  'Orphaned chat_ids in pdf_attachments:' as info,
  pa.chat_id,
  COUNT(*) as attachment_count
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id
WHERE c.id IS NULL
GROUP BY pa.chat_id;

-- 3. Show valid chat_ids that do exist
SELECT 
  'Valid chat_ids in pdf_attachments:' as info,
  pa.chat_id,
  COUNT(*) as attachment_count
FROM pdf_attachments pa
INNER JOIN chats c ON pa.chat_id = c.id
GROUP BY pa.chat_id;

-- 4. Delete orphaned PDF attachments (those with chat_ids not in chats table)
DELETE FROM pdf_attachments 
WHERE chat_id NOT IN (
  SELECT id FROM chats
);

-- 5. Show what's left after cleanup
SELECT 
  'After cleanup:' as info,
  COUNT(*) as remaining_records,
  COUNT(DISTINCT chat_id) as unique_chat_ids
FROM pdf_attachments;

-- 6. Now add the foreign key constraint (should work now)
ALTER TABLE pdf_attachments 
ADD CONSTRAINT fk_pdf_attachments_chat_id 
FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

-- 7. Add index for performance
CREATE INDEX IF NOT EXISTS idx_pdf_attachments_chat_id ON pdf_attachments(chat_id);

-- 8. Verify the constraint was added successfully
SELECT 
  'Foreign key constraints on pdf_attachments:' as info,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'pdf_attachments';

-- 9. Final verification - test the relationship
SELECT 
  'Final verification:' as info,
  COUNT(pa.*) as pdf_attachments_count,
  COUNT(c.*) as linked_chats_count
FROM pdf_attachments pa
LEFT JOIN chats c ON pa.chat_id = c.id;