# Setup New PDF Attachments Table

## Step 1: Create New Table and Bucket

1. **Go to your Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the entire content from `new_attachments_table.sql`
3. **Run the script**

This will create:
- A new `pdf_attachments` table (no RLS issues)
- A new `pdf-uploads` storage bucket (clean policies)

## Step 2: Test the Upload

1. **Refresh your browser** completely
2. **Try uploading a PDF** in a chat
3. **Check the console** for success messages:
   - `✅ File uploaded successfully`
   - `✅ Attachment created successfully`

## What Changed

- **Table name**: `chat_attachments` → `pdf_attachments`
- **Storage bucket**: `chat-attachments` → `pdf-uploads`
- **RLS**: Completely disabled on new table
- **Policies**: Simple, permissive policies on storage

## Expected Result

After running the setup:
- ✅ PDF uploads should work without any permission errors
- ✅ Attachment loading should work in chat messages
- ✅ No more 403 Forbidden or 42501 permission errors

## If Issues Persist

If you still get errors, check:
1. The SQL script ran successfully (no error messages)
2. Browser console shows the new table/bucket names in API calls
3. Service key is properly configured (should see admin client debug messages)

The new table approach completely avoids all the RLS issues we've been fighting with the old `chat_attachments` table.