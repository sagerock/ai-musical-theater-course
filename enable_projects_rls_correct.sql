-- Phase 1: Enable RLS on projects table with correct column names
-- Projects table uses 'created_by' instead of 'user_id'

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create owner policy for projects using correct column name
-- Users can manage (SELECT, INSERT, UPDATE, DELETE) projects they created
CREATE POLICY "users_own_projects" ON projects
  FOR ALL 
  USING (auth.uid()::text = created_by::text) 
  WITH CHECK (auth.uid()::text = created_by::text);

-- Grant necessary permissions to authenticated users
GRANT ALL ON projects TO authenticated;

-- Also ensure service_role can bypass RLS for admin operations
GRANT ALL ON projects TO service_role;