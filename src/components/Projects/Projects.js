import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectApi, courseApi } from '../../services/firebaseApi';
import { hasStudentAssistantPermissions, hasTeachingPermissions } from '../../utils/roleUtils';
import { emailNotifications, getDisplayNameForEmail } from '../../services/emailService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [allCourseProjects, setAllCourseProjects] = useState([]);
  const [userRole, setUserRole] = useState(null);
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
  const [editingProject, setEditingProject] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: ''
  });
  const { currentUser } = useAuth();
  const { courseId } = useParams();

  useEffect(() => {
    loadProjects();
    if (courseId) {
      loadCourseInfo();
    }
  }, [currentUser, courseId]);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📂 Projects: Loading projects...');
      console.log('  - Current user:', currentUser.id);
      console.log('  - Course ID:', courseId);
      console.log('  - Current URL:', window.location.pathname);
      
      console.log('📂 Projects: Firebase user, loading data...');
      
      let courseMembership = null;
      
      // If accessing a specific course, verify the user is enrolled
      // Instructors can access regardless of approval status
      if (courseId) {
        console.log('🔍 Projects: Verifying course membership for courseId:', courseId);
        const userCourses = await courseApi.getUserCourses(currentUser.id);
        courseMembership = userCourses.find(membership => 
          membership.courses.id === courseId
        );
        
        if (!courseMembership) {
          console.log('❌ Projects: User not enrolled in course:', courseId);
          toast.error('Access denied: You are not enrolled in this course');
          setProjects([]);
          setLoading(false);
          return;
        }
        
        // Import permission check function
        const { hasTeachingPermissions } = await import('../../utils/roleUtils');
        
        // Students need approval, teaching staff and student assistants can access immediately
        const canAccessCourse = hasTeachingPermissions(courseMembership.role) || 
                               (courseMembership.role === 'student' && courseMembership.status === 'approved') ||
                               (courseMembership.role === 'student_assistant' && courseMembership.status === 'approved');
        
        if (!canAccessCourse) {
          console.log('❌ Projects: User cannot access course - role:', courseMembership.role, 'status:', courseMembership.status);
          toast.error('Access denied: You must be approved to access course projects');
          setProjects([]);
          setLoading(false);
          return;
        }
        
        console.log('✅ Projects: User verified for course access');
        
        // Store user role for UI decisions
        setUserRole(courseMembership.role);
      }
      
      // Load projects based on whether we're in a course context or not
      const userProjects = courseId 
        ? await projectApi.getUserProjects(currentUser.id, courseId)
        : await projectApi.getUserProjects(currentUser.id);
      
      console.log('  - User projects loaded:', userProjects.length);
      console.log('  - Projects:', userProjects.map(p => ({ id: p.id, title: p.title, course_id: p.course_id, created_at: p.created_at })));
      
      setProjects(userProjects);
      
      // If user is a Student Assistant or has teaching permissions, load all course projects
      if (courseId && courseMembership && 
          (hasStudentAssistantPermissions(courseMembership.role) || hasTeachingPermissions(courseMembership.role))) {
        console.log('📂 Loading all course projects for', courseMembership.role, '...');
        try {
          const courseProjects = await projectApi.getAllProjects(courseId);
          // Filter out user's own projects to avoid duplicates
          const peerProjects = courseProjects.filter(p => p.createdBy !== currentUser.id);
          console.log('  - All course projects loaded:', peerProjects.length);
          setAllCourseProjects(peerProjects);
        } catch (error) {
          console.error('Error loading course projects:', error);
          // Don't fail the whole load, just log the error
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [currentUser, courseId]);

  const loadCourseInfo = useCallback(async () => {
    try {
      // Check if this is a Firebase user (Firebase UIDs don't follow UUID format)
      console.log('🔍 Projects: Loading course info using Firebase API');
      
      const courseData = await courseApi.getCourseById(courseId);
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course info:', error);
    }
  }, [currentUser, courseId]);

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

    // SECURITY: Projects can only be created within a course context
    if (!courseId) {
      toast.error('Projects can only be created within a course. Please access projects from a course page.');
      return;
    }

    // Verify the user is enrolled in the course before creating project
    // Instructors can create projects regardless of approval status
    console.log('🔍 Projects: Verifying course membership before project creation for courseId:', courseId);
    const userCourses = await courseApi.getUserCourses(currentUser.id);
    const courseMembership = userCourses.find(membership => 
      membership.courses.id === courseId
    );
    
    if (!courseMembership) {
      console.log('❌ Projects: User not enrolled in course:', courseId);
      toast.error('Access denied: You are not enrolled in this course');
      return;
    }
    
    // Students need approval, instructors and student assistants can create projects immediately
    const canCreateProject = courseMembership.role === 'instructor' || 
                           (courseMembership.role === 'student' && courseMembership.status === 'approved') ||
                           (courseMembership.role === 'student_assistant' && courseMembership.status === 'approved');
    
    if (!canCreateProject) {
      console.log('❌ Projects: User cannot create projects - role:', courseMembership.role, 'status:', courseMembership.status);
      toast.error('Access denied: You must be approved to create projects');
      return;
    }
    
    console.log('✅ Projects: User verified for course project creation');

    try {
      setCreating(true);
      const newProject = await projectApi.createProject(formData, currentUser.id, courseId);
      setProjects([newProject, ...projects]);
      setShowCreateModal(false);
      setFormData({ title: '', description: '' });
      toast.success('Project created successfully!');

      // Send email notification to instructors if project is in a course
      if (courseId) {
        try {
          // Get course information 
          const courseInfo = await courseApi.getCourseById(courseId);

          if (courseInfo) {
            await emailNotifications.notifyInstructorOfNewProject({
              studentId: currentUser.id,
              studentName: getDisplayNameForEmail(currentUser, 'student'),
              projectTitle: formData.title.trim(),
              projectDescription: formData.description.trim(),
              projectId: newProject.id,
              courseName: courseInfo.name,
              courseId: courseId
            });
            
            console.log('✅ Email notifications sent to instructors');
          }
        } catch (emailError) {
          console.error('❌ Failed to send email notifications:', emailError);
          // Don't show error to user - project was created successfully
        }
      }
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
    
    // Check if this is a Firebase user (Firebase UIDs don't follow UUID format)
    // Using Firebase API
    
    try {
      setDeleting(true);
      await projectApi.deleteProject(projectToDelete.id, currentUser.id);
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

  const startEditProject = (project) => {
    setEditingProject(project);
    setEditFormData({
      title: project.title,
      description: project.description || ''
    });
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    if (!editFormData.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    
    if (!editingProject) return;
    
    try {
      await projectApi.updateProject(editingProject.id, {
        title: editFormData.title.trim(),
        description: editFormData.description.trim()
      });
      
      // Update local state
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, title: editFormData.title.trim(), description: editFormData.description.trim() }
          : p
      ));
      
      toast.success('Project updated successfully!');
      setEditingProject(null);
      setEditFormData({ title: '', description: '' });
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'Failed to update project');
    }
  };

  const cancelEditProject = () => {
    setEditingProject(null);
    setEditFormData({ title: '', description: '' });
  };

  const isProjectOwner = (project) => {
    return project.created_by === currentUser.id;
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
        <div className="flex items-center space-x-3">
          {/* Course Members Link for Student Assistants */}
          {courseId && userRole && hasStudentAssistantPermissions(userRole) && (
            <Link
              to={`/course/${courseId}/students`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <UserIcon className="-ml-1 mr-2 h-4 w-4" />
              Course Members
            </Link>
          )}
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Project
          </button>
        </div>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {editingProject?.id === project.id ? (
                  /* Edit Form */
                  <form onSubmit={handleEditProject} className="w-full">
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                          className="w-full text-lg font-semibold text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Project title"
                          autoFocus
                        />
                      </div>
                      <div>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                          className="w-full text-sm text-gray-600 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Project description (optional)"
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={cancelEditProject}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Normal Display */
                  <>
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
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditProject(project);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit project"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
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
                        </div>
                      )}
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </>
                )}

                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Created {project.created_at ? format(new Date(project.created_at), 'MMM dd, yyyy') : 'Unknown date'}
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

      {/* All Course Projects Section for Student Assistants and Teaching Staff */}
      {courseId && userRole && 
       (hasStudentAssistantPermissions(userRole) || hasTeachingPermissions(userRole)) && 
       allCourseProjects.length > 0 && (
        <div className="mt-12">
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Course Projects</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {hasTeachingPermissions(userRole) 
                    ? `All student projects in ${course?.name || 'this course'}`
                    : `Projects from other students in ${course?.name || 'this course'} - available for peer assistance`
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  hasTeachingPermissions(userRole) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {userRole === 'school_administrator' ? 'School Administrator' :
                   userRole === 'teaching_assistant' ? 'Teaching Assistant' :
                   userRole === 'instructor' ? 'Instructor' :
                   'Student Assistant'}
                </span>
                <span className="text-sm text-gray-500">
                  {allCourseProjects.length} {hasTeachingPermissions(userRole) ? 'student' : 'peer'} {allCourseProjects.length === 1 ? 'project' : 'projects'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCourseProjects.map((project) => (
                <div key={`peer-${project.id}`} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <FolderIcon className="h-8 w-8 text-blue-500" />
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {project.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            By {project.users?.name || project.userName || 'Anonymous Student'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Peer Project
                        </span>
                      </div>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Created {project.created_at ? format(new Date(project.created_at), 'MMM dd, yyyy') : 'Unknown date'}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <Link
                        to={`/chat/${project.id}`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                        View Project
                      </Link>
                      <div className="text-xs text-gray-400">
                        Read-only access
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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