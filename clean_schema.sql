-- CLEAN SCHEMA: Simple and Firebase-compatible
-- Run this in your Supabase SQL Editor

-- Step 1: Clean slate
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Step 2: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create tables (NO RLS, simple structure)

-- Users table - TEXT id for Firebase
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    semester TEXT,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members
CREATE TABLE project_members (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Chats
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tool_used TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat tags
CREATE TABLE chat_tags (
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (chat_id, tag_id)
);

-- Reflections
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_project_id ON chats(project_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);
CREATE INDEX idx_chats_tool_used ON chats(tool_used);
CREATE INDEX idx_reflections_chat_id ON reflections(chat_id);
CREATE INDEX idx_reflections_user_id ON reflections(user_id);

-- Step 5: Insert default tags
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

-- Step 6: Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflections_updated_at BEFORE UPDATE ON reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Insert your Firebase user
INSERT INTO users (id, email, name, role)
VALUES (
  'TJzSQdlPbGQbaLNCZemTFc4DMHp2',
  'your_email@gmail.com',  -- Replace with your actual email
  'Your Name',             -- Replace with your actual name
  'student'                -- or 'instructor'
);

-- Step 9: Verify everything worked
SELECT 'CLEAN SCHEMA COMPLETE!' as status;

SELECT 'Table' as name, 'Count' as count
UNION ALL
SELECT 'users', count(*)::text FROM users
UNION ALL
SELECT 'projects', count(*)::text FROM projects
UNION ALL  
SELECT 'tags', count(*)::text FROM tags;

-- Show your user
SELECT * FROM users; 