import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/supabaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PendingApprovals from '../Instructor/PendingApprovals';
import AdminMessaging from '../Messaging/AdminMessaging';
import {
  PlusIcon,
  AcademicCapIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function AdminPanel() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [testingRLS, setTestingRLS] = useState(false);
  const [syncingUsers, setSyncingUsers] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    semester: 'Spring',
    year: new Date().getFullYear()
  });
  const [editCourse, setEditCourse] = useState({
    name: '',
    description: '',
    semester: 'Spring',
    year: new Date().getFullYear()
  });

  const { currentUser } = useAuth();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await courseApi.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    try {
      // Generate course code
      const courseCode = await courseApi.generateCourseCode(
        newCourse.name,
        newCourse.semester,
        newCourse.year
      );

      // Create course
      const courseData = {
        title: newCourse.name,  // Map name to title for database
        description: newCourse.description,
        semester: newCourse.semester,
        year: newCourse.year,
        course_code: courseCode,
        created_by: currentUser.id
      };

      await courseApi.createCourse(courseData);
      
      toast.success(`Course created successfully! Code: ${courseCode}`);
      setShowCreateModal(false);
      setNewCourse({
        name: '',
        description: '',
        semester: 'Spring',
        year: new Date().getFullYear()
      });
      
      // Reload courses
      loadCourses();
      
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setEditCourse({
      name: course.title,  // Map title to name for the form
      description: course.description || '',
      semester: course.semester,
      year: course.year
    });
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        title: editCourse.name,  // Map name back to title for database
        description: editCourse.description,
        semester: editCourse.semester,
        year: editCourse.year
      };
      await courseApi.updateCourse(editingCourse.id, updateData);
      toast.success('Course updated successfully!');
      setShowEditModal(false);
      setEditingCourse(null);
      loadCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    }
  };

  const handleDeleteCourse = async () => {
    if (!editingCourse) return;
    
    try {
      await courseApi.deleteCourse(editingCourse.id);
      toast.success('Course deleted successfully!');
      setShowDeleteConfirm(false);
      setShowEditModal(false);
      setEditingCourse(null);
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleMemberRoleChange = async (membershipId, currentRole) => {
    const newRole = currentRole === 'student' ? 'instructor' : 'student';
    
    try {
      await courseApi.updateMemberRole(membershipId, newRole);
      toast.success(`Member role changed to ${newRole}`);
      loadCourses();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = (membership) => {
    setMemberToRemove(membership);
    setShowRemoveMemberConfirm(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      await courseApi.removeMemberFromCourse(memberToRemove.id);
      toast.success('Member removed successfully!');
      setShowRemoveMemberConfirm(false);
      setMemberToRemove(null);
      loadCourses();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleCleanupOrphanedData = async () => {
    try {
      setCleaningUp(true);
      const result = await courseApi.cleanupOrphanedMemberships();
      toast.success(result.message);
      if (result.deleted > 0) {
        loadCourses(); // Reload to refresh the display
      }
    } catch (error) {
      console.error('Error cleaning up orphaned data:', error);
      toast.error('Failed to clean up orphaned data');
    } finally {
      setCleaningUp(false);
    }
  };

  const handleTestRLS = async () => {
    try {
      setTestingRLS(true);
      
      // Test current access to projects
      console.log('🧪 Testing RLS implementation...');
      
      // Try to access projects via service API
      const result = await courseApi.testRLSImplementation();
      
      if (result.success) {
        toast.success('RLS test completed successfully! Check console for details.');
      } else {
        toast.error('RLS test encountered issues. Check console for details.');
      }
      
    } catch (error) {
      console.error('Error testing RLS:', error);
      toast.error('Failed to test RLS implementation');
    } finally {
      setTestingRLS(false);
    }
  };

  const handleSyncUsers = async () => {
    try {
      setSyncingUsers(true);
      
      console.log('🔄 Starting user sync...');
      
      const result = await courseApi.syncAllAuthUsers();
      
      if (result.success) {
        toast.success(result.summary);
      } else {
        toast.error(result.summary);
      }
      
    } catch (error) {
      console.error('Error syncing users:', error);
      toast.error('Failed to sync users');
    } finally {
      setSyncingUsers(false);
    }
  };

  const getMembershipStats = (course) => {
    const memberships = course.course_memberships || [];
    const approved = memberships.filter(m => m.status === 'approved');
    const pending = memberships.filter(m => m.status === 'pending');
    const instructors = approved.filter(m => m.role === 'instructor').length;
    const students = approved.filter(m => m.role === 'student').length;
    
    return { instructors, students, pending: pending.length };
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">
            Manage courses, instructors, and system settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncUsers}
            disabled={syncingUsers}
            className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
            title="Sync authenticated user to database"
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            {syncingUsers ? 'Syncing...' : 'Sync User'}
          </button>
          <button
            onClick={handleTestRLS}
            disabled={testingRLS}
            className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
            title="Test RLS implementation on projects table"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            {testingRLS ? 'Testing...' : 'Test RLS'}
          </button>
          <button
            onClick={handleCleanupOrphanedData}
            disabled={cleaningUp}
            className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50"
            title="Remove orphaned data records"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            {cleaningUp ? 'Cleaning...' : 'Cleanup Data'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Course
          </button>
        </div>
      </div>

      {/* Admin Messaging Section */}
      <div className="mb-8">
        <AdminMessaging />
      </div>

      {/* Pending Approvals Section */}
      {courses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Membership Requests</h2>
          <div className="space-y-4">
            {courses.map((course) => (
              <PendingApprovals 
                key={course.id}
                courseId={course.id} 
                courseName={course.title}
              />
            ))}
          </div>
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const stats = getMembershipStats(course);
          return (
            <div key={course.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {course.semester} {course.year}
                  </p>
                  <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Code: {course.course_code}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleEditCourse(course)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {course.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {course.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-1">
                    <AcademicCapIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{stats.instructors}</div>
                  <div className="text-xs text-gray-500">Instructors</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
                    <UsersIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{stats.students}</div>
                  <div className="text-xs text-gray-500">Students</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mx-auto mb-1">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{stats.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Created {format(new Date(course.created_at), 'MMM dd, yyyy')}
              </div>
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first course.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Course
            </button>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Course</h3>
              
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourse.name}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Musical Theater AI"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Exploring AI tools in musical theater production"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={newCourse.semester}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      required
                      value={newCourse.year}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 5}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedCourse(null)}></div>
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedCourse.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Course Code:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedCourse.course_code}</span>
                </div>
                
                {selectedCourse.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Description:</span>
                    <p className="mt-1 text-sm text-gray-900">{selectedCourse.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Course Members</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedCourse.course_memberships?.map((membership) => (
                      <div key={membership.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {membership.users?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {membership.users?.email || 'No email available'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            membership.role === 'instructor' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {membership.role}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            membership.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : membership.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {membership.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Course: {editingCourse.name}</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateCourse} className="space-y-6">
                {/* Course Details */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Course Details</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editCourse.name}
                        onChange={(e) => setEditCourse(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editCourse.description}
                        onChange={(e) => setEditCourse(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Semester
                        </label>
                        <select
                          value={editCourse.semester}
                          onChange={(e) => setEditCourse(prev => ({ ...prev, semester: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Spring">Spring</option>
                          <option value="Summer">Summer</option>
                          <option value="Fall">Fall</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          required
                          value={editCourse.year}
                          onChange={(e) => setEditCourse(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          min={new Date().getFullYear() - 5}
                          max={new Date().getFullYear() + 5}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Members Management */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Manage Members</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {editingCourse.course_memberships?.map((membership) => (
                      <div key={membership.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {membership.users?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {membership.users?.email || 'No email available'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            membership.role === 'instructor' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {membership.role}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            membership.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : membership.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {membership.status}
                          </span>
                          {membership.status === 'approved' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMemberRoleChange(membership.id, membership.role)}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Switch to {membership.role === 'student' ? 'Instructor' : 'Student'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(membership)}
                                className="p-1 text-red-400 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Course
                  </button>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Update Course
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteConfirm(false)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mr-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Delete Course</h3>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete "{editingCourse?.name}"? This action cannot be undone and will permanently delete all course data, projects, and chat sessions.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCourse}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveMemberConfirm && memberToRemove && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowRemoveMemberConfirm(false)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mr-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Remove Member</h3>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to remove {memberToRemove.users?.name || 'this member'} from the course? They will lose access to all course content and their progress may be affected.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRemoveMemberConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveMember}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Remove Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}