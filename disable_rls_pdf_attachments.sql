-- Disable RLS on pdf_attachments table temporarily for testing
-- Run this in your Supabase SQL editor

-- 1. Disable RLS on the table
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;

-- 2. Grant permissions to all roles
GRANT ALL ON pdf_attachments TO authenticated;
GRANT ALL ON pdf_attachments TO anon;
GRANT ALL ON pdf_attachments TO service_role;

-- 3. Test query
SELECT COUNT(*) FROM pdf_attachments;

-- 4. Test insert
INSERT INTO pdf_attachments (chat_id, file_name, file_size, file_type, storage_path, extracted_text)
VALUES ('00000000-0000-0000-0000-000000000006', 'test-disable-rls.pdf', 6144, 'application/pdf', 'test/disable-rls.pdf', 'Test with RLS disabled');

-- 5. Verify the insert worked
SELECT * FROM pdf_attachments WHERE file_name = 'test-disable-rls.pdf';