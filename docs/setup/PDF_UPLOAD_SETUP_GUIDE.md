# PDF Upload Feature Setup Guide

## Overview
This guide will help you set up the PDF upload functionality for the AI Chat system. Students can now upload PDF documents to share with AI models, and instructors can view and download these documents.

## Features
- ✅ PDF file upload (max 10MB)
- ✅ File validation and error handling
- ✅ Secure storage with Supabase Storage
- ✅ PDF attachments display in chat messages
- ✅ Download functionality for students and instructors
- ✅ Proper permissions and access control
- ✅ Database tracking of all uploads

## Setup Steps

### 1. Database Schema Setup
Run the SQL script to create the necessary tables and policies:

```bash
# Execute the SQL file in your Supabase SQL editor
cat pdf_upload_schema.sql
```

**Key components created:**
- `chat_attachments` table for storing PDF metadata
- Storage bucket `chat-attachments` for PDF files
- Row Level Security (RLS) policies for proper access control
- Indexes for performance optimization

### 2. Environment Variables
Ensure your Supabase configuration is properly set up in your `.env` file:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SUPABASE_SERVICE_KEY=your_service_key  # Optional for enhanced features
```

### 3. Verify Storage Bucket
1. Go to your Supabase Dashboard
2. Navigate to Storage > Buckets
3. Verify that the `chat-attachments` bucket exists
4. Check that the bucket is set to **private** (not public)

### 4. Test the Feature
1. Navigate to a chat project
2. Click the paperclip icon next to the send button
3. Select a PDF file (max 10MB)
4. Send the message with or without additional text
5. Verify the PDF appears in the chat message
6. Test downloading the PDF

## File Structure
```
src/
├── components/
│   └── Chat/
│       ├── Chat.js                    # Updated with PDF upload UI
│       └── ChatMessage.js             # Updated to display attachments
├── services/
│   └── supabaseApi.js                # Added attachmentApi functions
└── pdf_upload_schema.sql             # Database schema
```

## Security Features

### Access Control
- **Students**: Can only upload PDFs to their own chats
- **Students**: Can only download their own PDFs
- **Instructors**: Can view and download all PDFs in their courses
- **File Validation**: Only PDF files under 10MB are accepted

### Storage Security
- Files are stored in organized folders: `{userId}/{chatId}/{filename}`
- Signed URLs with 1-hour expiration for downloads
- Row Level Security policies enforce proper access

## API Functions

### attachmentApi.uploadPDFAttachment(file, chatId, userId)
Uploads a PDF file and creates a database record.

### attachmentApi.getChatAttachments(chatId)
Retrieves all attachments for a specific chat.

### attachmentApi.getAttachmentDownloadUrl(storagePath)
Generates a secure download URL for a PDF.

### attachmentApi.getCourseAttachments(courseId, instructorId)
Gets all attachments for a course (instructor access).

## Usage Examples

### Student Upload
1. Open a chat project
2. Click the paperclip icon
3. Select a PDF file
4. Optionally add a text message
5. Click Send

### Instructor Access
Instructors can view all student PDFs through:
- Individual chat messages (when viewing student projects)
- Future instructor dashboard PDF viewer

## Troubleshooting

### Upload Fails
- Check file size (max 10MB)
- Verify file type is PDF
- Check browser console for specific errors
- Ensure Supabase Storage is properly configured

### Download Fails
- Verify storage bucket permissions
- Check that RLS policies are properly set
- Ensure user has appropriate access rights

### Database Errors
- Verify the `chat_attachments` table exists
- Check that foreign key relationships are intact
- Ensure RLS policies are enabled

## Current Limitations & Future Enhancements

### Current Limitations
- PDF text extraction is placeholder (shows filename only)
- No PDF preview/viewer in the interface
- No bulk download functionality for instructors

### Future Enhancements
- Implement proper PDF text extraction using pdf-parse library
- Add PDF preview/viewer modal
- Create instructor dashboard section for PDF management
- Add batch download functionality
- Implement file compression for large PDFs
- Add support for other document types (Word, etc.)

## Performance Considerations

### Database
- Indexes on `chat_id` and `created_at` for fast queries
- Proper cleanup of orphaned attachments

### Storage
- 1-hour signed URL expiration to prevent link sharing
- Organized folder structure for efficient access
- File size validation to prevent storage bloat

## Maintenance

### Regular Tasks
- Monitor storage usage in Supabase Dashboard
- Check for orphaned files (files without database records)
- Review access logs for unusual activity

### Backup Considerations
- PDF files are stored in Supabase Storage (automatically backed up)
- Database records are included in regular database backups
- Consider implementing retention policies for old attachments

## Support & Questions

For issues or questions about the PDF upload feature:
1. Check the browser console for error messages
2. Verify the database schema is properly installed
3. Test with a small PDF file first
4. Review the Supabase Storage logs for upload issues

## Migration Notes

If you're adding this to an existing system:
1. Run the database schema script
2. Deploy the updated frontend code
3. Test with a few users before full rollout
4. Monitor for any performance impacts

---

**Note**: This feature requires Supabase Storage to be enabled on your project. If you're on the free tier, be aware of storage limits and consider implementing usage monitoring.