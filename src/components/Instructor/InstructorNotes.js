import React, { useState, useEffect } from 'react';
import { instructorNotesApi, userApi, projectApi, courseApi } from '../../services/firebaseApi';
import { useAuth } from '../../contexts/AuthContext';
import { emailNotifications, getDisplayNameForEmail } from '../../services/emailService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function InstructorNotes({ project, courseId, isInstructorView = false, isStudentView = false, onTotalCountChange }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(isStudentView); // Students start collapsed, instructors start expanded
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [replyingToNote, setReplyingToNote] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [readNotes, setReadNotes] = useState(new Set()); // Track read status
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_visible_to_student: true
  });
  const [replyContent, setReplyContent] = useState('');

  const { currentUser, userRole } = useAuth();
  const isInstructor = userRole === 'instructor' || userRole === 'admin';
  const isProjectOwner = project && currentUser && (project.createdBy === currentUser.id || project.created_by === currentUser.id);


  useEffect(() => {
    if (project?.id) {
      loadNotes();
    }
  }, [project?.id]);

  // Auto-expand threads with new replies and mark as read
  useEffect(() => {
    const newlyExpandedThreads = new Set();
    let totalCount = 0;

    const countAllMessages = (notesList) => {
      notesList.forEach(note => {
        // Count this message
        totalCount++;

        // Auto-expand if has unread replies
        if (note.hasReplies && note.replies && note.replies.length > 0) {
          const hasUnreadReplies = note.replies.some(reply => !readNotes.has(reply.id));
          if (hasUnreadReplies) {
            newlyExpandedThreads.add(note.id);
          }
        }

        // Mark as read after a short delay
        if (!readNotes.has(note.id)) {
          setTimeout(() => {
            setReadNotes(prev => new Set([...prev, note.id]));
          }, 2000);
        }

        // Recurse for replies and count them
        if (note.replies) {
          countAllMessages(note.replies);
        }
      });
    };

    // Only count visible notes for students
    const visibleNotes = notes.filter(note => isStudentView ? note.is_visible_to_student : true);
    countAllMessages(visibleNotes);

    // Update total count in parent
    if (onTotalCountChange) {
      onTotalCountChange(totalCount);
    }

    if (newlyExpandedThreads.size > 0) {
      setExpandedThreads(prev => new Set([...prev, ...newlyExpandedThreads]));
    }
  }, [notes, readNotes, onTotalCountChange, isStudentView]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await instructorNotesApi.getProjectNotes(project.id);
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading instructor notes:', error);
      // Check if this is an index building error
      if (error.message && error.message.includes('query requires an index')) {
        toast.error('Instructor notes are still setting up. Please try again in a few minutes.');
      } else {
        toast.error('Failed to load instructor notes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const newNote = await instructorNotesApi.createNote({
        project_id: project.id,
        instructor_id: currentUser.id,
        course_id: courseId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        is_visible_to_student: formData.is_visible_to_student,
        authorId: currentUser.id,
        authorRole: userRole,
        authorName: currentUser.displayName || currentUser.name || currentUser.email
      });

      // Add author info for display (should already be set from API response, but ensure it's there)
      if (!newNote.authorName) {
        newNote.authorName = currentUser.displayName || currentUser.name || currentUser.email;
      }
      newNote.replies = [];

      console.log('🔍 New note created with author:', newNote.authorName, 'from currentUser:', currentUser);

      setNotes([newNote, ...notes]);
      setFormData({ title: '', content: '', is_visible_to_student: true });
      setShowCreateForm(false);
      toast.success('Note created successfully!');

      // Send email notification to student if note is visible to them
      if (formData.is_visible_to_student) {
        try {
          // Get student and course information for email
          const [studentInfo, courseInfo] = await Promise.all([
            userApi.getUserById(project.createdBy || project.created_by),
            courseApi.getCourseById(courseId)
          ]);

          if (studentInfo && courseInfo) {
            await emailNotifications.notifyStudentOfInstructorNote({
              studentId: project.createdBy || project.created_by,
              studentName: getDisplayNameForEmail(studentInfo, 'student'),
              studentEmail: studentInfo.email,
              instructorName: getDisplayNameForEmail(currentUser, 'instructor'),
              instructorEmail: currentUser.email, // Add instructor email for reply-to
              projectTitle: project.title,
              projectId: project.id,
              noteContent: formData.content.trim(),
              courseName: courseInfo.name
            });

            console.log('✅ Email notification sent to student');
          }
        } catch (emailError) {
          console.error('❌ Failed to send email notification:', emailError);
          // Don't show error to user - note was created successfully
        }
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };

  const handleReply = async (noteId, e) => {
    e?.preventDefault();

    if (!replyContent.trim()) {
      toast.error('Reply content is required');
      return;
    }

    console.log('🔍 DEBUG: Attempting to reply with:', {
      noteId,
      currentUserId: currentUser.id,
      userRole,
      projectId: project.id,
      courseId: project.course_id
    });

    try {
      const reply = await instructorNotesApi.replyToNote(noteId, {
        content: replyContent.trim(),
        authorId: currentUser.id,
        authorRole: userRole,
        authorName: currentUser.displayName || currentUser.name || currentUser.email
      });

      // Add author info for display
      reply.authorName = currentUser.displayName || currentUser.name || currentUser.email;

      // Update the notes state to include the reply
      const updateNotesWithReply = (notesList) => {
        return notesList.map(note => {
          if (note.id === noteId) {
            return {
              ...note,
              hasReplies: true,
              replies: [...(note.replies || []), reply]
            };
          }
          if (note.replies && note.replies.length > 0) {
            return {
              ...note,
              replies: updateNotesWithReply(note.replies)
            };
          }
          return note;
        });
      };

      setNotes(updateNotesWithReply(notes));
      setReplyingToNote(null);
      setReplyContent('');
      toast.success('Reply posted successfully!');

      // Send email notification
      try {
        // Determine who to notify
        const parentNote = findNoteById(notes, noteId);
        const notifyUserId = parentNote.authorRole === userRole ?
          (project.createdBy || project.created_by) : // Notify student if instructor replied to own note
          parentNote.authorId; // Notify the author of the parent note

        if (notifyUserId !== currentUser.id) { // Don't notify yourself
          const [recipientInfo, courseInfo] = await Promise.all([
            userApi.getUserById(notifyUserId),
            courseApi.getCourseById(courseId)
          ]);

          if (recipientInfo && courseInfo) {
            await emailNotifications.notifyUserOfReply({
              recipientId: notifyUserId,
              recipientName: getDisplayNameForEmail(recipientInfo, recipientInfo.role || 'user'),
              recipientEmail: recipientInfo.email,
              senderName: getDisplayNameForEmail(currentUser, userRole),
              senderEmail: currentUser.email,
              projectTitle: project.title,
              projectId: project.id,
              replyContent: replyContent.trim(),
              parentNoteTitle: parentNote.title,
              courseName: courseInfo.name
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const findNoteById = (notesList, noteId) => {
    for (const note of notesList) {
      if (note.id === noteId) return note;
      if (note.replies) {
        const found = findNoteById(note.replies, noteId);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleThread = (noteId) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleEditNote = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const updatedNote = await instructorNotesApi.updateNote(
        editingNote.id,
        {
          title: formData.title.trim(),
          content: formData.content.trim(),
          is_visible_to_student: formData.is_visible_to_student
        },
        currentUser.id
      );

      setNotes(notes.map(note => 
        note.id === editingNote.id ? updatedNote : note
      ));
      setEditingNote(null);
      setFormData({ title: '', content: '', is_visible_to_student: true });
      toast.success('Note updated successfully!');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (note) => {
    try {
      await instructorNotesApi.deleteNote(note.id, currentUser.id);
      setNotes(notes.filter(n => n.id !== note.id));
      setDeletingNote(null);
      toast.success('Note deleted successfully!');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const startEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      is_visible_to_student: note.is_visible_to_student
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setFormData({ title: '', content: '', is_visible_to_student: true });
  };

  const startCreate = () => {
    setShowCreateForm(true);
    setEditingNote(null);
    setReplyingToNote(null);
    setFormData({ title: '', content: '', is_visible_to_student: true });
  };

  const startReply = (note) => {
    setReplyingToNote(note.id);
    setReplyContent('');
    setShowCreateForm(false);
    setEditingNote(null);
  };

  const cancelReply = () => {
    setReplyingToNote(null);
    setReplyContent('');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Quick Stats Bar */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-1 text-primary-600" />
              {isStudentView ? notes.filter(note => note.is_visible_to_student).length : notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
            {notes.some(n => n.hasReplies) && (
              <span className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1 text-green-600" />
                Active conversations
              </span>
            )}
          </div>
          {isInstructor && isInstructorView && (
            <button
              onClick={startCreate}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              New Note
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
          {/* Create/Edit Form */}
          {(showCreateForm || editingNote) && isInstructor && isInstructorView && (
          <form onSubmit={editingNote ? handleEditNote : handleCreateNote} className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter note title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Write your note content here..."
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_visible_to_student"
                  checked={formData.is_visible_to_student}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Visible to student
                </label>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-4">
              <button
                type="submit"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <CheckIcon className="h-3 w-3 mr-1" />
                {editingNote ? 'Update Note' : 'Create Note'}
              </button>
              <button
                type="button"
                onClick={editingNote ? cancelEdit : () => setShowCreateForm(false)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <XMarkIcon className="h-3 w-3 mr-1" />
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Notes List with Threading */}
        {(() => {
          const visibleNotes = notes.filter(note => isStudentView ? note.is_visible_to_student : true);

          const renderNote = (note, isReply = false, depth = 0) => {
            const isUnread = !readNotes.has(note.id);

            return (
            <div key={note.id} className={`${isReply ? 'ml-8 mt-3' : ''} ${isUnread ? 'relative' : ''}`}>
              {/* Unread indicator */}
              {isUnread && (
                <div className="absolute -left-2 top-4 w-1 h-8 bg-primary-500 rounded-r animate-pulse" />
              )}

              <div className={`border ${
                isReply ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'
              } ${
                isUnread ? 'shadow-sm ring-1 ring-primary-200' : ''
              } rounded-lg p-4 transition-all duration-300`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">{note.title}</h4>
                        {note.authorRole && (
                          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            note.authorRole === 'instructor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {note.authorRole === 'instructor' ? 'Instructor' : 'Student'}
                          </span>
                        )}
                      </div>
                      {isInstructor && isInstructorView && !isReply && !note.parentId && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEdit(note)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit note"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingNote(note)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete note"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                      {note.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>By: {note.authorName || note.users?.name || 'Unknown'}</span>
                        <span>{(() => {
                          if (!note.created_at && !note.createdAt) return 'Unknown date';
                          const date = note.created_at?.toDate ? note.created_at.toDate() :
                                     note.createdAt ? new Date(note.createdAt) :
                                     new Date(note.created_at);
                          if (isNaN(date.getTime())) return 'Unknown date';
                          return format(date, 'MMM dd, yyyy \'at\' h:mm a');
                        })()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!note.is_visible_to_student && isInstructorView && !isReply && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Hidden from student
                          </span>
                        )}
                        {/* Reply button */}
                        {(isInstructor || isProjectOwner) && (
                          <button
                            onClick={() => startReply(note)}
                            className="inline-flex items-center text-primary-600 hover:text-primary-800 text-xs"
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                            </svg>
                            Reply
                          </button>
                        )}
                        {note.hasReplies && note.replies && note.replies.length > 0 && (
                          <button
                            onClick={() => toggleThread(note.id)}
                            className="inline-flex items-center text-gray-500 hover:text-gray-700 text-xs"
                          >
                            {expandedThreads.has(note.id) ? (
                              <>
                                <ChevronUpIcon className="h-3 w-3 mr-1" />
                                Hide {note.replies.length} {note.replies.length === 1 ? 'reply' : 'replies'}
                              </>
                            ) : (
                              <>
                                <ChevronDownIcon className="h-3 w-3 mr-1" />
                                Show {note.replies.length} {note.replies.length === 1 ? 'reply' : 'replies'}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reply Form */}
                {replyingToNote === note.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <form onSubmit={(e) => handleReply(note.id, e)} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Your reply
                        </label>
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Write your reply..."
                          autoFocus
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="submit"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Post Reply
                        </button>
                        <button
                          type="button"
                          onClick={cancelReply}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Render replies */}
              {note.replies && note.replies.length > 0 && expandedThreads.has(note.id) && (
                <div className="mt-2">
                  {note.replies.map(reply => renderNote(reply, true, depth + 1))}
                </div>
              )}
            </div>
          );
          };

          return visibleNotes.length > 0 ? (
            <div className="space-y-4">
              {visibleNotes.map(note => renderNote(note))}
            </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {isStudentView ? 'No feedback yet' : (isInstructorView ? 'No notes yet' : 'No instructor notes')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isStudentView
                ? 'Your instructor hasn\'t provided any feedback for this project yet.'
                : (isInstructorView 
                  ? 'Create your first note for this student project.'
                  : 'Your instructor hasn\'t added any notes for this project yet.'
                )
              }
            </p>
          </div>
          );
        })()}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingNote && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Delete Note
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete the note "{deletingNote.title}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => handleDeleteNote(deletingNote)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingNote(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}