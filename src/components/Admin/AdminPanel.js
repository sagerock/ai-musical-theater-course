import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, userApi } from '../../services/supabaseApi';
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
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

export default function AdminPanel() {
  // Tab management
  const [activeTab, setActiveTab] = useState('courses');
  
  // Course management state
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  
  // User management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showRemoveFromCourseConfirm, setShowRemoveFromCourseConfirm] = useState(false);
  const [removalData, setRemovalData] = useState(null); // {user, membershipId, courseName}
  const [showAddToCourseModal, setShowAddToCourseModal] = useState(false);
  const [userToAddToCourse, setUserToAddToCourse] = useState(null);
  const [selectedCourseForAdd, setSelectedCourseForAdd] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

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

  // User Management Functions
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const usersData = await userApi.getAllUsers();
      console.log('🔍 Admin Panel - Users data received:', usersData);
      console.log('🔍 Admin Panel - Detailed user analysis:');
      usersData.forEach((user, index) => {
        console.log(`  User ${index + 1}: ${user.name}`);
        console.log(`    - Global role: ${user.role}`);
        console.log(`    - Course memberships:`, user.course_memberships);
        if (user.course_memberships) {
          user.course_memberships.forEach((membership, mIndex) => {
            console.log(`      ${mIndex + 1}. ${membership.role} in ${membership.courses?.title || 'Unknown'} (status: ${membership.status})`);
          });
        }
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      originalName: user.name,
      originalEmail: user.email
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      };
      
      await userApi.updateUser(editingUser.id, updateData);
      toast.success('User updated successfully!');
      setShowEditUserModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteUserConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await userApi.deleteUser(userToDelete.id);
      toast.success('User deleted successfully!');
      setShowDeleteUserConfirm(false);
      setUserToDelete(null);
      loadUsers();
      // Also reload courses to refresh member counts
      loadCourses();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleRemoveFromCourse = (user, membership) => {
    setRemovalData({
      user: user,
      membershipId: membership.membershipId,
      courseName: membership.course
    });
    setShowRemoveFromCourseConfirm(true);
  };

  const confirmRemoveFromCourse = async () => {
    if (!removalData) return;
    
    try {
      await courseApi.removeMemberFromCourse(removalData.membershipId);
      toast.success(`${removalData.user.name} removed from ${removalData.courseName}`);
      setShowRemoveFromCourseConfirm(false);
      setRemovalData(null);
      // Reload users to reflect the change
      loadUsers();
    } catch (error) {
      console.error('Error removing user from course:', error);
      toast.error('Failed to remove user from course');
    }
  };

  const handleAddToCourse = (user) => {
    setUserToAddToCourse(user);
    setSelectedCourseForAdd('');
    setShowAddToCourseModal(true);
  };

  const confirmAddToCourse = async () => {
    if (!userToAddToCourse || !selectedCourseForAdd) return;
    
    try {
      await courseApi.addStudentToCourse(
        userToAddToCourse.id, 
        selectedCourseForAdd, 
        currentUser.id
      );
      
      const selectedCourseName = courses.find(c => c.id === selectedCourseForAdd)?.title || 'course';
      toast.success(`${userToAddToCourse.name} added to ${selectedCourseName}`);
      
      setShowAddToCourseModal(false);
      setUserToAddToCourse(null);
      setSelectedCourseForAdd('');
      
      // Reload users to reflect the change
      loadUsers();
    } catch (error) {
      console.error('Error adding user to course:', error);
      if (error.message.includes('already enrolled')) {
        toast.error('User is already enrolled in this course');
      } else {
        toast.error('Failed to add user to course');
      }
    }
  };

  const getAvailableCoursesForUser = (user) => {
    const userCourseIds = user.course_memberships?.map(m => m.course_id) || [];
    return courses.filter(course => !userCourseIds.includes(course.id));
  };

  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by course
    if (filterCourse !== 'all') {
      filtered = filtered.filter(user => 
        user.course_memberships?.some(membership => 
          membership.course_id === filterCourse && membership.status === 'approved'
        )
      );
    }

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => 
        user.course_memberships?.some(membership => 
          membership.role === filterRole && membership.status === 'approved'
        )
      );
    }

    return filtered;
  };

  const getUserRoles = (user) => {
    console.log('🔍 getUserRoles called for user:', user.name, 'memberships:', user.course_memberships);
    
    if (!user.course_memberships) {
      console.log('❌ No course_memberships found for user:', user.name);
      return [];
    }
    
    const approvedMemberships = user.course_memberships.filter(m => m.status === 'approved');
    console.log('✅ Approved memberships:', approvedMemberships);
    
    // Return each membership individually instead of grouping by role
    const individualRoles = approvedMemberships.map(membership => {
      const courseName = membership.courses?.title || 
                        courses.find(c => c.id === membership.course_id)?.title || 
                        'Unknown Course';
      console.log('📋 Processing membership:', membership, 'Course name:', courseName);
      
      return {
        role: membership.role,
        course: courseName,
        membershipId: membership.id
      };
    });
    
    console.log('📊 Final user roles result:', individualRoles);
    return individualRoles;
  };

  const getGlobalRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      instructor: { color: 'bg-green-100 text-green-800', label: 'Instructor' },
      student: { color: 'bg-blue-100 text-blue-800', label: 'Student' }
    };
    
    const config = roleConfig[role] || roleConfig.student;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getMembershipStats = (course) => {
    const memberships = course.course_memberships || [];
    const approved = memberships.filter(m => m.status === 'approved');
    const pending = memberships.filter(m => m.status === 'pending');
    const instructors = approved.filter(m => m.role === 'instructor').length;
    const students = approved.filter(m => m.role === 'student').length;
    
    return { instructors, students, pending: pending.length };
  };

  if (loading && activeTab === 'courses') {
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
        {activeTab === 'courses' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Course
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'courses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AcademicCapIcon className="h-5 w-5 inline-block mr-2" />
            Course Management
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UsersIcon className="h-5 w-5 inline-block mr-2" />
            User Management
          </button>
        </nav>
      </div>

      {activeTab === 'courses' && (
        <>
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
        </>
      )}

      {activeTab === 'users' && (
        <>
          {/* User Management Controls */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Course Filter */}
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              
              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
              </select>
            </div>
          </div>

          {/* Users List */}
          {usersLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  System Users ({getFilteredUsers().length})
                </h3>
                
                {getFilteredUsers().length === 0 ? (
                  <div className="text-center py-8">
                    <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filterCourse !== 'all' || filterRole !== 'all' 
                        ? 'Try adjusting your search or filters.' 
                        : 'No users have been created yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredUsers().map((user) => {
                      const userRoles = getUserRoles(user);
                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name || 'No Name'}
                                  </div>
                                  {getGlobalRoleBadge(user.role)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                                <div className="mt-1">
                                  {userRoles.length > 0 ? (
                                    <div className="space-y-1">
                                      {userRoles.map((membership, index) => (
                                        <div
                                          key={membership.membershipId || index}
                                          className="flex items-center justify-between bg-gray-50 rounded-md px-2 py-1"
                                        >
                                          <span
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                              membership.role === 'instructor'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}
                                          >
                                            {membership.role} in {membership.course}
                                          </span>
                                          <button
                                            onClick={() => handleRemoveFromCourse(user, membership)}
                                            className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title={`Remove from ${membership.course}`}
                                          >
                                            <TrashIcon className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      No course memberships
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleAddToCourse(user)}
                              className="p-2 text-green-400 hover:text-green-600"
                              title="Add to course"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="Edit user"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 text-red-400 hover:text-red-600"
                              title="Delete user"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'courses' && (
        <>
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
        </>
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

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowEditUserModal(false)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Global Role
                  </label>
                  <select
                    value={editingUser.role || 'student'}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Note:</p>
                      <p>This updates the user's global role and profile. Course-specific roles are managed separately through course management.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserConfirm && userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteUserConfirm(false)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mr-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-3">
                  Are you sure you want to delete <strong>{userToDelete.name || userToDelete.email}</strong>?
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">This action cannot be undone.</p>
                      <p className="mt-1">This will permanently delete:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>User profile and account</li>
                        <li>All course memberships</li>
                        <li>All chat sessions and AI interactions</li>
                        <li>All projects and associated data</li>
                        <li>All uploaded files and attachments</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteUserConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove from Course Confirmation Modal */}
      {showRemoveFromCourseConfirm && removalData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowRemoveFromCourseConfirm(false)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full mr-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Remove from Course</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-3">
                  Are you sure you want to remove <strong>{removalData.user.name}</strong> from <strong>{removalData.courseName}</strong>?
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Note:</p>
                      <p className="mt-1">This will remove the user from the course but will NOT delete their content (projects, chats, etc.). Their data will remain in the system.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRemoveFromCourseConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveFromCourse}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
                >
                  Remove from Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Course Modal */}
      {showAddToCourseModal && userToAddToCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAddToCourseModal(false)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mr-3">
                  <PlusIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Add to Course</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-3">
                  Add <strong>{userToAddToCourse.name}</strong> to a course:
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedCourseForAdd}
                    onChange={(e) => setSelectedCourseForAdd(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Choose a course...</option>
                    {getAvailableCoursesForUser(userToAddToCourse).map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.course_code})
                      </option>
                    ))}
                  </select>
                </div>
                
                {getAvailableCoursesForUser(userToAddToCourse).length === 0 && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Note:</p>
                        <p className="mt-1">This user is already enrolled in all available courses.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddToCourseModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddToCourse}
                  disabled={!selectedCourseForAdd}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}