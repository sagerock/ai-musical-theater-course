import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectApi, courseApi } from '../../services/supabaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { currentUser } = useAuth();
  const { courseId } = useParams();

  useEffect(() => {
    loadProjects();
    if (courseId) {
      loadCourseInfo();
    }
  }, [currentUser, courseId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // Load projects based on whether we're in a course context or not
      const userProjects = courseId 
        ? await projectApi.getUserProjects(currentUser.uid, courseId)
        : await projectApi.getUserProjects(currentUser.uid);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseInfo = async () => {
    try {
      const courseData = await courseApi.getCourseById(courseId);
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course info:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    // If we're in a course context, require courseId for project creation
    if (courseId && !courseId) {
      toast.error('Course context required to create project');
      return;
    }

    try {
      setCreating(true);
      const newProject = await projectApi.createProject(formData, currentUser.uid, courseId);
      setProjects([newProject, ...projects]);
      setShowCreateModal(false);
      setFormData({ title: '', description: '' });
      toast.success('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      setDeleting(true);
      await projectApi.deleteProject(projectToDelete.id, currentUser.uid);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      toast.success('Project deleted successfully!');
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(error.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const isProjectOwner = (project) => {
    return project.created_by === currentUser.uid;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {courseId ? `${course?.name || 'Course'} Projects` : 'Projects'}
          </h1>
          <p className="text-gray-600 mt-1">
            {courseId 
              ? `Manage projects for ${course?.course_code || 'this course'}`
              : 'Manage your AI interaction projects and collaborate with your team.'
            }
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          New Project
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <FolderIcon className="h-8 w-8 text-primary-500" />
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {isProjectOwner(project) ? 'Owner' : 'Member'}
                      </p>
                    </div>
                  </div>
                  {isProjectOwner(project) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete project"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Created {format(new Date(project.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Link
                    to={`/chat/${project.id}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    Open Chat
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            Get started by creating your first project. Projects help you organize your AI interactions and collaborate with others.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Project
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateProject}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Create New Project</h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter project title"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Describe your project"
                      />
                    </div>

                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mr-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Delete Project</h3>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete "{projectToDelete.title}"? This action cannot be undone and will permanently delete all associated chats and data.
                </p>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmDeleteProject}
                  disabled={deleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Project'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 