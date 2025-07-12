-- FRESH START: Complete database reset for Firebase compatibility
-- Run this in your Supabase SQL Editor

-- Step 1: Drop everything completely
DROP TABLE IF EXISTS reflections CASCADE;
DROP TABLE IF EXISTS chat_tags CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create fresh schema with TEXT user IDs (Firebase compatible)

-- Create users table (with TEXT id for Firebase)
CREATE TABLE users (
    id TEXT PRIMARY KEY,  -- Firebase user ID (not UUID)
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    semester TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE CASCADE,  -- TEXT reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_members table
CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,  -- TEXT reference
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Create chats table
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,  -- TEXT reference
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tool_used TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_tags junction table
CREATE TABLE chat_tags (
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (chat_id, tag_id)
);

-- Create reflections table
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,  -- TEXT reference
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_project_id ON chats(project_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);
CREATE INDEX idx_chats_tool_used ON chats(tool_used);
CREATE INDEX idx_reflections_chat_id ON reflections(chat_id);
CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- Step 4: Insert default tags
INSERT INTO tags (name, description) VALUES
    ('Lyrics', 'AI assistance with song lyrics and writing'),
    ('Character Development', 'AI help with character creation and development'),
    ('Plot Development', 'Story and plot assistance'),
    ('Research', 'AI-assisted research and fact-checking'),
    ('Creative Writing', 'General creative writing assistance'),
    ('Ethical Use', 'Proper and ethical AI usage'),
    ('Brainstorming', 'Idea generation and brainstorming'),
    ('Editing', 'Text editing and revision assistance'),
    ('Technical Help', 'Technical or procedural assistance'),
    ('Inspiration', 'Seeking creative inspiration');

-- Step 5: Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies (designed for TEXT user IDs)

-- Users policies
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own data (for user sync)
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

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

CREATE POLICY "Users can add project members" ON project_members
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
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

-- Step 7: Create update timestamp functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflections_updated_at BEFORE UPDATE ON reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Insert your Firebase user
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  'TJzSQdlPbGQbaLNCZemTFc4DMHp2',
  'your_email@gmail.com',  -- Replace with your actual email
  'Your Name',             -- Replace with your actual name
  'student',               -- or 'instructor'
  NOW()
);

-- Step 10: Verify everything
SELECT 'Users table:' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Projects table:', count(*) FROM projects
UNION ALL
SELECT 'Tags table:', count(*) FROM tags
UNION ALL
SELECT 'Your user:', 1 FROM users WHERE id = 'TJzSQdlPbGQbaLNCZemTFc4DMHp2';

-- Show your user
SELECT * FROM users WHERE id = 'TJzSQdlPbGQbaLNCZemTFc4DMHp2'; 