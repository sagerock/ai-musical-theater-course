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
  ChevronUpIcon
} from '@heroicons/react/24/outline';

export default function InstructorNotes({ project, courseId, isInstructorView = false }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_visible_to_student: true
  });

  const { currentUser, userRole } = useAuth();
  const isInstructor = userRole === 'instructor' || userRole === 'admin';

  useEffect(() => {
    if (project?.id) {
      loadNotes();
    }
  }, [project?.id]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesData = await instructorNotesApi.getProjectNotes(project.id);
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading instructor notes:', error);
      toast.error('Failed to load instructor notes');
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
        is_visible_to_student: formData.is_visible_to_student
      });

      setNotes([newNote, ...notes]);
      setFormData({ title: '', content: '', is_visible_to_student: true });
      setShowCreateForm(false);
      toast.success('Note created successfully!');

      // Send email notification to student if note is visible to them
      if (formData.is_visible_to_student) {
        try {
          // Get student and course information for email
          const [studentInfo, courseInfo] = await Promise.all([
            userApi.getUserById(project.user_id),
            courseApi.getCourseById(courseId)
          ]);

          if (studentInfo && courseInfo) {
            await emailNotifications.notifyStudentOfInstructorNote({
              studentId: project.user_id,
              studentName: getDisplayNameForEmail(studentInfo, 'student'),
              studentEmail: studentInfo.email,
              instructorName: getDisplayNameForEmail(currentUser, 'instructor'),
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
    setFormData({ title: '', content: '', is_visible_to_student: true });
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
    <div className={`bg-white rounded-lg border border-gray-200 transition-all duration-200 ${
      isCollapsed ? 'shadow-sm' : 'shadow'
    }`}>
      {/* Header - Always visible */}
      <div className={`px-4 py-3 ${!isCollapsed ? 'border-b border-gray-200' : ''}`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center hover:bg-gray-50 rounded-md p-1 -ml-1 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 mr-2">
              {isInstructorView ? 'Your Notes' : 'Instructor Notes'}
            </h3>
            <span className="text-sm text-gray-500 mr-2">({notes.length})</span>
            {isCollapsed ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronUpIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          {!isCollapsed && isInstructor && isInstructorView && (
            <button
              onClick={startCreate}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Add Note
            </button>
          )}
        </div>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="p-6">
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

        {/* Notes List */}
        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{note.title}</h4>
                      {isInstructor && isInstructorView && (
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
                        {note.users && (
                          <span>By: {note.users.name}</span>
                        )}
                        <span>{format(new Date(note.created_at), 'MMM dd, yyyy at h:mm a')}</span>
                      </div>
                      {!note.is_visible_to_student && isInstructorView && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Hidden from student
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {isInstructorView ? 'No notes yet' : 'No instructor notes'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isInstructorView 
                ? 'Create your first note for this student project.'
                : 'Your instructor hasn\'t added any notes for this project yet.'
              }
            </p>
          </div>
        )}
        </div>
      )}

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