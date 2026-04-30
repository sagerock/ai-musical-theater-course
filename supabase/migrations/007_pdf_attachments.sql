CREATE TABLE pdf_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
