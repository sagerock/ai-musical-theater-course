CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  course_code TEXT UNIQUE NOT NULL,
  access_code TEXT,
  semester TEXT,
  year INTEGER,
  school_id UUID REFERENCES schools(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
