CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  system_prompt TEXT,
  minimum_exchanges INTEGER DEFAULT 0,
  ai_model TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chats ADD CONSTRAINT chats_module_id_fkey
  FOREIGN KEY (module_id) REFERENCES modules(id);
