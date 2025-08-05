-- Migration script to fix Firebase user ID compatibility
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all foreign key constraints that reference users.id
ALTER TABLE projects DROP CONSTRAINT projects_created_by_fkey;
ALTER TABLE project_members DROP CONSTRAINT project_members_user_id_fkey;
ALTER TABLE chats DROP CONSTRAINT chats_user_id_fkey;
ALTER TABLE reflections DROP CONSTRAINT reflections_user_id_fkey;

-- Step 2: Change all user ID columns from UUID to TEXT
ALTER TABLE users ALTER COLUMN id TYPE TEXT;
ALTER TABLE projects ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE project_members ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE chats ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE reflections ALTER COLUMN user_id TYPE TEXT;

-- Step 3: Recreate the foreign key constraints
ALTER TABLE projects ADD CONSTRAINT projects_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chats ADD CONSTRAINT chats_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reflections ADD CONSTRAINT reflections_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Update RLS policies to work with TEXT instead of UUID
-- Drop existing policies
DROP POLICY "Users can read own data" ON users;
DROP POLICY "Users can update own data" ON users;

-- Recreate policies with proper TEXT comparison
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Update other policies to remove ::text casts (no longer needed)
DROP POLICY "Users can read projects they're members of" ON projects;
CREATE POLICY "Users can read projects they're members of" ON projects
    FOR SELECT USING (
        id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        ) OR 
        created_by = auth.uid()
    );

DROP POLICY "Users can create projects" ON projects;
CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY "Users can read project members" ON project_members;
CREATE POLICY "Users can read project members" ON project_members
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY "Users can read chats from their projects" ON chats;
CREATE POLICY "Users can read chats from their projects" ON chats
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        ) OR
        user_id = auth.uid()
    );

DROP POLICY "Users can create own chats" ON chats;
CREATE POLICY "Users can create own chats" ON chats
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY "Users can read chat tags" ON chat_tags;
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

DROP POLICY "Users can create chat tags for own chats" ON chat_tags;
CREATE POLICY "Users can create chat tags for own chats" ON chat_tags
    FOR INSERT WITH CHECK (
        chat_id IN (
            SELECT id FROM chats 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY "Users can read reflections" ON reflections;
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

DROP POLICY "Users can create own reflections" ON reflections;
CREATE POLICY "Users can create own reflections" ON reflections
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY "Users can update own reflections" ON reflections;
CREATE POLICY "Users can update own reflections" ON reflections
    FOR UPDATE USING (user_id = auth.uid());


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

-- Verify the user was created
SELECT * FROM users WHERE id = 'TJzSQdlPbGQbaLNCZemTFc4DMHp2'; 