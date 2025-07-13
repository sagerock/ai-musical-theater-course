-- Simple Instructor Notes Permissions (Development)
-- This script grants basic permissions and disables RLS for development

-- Grant full permissions to authenticated and anonymous users
GRANT ALL ON instructor_notes TO authenticated;
GRANT ALL ON instructor_notes TO anon;
GRANT ALL ON instructor_notes TO public;

-- Disable Row Level Security for development (simpler approach)
ALTER TABLE instructor_notes DISABLE ROW LEVEL SECURITY;

-- Grant sequence permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO public;

-- Verify the table exists and permissions are set
SELECT 'Simple instructor notes permissions set successfully!' as status;

-- Show table info
SELECT tablename, tableowner, hasindexes, hasrules, hastriggers 
FROM pg_tables 
WHERE tablename = 'instructor_notes';