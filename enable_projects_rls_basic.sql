-- Phase 1: Enable RLS on projects table with basic owner policy
-- This is the most minimal RLS implementation to test the approach

-- First, check current state
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'projects';

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible owner policy
-- Users can manage (SELECT, INSERT, UPDATE, DELETE) their own projects
CREATE POLICY "users_own_projects" ON projects
  FOR ALL 
  USING (auth.uid()::text = user_id::text) 
  WITH CHECK (auth.uid()::text = user_id::text);

-- Grant necessary permissions to authenticated users
GRANT ALL ON projects TO authenticated;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';

-- Test query to verify RLS is working
-- This should only return projects owned by the current user
-- SELECT * FROM projects WHERE user_id = auth.uid()::text;