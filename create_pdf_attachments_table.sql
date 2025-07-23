-- =============================================================================
-- CREATE MISSING PDF_ATTACHMENTS TABLE
-- =============================================================================

-- The app is trying to query pdf_attachments table which doesn't exist yet.
-- This table is used for storing PDF file attachments linked to chats.

-- Create pdf_attachments table
CREATE TABLE IF NOT EXISTS public.pdf_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_path TEXT,
    storage_path TEXT,
    extracted_text TEXT,
    content_type TEXT DEFAULT 'application/pdf',
    upload_status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdf_attachments_chat_id ON public.pdf_attachments(chat_id);
CREATE INDEX IF NOT EXISTS idx_pdf_attachments_user_id ON public.pdf_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_attachments_created_at ON public.pdf_attachments(created_at);

-- Add comments for documentation
COMMENT ON TABLE public.pdf_attachments IS 'Stores PDF file attachments linked to chat messages';
COMMENT ON COLUMN public.pdf_attachments.chat_id IS 'Reference to the chat this attachment belongs to';
COMMENT ON COLUMN public.pdf_attachments.user_id IS 'Reference to the user who uploaded this attachment';
COMMENT ON COLUMN public.pdf_attachments.file_name IS 'Original filename of the uploaded PDF';
COMMENT ON COLUMN public.pdf_attachments.file_size IS 'Size of the PDF file in bytes';
COMMENT ON COLUMN public.pdf_attachments.file_path IS 'Public URL or path to access the file';
COMMENT ON COLUMN public.pdf_attachments.storage_path IS 'Internal storage path in Supabase Storage';
COMMENT ON COLUMN public.pdf_attachments.extracted_text IS 'Text content extracted from the PDF';
COMMENT ON COLUMN public.pdf_attachments.content_type IS 'MIME type of the file';
COMMENT ON COLUMN public.pdf_attachments.upload_status IS 'Status of the upload: pending, processing, completed, failed';

-- Disable RLS for now (consistent with other tables)
ALTER TABLE public.pdf_attachments DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdf_attachments TO anon, authenticated;
-- Note: No sequence permissions needed since we use UUID primary keys

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify the table was created successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pdf_attachments'
ORDER BY ordinal_position;

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*

EXECUTE THIS SCRIPT TO CREATE THE MISSING PDF_ATTACHMENTS TABLE:

1. Run this script in your Supabase SQL editor
2. The PDF attachment functionality should now work without errors

WHAT THIS CREATES:
- pdf_attachments table with all necessary columns
- Foreign key relationships to chats and users tables
- Performance indexes for efficient queries
- Proper permissions for anon and authenticated roles
- RLS disabled (consistent with current setup)

AFTER THIS WORKS:
- PDF attachment loading errors should be resolved
- Users can upload PDF files to chats (if that feature is implemented)
- Chat messages will display without attachment-related errors

*/
