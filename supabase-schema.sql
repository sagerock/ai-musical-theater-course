-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
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
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_members table (for many-to-many relationship)
CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Create chats table
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_project_id ON chats(project_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);
CREATE INDEX idx_chats_tool_used ON chats(tool_used);
CREATE INDEX idx_reflections_chat_id ON reflections(chat_id);
CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- Insert some default tags
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

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Anyone can read projects they're members of
CREATE POLICY "Users can read projects they're members of" ON projects
    FOR SELECT USING (
        id IN (
            SELECT project_id FROM project_members 
            WHERE user_id::text = auth.uid()::text
        ) OR 
        created_by::text = auth.uid()::text
    );

-- Users can create projects
CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (created_by::text = auth.uid()::text);

-- Users can read project members for projects they're part of
CREATE POLICY "Users can read project members" ON project_members
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id::text = auth.uid()::text
        )
    );

-- Users can read chats from projects they're members of
CREATE POLICY "Users can read chats from their projects" ON chats
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id::text = auth.uid()::text
        ) OR
        user_id::text = auth.uid()::text
    );

-- Users can create their own chats
CREATE POLICY "Users can create own chats" ON chats
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Everyone can read tags
CREATE POLICY "Anyone can read tags" ON tags
    FOR SELECT USING (true);

-- Users can read chat_tags for chats they have access to
CREATE POLICY "Users can read chat tags" ON chat_tags
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM chats 
            WHERE user_id::text = auth.uid()::text OR
            project_id IN (
                SELECT project_id FROM project_members 
                WHERE user_id::text = auth.uid()::text
            )
        )
    );

-- Users can create chat_tags for their own chats
CREATE POLICY "Users can create chat tags for own chats" ON chat_tags
    FOR INSERT WITH CHECK (
        chat_id IN (
            SELECT id FROM chats 
            WHERE user_id::text = auth.uid()::text
        )
    );

-- Users can read reflections for chats they have access to
CREATE POLICY "Users can read reflections" ON reflections
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM chats 
            WHERE user_id::text = auth.uid()::text OR
            project_id IN (
                SELECT project_id FROM project_members 
                WHERE user_id::text = auth.uid()::text
            )
        )
    );

-- Users can create their own reflections
CREATE POLICY "Users can create own reflections" ON reflections
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Users can update their own reflections
CREATE POLICY "Users can update own reflections" ON reflections
    FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflections_updated_at BEFORE UPDATE ON reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 