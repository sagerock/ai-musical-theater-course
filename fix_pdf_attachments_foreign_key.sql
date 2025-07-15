-- Fix pdf_attachments table to add proper foreign key relationship to chats table
-- This will resolve the instructor dashboard error

-- First, let's see what columns exist in pdf_attachments
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pdf_attachments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current foreign key constraints
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'pdf_attachments';

-- If chat_id column exists but foreign key doesn't, add it
-- If chat_id column doesn't exist, add it with foreign key

-- Add foreign key constraint if it doesn't exist
-- This assumes chat_id column exists - if not, we need to add it first
DO $$
BEGIN
  -- Check if foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'pdf_attachments' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%chat_id%'
  ) THEN
    
    -- Check if chat_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'pdf_attachments' 
      AND column_name = 'chat_id'
    ) THEN
      -- Add foreign key constraint to existing column
      ALTER TABLE pdf_attachments 
      ADD CONSTRAINT fk_pdf_attachments_chat_id 
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'Added foreign key constraint to existing chat_id column';
    ELSE
      -- Add chat_id column with foreign key constraint
      ALTER TABLE pdf_attachments 
      ADD COLUMN chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'Added chat_id column with foreign key constraint';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END
$$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pdf_attachments_chat_id ON pdf_attachments(chat_id);

-- Verify the fix worked
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'pdf_attachments';

-- Test that the relationship works
SELECT 
  'pdf_attachments' as table_name,
  COUNT(*) as row_count
FROM pdf_attachments;