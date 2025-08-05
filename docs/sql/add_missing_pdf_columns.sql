-- Add missing columns to pdf_attachments table

-- First, check current table structure
\d pdf_attachments;

-- Add missing file_type column if it doesn't exist
ALTER TABLE pdf_attachments 
ADD COLUMN IF NOT EXISTS file_type TEXT NOT NULL DEFAULT 'application/pdf';

-- Verify the table structure after changes
\d pdf_attachments;

-- Check if there are any existing records that need the default value
SELECT id, file_name, file_type FROM pdf_attachments LIMIT 5;