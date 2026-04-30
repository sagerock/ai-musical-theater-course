CREATE TABLE course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  file_url TEXT,
  storage_path TEXT,
  visibility TEXT NOT NULL DEFAULT 'visible'
    CHECK (visibility IN ('visible', 'hidden')),
  category TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
