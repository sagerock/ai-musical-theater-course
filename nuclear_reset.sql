-- NUCLEAR RESET: Absolutely bulletproof database reset
-- This will eliminate ANY possibility of UUID/TEXT conflicts

-- Step 1: Drop the entire public schema and recreate it (nuclear option)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Step 2: Recreate UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create tables with ABSOLUTELY NO ambiguous type relationships


CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table: UUID id, TEXT created_by (no foreign key initially)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    semester TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members: UUID and TEXT, no foreign keys initially
CREATE TABLE project_members (
    project_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Chats: UUID id, TEXT user_id, UUID project_id
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    project_id UUID NOT NULL,
    tool_used TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags: UUID only
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat tags: UUID only
CREATE TABLE chat_tags (
    chat_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    PRIMARY KEY (chat_id, tag_id)
);

-- Reflections: UUID and TEXT
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert your user first (before any constraints)
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  'TJzSQdlPbGQbaLNCZemTFc4DMHp2',
  'your_email@gmail.com',  -- Replace with your actual email
  'Your Name',             -- Replace with your actual name
  'student',               -- or 'instructor'
  NOW()
);

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

-- Step 6: Add foreign key constraints AFTER data exists
ALTER TABLE projects ADD CONSTRAINT projects_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE project_members ADD CONSTRAINT project_members_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chats ADD CONSTRAINT chats_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chats ADD CONSTRAINT chats_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE chat_tags ADD CONSTRAINT chat_tags_chat_id_fkey 
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE chat_tags ADD CONSTRAINT chat_tags_tag_id_fkey 
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

ALTER TABLE reflections ADD CONSTRAINT reflections_chat_id_fkey 
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE reflections ADD CONSTRAINT reflections_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 7: Create indexes
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_project_id ON chats(project_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);
CREATE INDEX idx_chats_tool_used ON chats(tool_used);
CREATE INDEX idx_reflections_chat_id ON reflections(chat_id);
CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- Step 8: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Step 9: Create SIMPLE RLS policies (avoiding complex joins that might cause type confusion)

-- Users: Simple TEXT comparison
CREATE POLICY "users_own_data" ON users
    FOR ALL USING (auth.uid() = id);

-- Projects: Simple TEXT comparison for created_by
CREATE POLICY "projects_own_data" ON projects
    FOR ALL USING (created_by = auth.uid());

-- Project members: Simple TEXT comparison for user_id
CREATE POLICY "project_members_own_data" ON project_members
    FOR ALL USING (user_id = auth.uid());

-- Chats: Simple TEXT comparison for user_id
CREATE POLICY "chats_own_data" ON chats
    FOR ALL USING (user_id = auth.uid());

-- Tags: Allow all (no user-specific data)
CREATE POLICY "tags_public" ON tags
    FOR SELECT USING (true);

-- Chat tags: Allow for own chats only (use EXISTS to avoid join type issues)
CREATE POLICY "chat_tags_own_data" ON chat_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = chat_tags.chat_id 
            AND chats.user_id = auth.uid()
        )
    );

-- Reflections: Simple TEXT comparison
CREATE POLICY "reflections_own_data" ON reflections
    FOR ALL USING (user_id = auth.uid());

-- Step 10: Create update function and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflections_updated_at BEFORE UPDATE ON reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Verify everything
SELECT 'NUCLEAR RESET COMPLETE!' as status;

SELECT 'Table' as name, 'Count' as count
UNION ALL
SELECT 'users', count(*)::text FROM users
UNION ALL
SELECT 'projects', count(*)::text FROM projects
UNION ALL  
SELECT 'tags', count(*)::text FROM tags
UNION ALL
SELECT 'policies', count(*)::text FROM pg_policies WHERE schemaname = 'public';

-- Show your user
SELECT * FROM users WHERE id = 'TJzSQdlPbGQbaLNCZemTFc4DMHp2'; 