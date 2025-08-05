-- Diagnostic script to understand what's happening
-- Run this in your Supabase SQL editor

-- 1. Check if table exists and its RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '❌ RLS ENABLED'
    ELSE '✅ RLS DISABLED'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'pdf_attachments';

-- 2. Check table permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'pdf_attachments';

-- 3. Check if any policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'pdf_attachments';

-- 4. Check current user and role
SELECT 
  current_user as current_user,
  current_role as current_role,
  session_user as session_user;

-- 5. Show all roles
SELECT rolname FROM pg_roles;

-- 6. Check if service_role has superuser privileges
SELECT 
  rolname,
  rolsuper,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin,
  rolbypassrls
FROM pg_roles 
WHERE rolname IN ('service_role', 'authenticator', 'authenticated', 'anon');

-- 7. Try to create a simple test table
CREATE TABLE IF NOT EXISTS test_table (
  id SERIAL PRIMARY KEY,
  name TEXT
);

-- 8. Test insert into the test table
INSERT INTO test_table (name) VALUES ('test');

-- 9. Test select from the test table
SELECT COUNT(*) as test_count FROM test_table;

-- 10. Show schema and ownership of pdf_attachments
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename = 'pdf_attachments';

-- 11. Check if RLS is enabled at the database level
SELECT name, setting FROM pg_settings WHERE name = 'row_security';