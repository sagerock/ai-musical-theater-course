import React, { useState, useEffect } from 'react';
import { announcementApi } from '../../services/firebaseApi';
import { hasTeachingPermissions } from '../../utils/roleUtils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function AnnouncementComments({
  announcementId,
  currentUser,
  courseMembership,
  onCommentCountChange
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [announcementId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await announcementApi.getComments(announcementId);
      setComments(data);
      if (onCommentCountChange) {
        onCommentCountChange(data.length);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const commentData = {
        authorId: currentUser.id,
        authorName: currentUser.name || currentUser.email,
        authorRole: courseMembership?.role || 'student',
        content: newComment.trim()
      };

      const newCommentObj = await announcementApi.addComment(announcementId, commentData);
      setComments([...comments, newCommentObj]);
      setNewComment('');

      if (onCommentCountChange) {
        onCommentCountChange(comments.length + 1);
      }

      toast.success('Comment posted');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await announcementApi.updateComment(commentId, editContent.trim());
      setComments(comments.map(c =>
        c.id === commentId
          ? { ...c, content: editContent.trim(), isEdited: true, editedAt: new Date() }
          : c
      ));
      setEditingCommentId(null);
      setEditContent('');
      toast.success('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await announcementApi.deleteComment(commentId, announcementId);
      setComments(comments.filter(c => c.id !== commentId));

      if (onCommentCountChange) {
        onCommentCountChange(comments.length - 1);
      }

      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const canEditComment = (comment) => {
    return currentUser?.id === comment.authorId || hasTeachingPermissions(courseMembership?.role);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Comments List */}
      {comments.length > 0 && (
        <div className="divide-y divide-gray-200">
          {comments.map(comment => (
            <div key={comment.id} className="px-6 py-4">
              <div className="flex space-x-3">
                <UserCircleIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.authorName}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(comment.authorRole)}`}>
                        {getRoleDisplayName(comment.authorRole)}
                      </span>
                      <span className="text-xs text-gray-500">
                        <ClockIcon className="inline h-3 w-3 mr-1" />
                        {comment.createdAt ? format(new Date(comment.createdAt), 'MMM dd • h:mm a') : 'Just now'}
                      </span>
                      {comment.isEdited && (
                        <span className="text-xs text-gray-500 italic">(edited)</span>
                      )}
                    </div>
                    {canEditComment(comment) && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100"
                          title="Edit comment"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                          title="Delete comment"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-1">
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateComment(comment.id)}
                            className="px-3 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditContent('');
                            }}
                            className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Comment Form */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmitComment} className="flex space-x-3">
          <UserCircleIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  'Posting...'
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                    Post Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}