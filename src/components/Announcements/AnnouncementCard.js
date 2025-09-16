import React, { useState } from 'react';
import { announcementApi } from '../../services/firebaseApi';
import { hasTeachingPermissions } from '../../utils/roleUtils';
import AnnouncementComments from './AnnouncementComments';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  BookmarkIcon,
  TrashIcon,
  PencilIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function AnnouncementCard({
  announcement,
  currentUser,
  courseMembership,
  onDelete,
  onUpdate
}) {
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(announcement.content);
  const [editTitle, setEditTitle] = useState(announcement.title);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = currentUser?.id === announcement.authorId ||
                  hasTeachingPermissions(courseMembership?.role);
  const canPin = hasTeachingPermissions(courseMembership?.role);

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      await announcementApi.updateAnnouncement(announcement.id, {
        title: editTitle,
        content: editContent
      });
      onUpdate(announcement.id, { title: editTitle, content: editContent });
      setIsEditing(false);
      toast.success('Announcement updated');
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setDeleting(true);
    try {
      await announcementApi.deleteAnnouncement(announcement.id);
      onDelete(announcement.id);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
      setDeleting(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      const newPinnedState = !announcement.isPinned;
      await announcementApi.pinAnnouncement(announcement.id, newPinnedState);
      onUpdate(announcement.id, { isPinned: newPinnedState });
      toast.success(newPinnedState ? 'Announcement pinned' : 'Announcement unpinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update announcement');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      instructor: 'bg-purple-100 text-purple-800',
      teaching_assistant: 'bg-blue-100 text-blue-800',
      student_assistant: 'bg-green-100 text-green-800',
      student: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleDisplayName = (role) => {
    const names = {
      instructor: 'Instructor',
      teaching_assistant: 'TA',
      student_assistant: 'SA',
      student: 'Student'
    };
    return names[role] || role;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${announcement.isPinned ? 'border-yellow-400' : 'border-gray-200'} overflow-hidden`}>
      {/* Announcement Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <UserCircleIcon className="h-10 w-10 text-gray-400" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {announcement.authorName}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(announcement.authorRole)}`}>
                  {getRoleDisplayName(announcement.authorRole)}
                </span>
                {announcement.isPinned && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <BookmarkSolidIcon className="h-3 w-3 mr-1" />
                    Pinned
                  </span>
                )}
              </div>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <ClockIcon className="h-3 w-3 mr-1" />
                {announcement.createdAt ? format(new Date(announcement.createdAt), 'MMM dd, yyyy • h:mm a') : 'Just now'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canPin && (
              <button
                onClick={handleTogglePin}
                className={`p-1 rounded hover:bg-gray-100 ${announcement.isPinned ? 'text-yellow-600' : 'text-gray-400'}`}
                title={announcement.isPinned ? 'Unpin announcement' : 'Pin announcement'}
              >
                {announcement.isPinned ? <BookmarkSolidIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
              </button>
            )}
            {canEdit && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                  title="Edit announcement"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                  title="Delete announcement"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Announcement Content */}
      <div className="px-6 py-4">
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Announcement title"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Announcement content"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(announcement.title);
                  setEditContent(announcement.content);
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{announcement.title}</h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {announcement.content}
            </div>
          </>
        )}

        {/* Attachments */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <PaperClipIcon className="h-4 w-4 mr-1" />
              Attachments ({announcement.attachments.length})
            </h4>
            <div className="space-y-2">
              {announcement.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <PaperClipIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{attachment.fileName}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(attachment.fileSize)})</span>
                  </div>
                  <a
                    href={attachment.fileUrl}
                    download={attachment.fileName}
                    className="p-1 text-gray-400 hover:text-primary-600"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary-600"
        >
          <ChatBubbleLeftIcon className="h-5 w-5" />
          <span>
            {announcement.commentCount || 0} Comment{announcement.commentCount !== 1 ? 's' : ''}
          </span>
        </button>
      </div>

      {/* Comments Component */}
      {showComments && (
        <div className="border-t border-gray-200">
          <AnnouncementComments
            announcementId={announcement.id}
            currentUser={currentUser}
            courseMembership={courseMembership}
            onCommentCountChange={(count) => onUpdate(announcement.id, { commentCount: count })}
          />
        </div>
      )}
    </div>
  );
}