import React, { useState, useRef } from 'react';
import { announcementApi } from '../../services/firebaseApi';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  PaperClipIcon,
  TrashIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  BookmarkIcon,
  EnvelopeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function CreateAnnouncement({
  courseId,
  currentUser,
  courseMembership,
  onCancel,
  onSuccess
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast.error(`Files must be smaller than 10MB. ${oversizedFiles.length} file(s) too large.`);
      return;
    }

    setUploading(true);
    const uploadPromises = files.map(file => uploadFile(file));

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments([...attachments, ...uploadedFiles.filter(f => f !== null)]);
      toast.success(`${uploadedFiles.filter(f => f !== null).length} file(s) uploaded`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload some files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadFile = async (file) => {
    try {
      const attachment = await announcementApi.uploadAnnouncementAttachment(file, courseId);
      return attachment;
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      toast.error(`Failed to upload ${file.name}`);
      return null;
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    setSubmitting(true);
    try {
      const announcementData = {
        courseId,
        authorId: currentUser.id,
        authorName: currentUser.name || currentUser.email,
        authorEmail: currentUser.email, // Include instructor's email for reply-to
        authorRole: courseMembership?.role || 'instructor',
        title: title.trim(),
        content: content.trim(),
        isPinned,
        attachments,
        sendEmail // Pass the email flag
      };

      const newAnnouncement = await announcementApi.createAnnouncement(announcementData);
      onSuccess(newAnnouncement);

      // Reset form
      setTitle('');
      setContent('');
      setIsPinned(false);
      setSendEmail(false);
      setAttachments([]);
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create New Announcement</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Title Input */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter announcement title..."
            required
          />
        </div>

        {/* Content Textarea */}
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Enter your announcement message..."
            required
          />
        </div>

        {/* Options Row */}
        <div className="mb-4 space-y-2">
          {/* Pin Option */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 flex items-center">
              <BookmarkIcon className="h-4 w-4 mr-1" />
              Pin this announcement to the top
            </span>
          </label>

          {/* Email Option */}
          <div className="flex items-start space-x-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                Email this announcement to all course members
              </span>
            </label>
            <div className="group relative">
              <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-md p-2 bottom-full mb-1 left-1/2 transform -translate-x-1/2 w-64">
                All approved course members will receive an email with the announcement content and a link to the discussion.
                <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments (Optional)
          </label>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Add Files
                </>
              )}
            </button>
            <span className="text-xs text-gray-500">
              Max 10MB per file • Supported: PDF, Word, Excel, PowerPoint, Text, Images
            </span>
          </div>

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <DocumentIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{attachment.fileName}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(attachment.fileSize)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}