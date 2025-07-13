import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { instructorNotesApi } from '../../services/supabaseApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  DocumentTextIcon,
  FolderIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function InstructorNotesList() {
  const { courseId } = useParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedNotes, setGroupedNotes] = useState({});
  
  const { currentUser } = useAuth();

  useEffect(() => {
    if (courseId && currentUser) {
      loadInstructorNotes();
    }
  }, [courseId, currentUser]);

  useEffect(() => {
    // Group notes by project
    const grouped = notes.reduce((acc, note) => {
      const projectId = note.project_id;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: note.project,
          notes: []
        };
      }
      acc[projectId].notes.push(note);
      return acc;
    }, {});
    setGroupedNotes(grouped);
  }, [notes]);

  const loadInstructorNotes = async () => {
    try {
      setLoading(true);
      const notesData = await instructorNotesApi.getNotesForDashboard(currentUser.uid, courseId);
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading instructor notes:', error);
      toast.error('Failed to load instructor notes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Instructor Notes</h1>
        <p className="text-gray-600 mt-1">
          Your notes and feedback for student projects in this course.
        </p>
      </div>

      {Object.keys(groupedNotes).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedNotes).map(([projectId, projectData]) => (
            <div key={projectId} className="bg-white rounded-lg shadow border border-gray-200">
              {/* Project Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FolderIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {projectData.project?.title || 'Unknown Project'}
                      </h3>
                      {projectData.project?.student && (
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {projectData.project.student.name} ({projectData.project.student.email})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    {projectData.notes.length} {projectData.notes.length === 1 ? 'note' : 'notes'}
                  </div>
                </div>
              </div>

              {/* Notes List */}
              <div className="p-6">
                <div className="space-y-4">
                  {projectData.notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center">
                          {note.title}
                          {!note.is_visible_to_student && (
                            <span className="ml-2 inline-flex items-center">
                              <EyeSlashIcon className="h-4 w-4 text-gray-400" title="Hidden from student" />
                            </span>
                          )}
                          {note.is_visible_to_student && (
                            <span className="ml-2 inline-flex items-center">
                              <EyeIcon className="h-4 w-4 text-green-500" title="Visible to student" />
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {format(new Date(note.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                        {note.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{format(new Date(note.created_at), 'h:mm a')}</span>
                          {note.updated_at !== note.created_at && (
                            <span>(Updated {format(new Date(note.updated_at), 'MMM dd, yyyy')})</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {note.is_visible_to_student ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              Visible
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <EyeSlashIcon className="h-3 w-3 mr-1" />
                              Hidden
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notes yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't created any notes for student projects in this course yet. 
            Visit individual student projects to add notes.
          </p>
        </div>
      )}
    </div>
  );
}