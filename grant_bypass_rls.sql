-- Grant BYPASSRLS privilege to service_role
-- Run this in your Supabase SQL editor

-- 1. Check current privileges
SELECT 
  rolname,
  rolsuper,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin,
  rolbypassrls
FROM pg_roles 
WHERE rolname IN ('service_role', 'authenticator', 'authenticated', 'anon');

-- 2. Grant BYPASSRLS to service_role (this should work in Supabase)
ALTER ROLE service_role BYPASSRLS;

-- 3. Check if it worked
SELECT 
  rolname,
  rolbypassrls
FROM pg_roles 
WHERE rolname = 'service_role';

-- 4. Test with service_role context
SET ROLE service_role;

-- 5. Test table access as service_role
SELECT COUNT(*) FROM pdf_attachments;

-- 6. Test insert as service_role
INSERT INTO pdf_attachments (chat_id, file_name, file_size, file_type, storage_path, extracted_text)
VALUES ('00000000-0000-0000-0000-000000000005', 'service_test.pdf', 5120, 'application/pdf', 'service/test.pdf', 'Service role test');

-- 7. Reset role
RESET ROLE;

-- 8. Final test
SELECT COUNT(*) FROM pdf_attachments;