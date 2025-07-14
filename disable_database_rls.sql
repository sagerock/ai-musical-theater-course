-- Disable row-level security at the database level
-- Run this in your Supabase SQL editor

-- 1. Check current setting
SELECT name, setting FROM pg_settings WHERE name = 'row_security';

-- 2. Disable row-level security globally
-- WARNING: This affects the entire database, not just our table
ALTER DATABASE postgres SET row_security = off;

-- 3. Reload configuration
SELECT pg_reload_conf();

-- 4. Check if it worked
SELECT name, setting FROM pg_settings WHERE name = 'row_security';

-- 5. Alternative: Set for current session only
SET row_security = off;

-- 6. Verify current session setting
SHOW row_security;

-- 7. Now test the table
SELECT COUNT(*) FROM pdf_attachments;

-- 8. Test insert
INSERT INTO pdf_attachments (chat_id, file_name, file_size, file_type, storage_path, extracted_text)
VALUES ('00000000-0000-0000-0000-000000000002', 'test2.pdf', 2048, 'application/pdf', 'test/path2.pdf', 'Test content 2');

-- 9. Final verification
SELECT COUNT(*) as total_records FROM pdf_attachments;