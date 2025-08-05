-- Create table in extensions schema (often has fewer restrictions)
-- Run this in your Supabase SQL editor

-- 1. Create the table in the extensions schema
CREATE TABLE extensions.pdf_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Grant permissions
GRANT ALL ON extensions.pdf_attachments TO authenticated;
GRANT ALL ON extensions.pdf_attachments TO anon;
GRANT ALL ON extensions.pdf_attachments TO service_role;

-- 3. Test insert
INSERT INTO extensions.pdf_attachments (chat_id, file_name, file_size, file_type, storage_path, extracted_text)
VALUES ('00000000-0000-0000-0000-000000000004', 'test4.pdf', 4096, 'application/pdf', 'test/path4.pdf', 'Test content 4');

-- 4. Test select
SELECT COUNT(*) FROM extensions.pdf_attachments;