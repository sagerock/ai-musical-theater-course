-- Migration script to fix Firebase user ID compatibility (CORRECTED VERSION)
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL RLS policies first (they prevent column type changes)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read projects they're members of" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can read project members" ON project_members;
DROP POLICY IF EXISTS "Users can read chats from their projects" ON chats;
DROP POLICY IF EXISTS "Users can create own chats" ON chats;
DROP POLICY IF EXISTS "Anyone can read tags" ON tags;
DROP POLICY IF EXISTS "Users can read chat tags" ON chat_tags;
DROP POLICY IF EXISTS "Users can create chat tags for own chats" ON chat_tags;
DROP POLICY IF EXISTS "Users can read reflections" ON reflections;
DROP POLICY IF EXISTS "Users can create own reflections" ON reflections;
DROP POLICY IF EXISTS "Users can update own reflections" ON reflections;

-- Step 2: Drop all foreign key constraints that reference users.id
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE reflections DROP CONSTRAINT IF EXISTS reflections_user_id_fkey;

-- Step 3: Change all user ID columns from UUID to TEXT
ALTER TABLE users ALTER COLUMN id TYPE TEXT;
ALTER TABLE projects ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE project_members ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE chats ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE reflections ALTER COLUMN user_id TYPE TEXT;

-- Step 4: Recreate the foreign key constraints
ALTER TABLE projects ADD CONSTRAINT projects_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chats ADD CONSTRAINT chats_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reflections ADD CONSTRAINT reflections_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 5: Recreate ALL RLS policies with proper TEXT comparison

-- Users policies
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can read projects they're members of" ON projects
    FOR SELECT USING (
        id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        ) OR 
        created_by = auth.uid()
    );

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Project members policies
CREATE POLICY "Users can read project members" ON project_members
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

-- Chats policies
CREATE POLICY "Users can read chats from their projects" ON chats
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        ) OR
        user_id = auth.uid()
    );

CREATE POLICY "Users can create own chats" ON chats
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Tags policies
CREATE POLICY "Anyone can read tags" ON tags
    FOR SELECT USING (true);

-- Chat tags policies
CREATE POLICY "Users can read chat tags" ON chat_tags
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM chats 
            WHERE user_id = auth.uid() OR
            project_id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create chat tags for own chats" ON chat_tags
    FOR INSERT WITH CHECK (
        chat_id IN (
            SELECT id FROM chats 
            WHERE user_id = auth.uid()
        )
    );

-- Reflections policies
CREATE POLICY "Users can read reflections" ON reflections
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM chats 
            WHERE user_id = auth.uid() OR
            project_id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create own reflections" ON reflections
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reflections" ON reflections
    FOR UPDATE USING (user_id = auth.uid());

-- Step 6: Now insert your Firebase user
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  'TJzSQdlPbGQbaLNCZemTFc4DMHp2',
  'your_email@gmail.com',  -- Replace with your actual email
  'Your Name',             -- Replace with your actual name
  'student',               -- or 'instructor'
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Step 7: Verify the user was created
SELECT * FROM users WHERE id = 'TJzSQdlPbGQbaLNCZemTFc4DMHp2';

-- Step 8: Verify all policies are recreated
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'projects', 'project_members', 'chats', 'tags', 'chat_tags', 'reflections')
ORDER BY tablename, policyname; 