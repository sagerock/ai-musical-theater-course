-- Disable RLS for current session only (this should work in Supabase)
-- Run this in your Supabase SQL editor

-- 1. Check current setting
SHOW row_security;

-- 2. Disable for current session only (this usually works)
SET row_security = off;

-- 3. Check if it worked
SHOW row_security;

-- 4. Now test the table (should work now)
SELECT COUNT(*) FROM pdf_attachments;

-- 5. Test insert (should work now)
INSERT INTO pdf_attachments (chat_id, file_name, file_size, file_type, storage_path, extracted_text)
VALUES ('00000000-0000-0000-0000-000000000003', 'test3.pdf', 3072, 'application/pdf', 'test/path3.pdf', 'Test content 3');

-- 6. Test select again
SELECT * FROM pdf_attachments ORDER BY created_at DESC LIMIT 5;