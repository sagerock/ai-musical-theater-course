CREATE TABLE instructor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  course_id UUID REFERENCES courses(id),
  author_id UUID NOT NULL REFERENCES users(id),
  author_name TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES instructor_notes(id),
  thread_id UUID REFERENCES instructor_notes(id),
  is_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
