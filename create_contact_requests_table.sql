-- Create contact_requests table for information requests from website
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT NOT NULL,
  role TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_created_at ON contact_requests(created_at);

-- Enable RLS (but keep it simple)
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for the contact form)
CREATE POLICY "Anyone can create contact requests" ON contact_requests
  FOR INSERT 
  WITH CHECK (true);

-- Only authenticated users (admins) can view
CREATE POLICY "Authenticated users can view contact requests" ON contact_requests
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT INSERT ON contact_requests TO anon;
GRANT SELECT, UPDATE ON contact_requests TO authenticated;