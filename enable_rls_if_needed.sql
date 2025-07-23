-- Enable RLS on projects table if not already enabled
-- Skip policy creation since it already exists

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Ensure proper permissions are granted
GRANT ALL ON projects TO authenticated;
GRANT ALL ON projects TO service_role;

-- Check the result
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'projects';