-- NUCLEAR OPTION: Completely recreate the table without RLS
-- Run this in your Supabase SQL editor

-- 1. Drop the table completely (this will remove all data!)
DROP TABLE IF EXISTS pdf_attachments CASCADE;

-- 2. Create the table fresh WITHOUT any RLS
CREATE TABLE pdf_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID, -- Removed foreign key constraint for now
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Add indexes
CREATE INDEX idx_pdf_attachments_chat_id ON pdf_attachments(chat_id);
CREATE INDEX idx_pdf_attachments_created_at ON pdf_attachments(created_at);

-- 4. Explicitly confirm RLS is disabled
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;

-- 5. Grant all permissions to authenticated users
GRANT ALL ON pdf_attachments TO authenticated;
GRANT ALL ON pdf_attachments TO anon;

-- 6. Verify the table is created properly
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '❌ RLS ENABLED - PROBLEM!'
    ELSE '✅ RLS DISABLED - GOOD!'
  END as status
FROM pg_tables 
WHERE tablename = 'pdf_attachments';

-- 7. Test insert (this should work now)
INSERT INTO pdf_attachments (chat_id, file_name, file_size, file_type, storage_path, extracted_text)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test.pdf', 1024, 'application/pdf', 'test/path.pdf', 'Test content');

-- 8. Test select (this should work now)
SELECT COUNT(*) as record_count FROM pdf_attachments;