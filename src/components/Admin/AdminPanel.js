import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, userApi, tagApi } from '../../services/firebaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import approvalEmailService from '../../services/approvalEmailService';
import AdminMessaging from '../Messaging/AdminMessaging';
import UsageAnalytics from './UsageAnalytics';
import { 
  ROLES, 
  ROLE_LABELS, 
  getRoleDisplayName, 
  getRoleStyle,
  canManageRole 
} from '../../utils/roleUtils';
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
  UserCircleIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ChevronDownIcon
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
  const [selectedRoleForAdd, setSelectedRoleForAdd] = useState('student');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pending approvals state
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [processingApproval, setProcessingApproval] = useState({});
  const [approvalRoleSelection, setApprovalRoleSelection] = useState({}); // Track role selection for each approval
  
  // Global tags state
  const [creatingGlobalTags, setCreatingGlobalTags] = useState(false);
  const [fixingAccessCodes, setFixingAccessCodes] = useState(false);
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

  // Check if this is a Firebase user (Firebase UIDs don't follow UUID format)
  const isFirebaseUser = currentUser?.id && !currentUser.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

  // Handle URL parameters for direct navigation to tabs
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['courses', 'users', 'approvals', 'messaging', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'approvals') {
      loadPendingApprovals();
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
        createdBy: currentUser.id  // Firebase uses createdBy
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

  const handleMemberRoleChange = async (membershipId, newRole, memberName) => {
    try {
      const changedBy = currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrator';
      await courseApi.updateMemberRole(membershipId, newRole, changedBy);
      toast.success(`${memberName}'s role changed to ${getRoleDisplayName(newRole)}`);
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
      const result = await userApi.deleteUser(userToDelete.id);
      
      // Show detailed success message
      if (result.success && result.deletedData) {
        const { deletedData } = result;
        const details = [];
        
        if (deletedData.courseMemberships > 0) details.push(`${deletedData.courseMemberships} course memberships`);
        if (deletedData.chatSessions > 0) details.push(`${deletedData.chatSessions} chat sessions`);
        if (deletedData.projects > 0) details.push(`${deletedData.projects} projects`);
        if (deletedData.instructorNotes > 0) details.push(`${deletedData.instructorNotes} instructor notes`);
        if (deletedData.reflections > 0) details.push(`${deletedData.reflections} reflections`);
        
        const detailsText = details.length > 0 ? ` (${details.join(', ')})` : '';
        toast.success(`User and all data deleted completely${detailsText}`);
      } else {
        toast.success('User deleted successfully!');
      }
      
      setShowDeleteUserConfirm(false);
      setUserToDelete(null);
      loadUsers();
      // Also reload courses to refresh member counts
      loadCourses();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  // Create global educational tags
  const handleCreateGlobalTags = async () => {
    try {
      setCreatingGlobalTags(true);
      toast.loading('Creating global educational tags...');
      
      const createdTags = await tagApi.createGlobalEducationalTags();
      
      toast.dismiss();
      if (createdTags.length > 0) {
        toast.success(`Created ${createdTags.length} new global tags!`);
      } else {
        toast.success('All global educational tags already exist');
      }
      
    } catch (error) {
      console.error('Error creating global tags:', error);
      toast.dismiss();
      toast.error('Failed to create global tags');
    } finally {
      setCreatingGlobalTags(false);
    }
  };

  const handleFixAccessCodes = async () => {
    try {
      setFixingAccessCodes(true);
      toast.loading('Checking courses for missing access codes...');
      
      const fixedCount = await courseApi.fixMissingAccessCodes();
      
      toast.dismiss();
      if (fixedCount > 0) {
        toast.success(`Fixed ${fixedCount} courses with missing access codes!`);
        // Reload courses to show the updated data
        loadCourses();
      } else {
        toast.success('All courses already have access codes');
      }
      
    } catch (error) {
      console.error('Error fixing access codes:', error);
      toast.dismiss();
      toast.error('Failed to fix access codes');
    } finally {
      setFixingAccessCodes(false);
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
    setSelectedRoleForAdd('student'); // Default to student
    setShowAddToCourseModal(true);
  };

  const confirmAddToCourse = async () => {
    if (!userToAddToCourse || !selectedCourseForAdd) return;
    
    try {
      await courseApi.addUserToCourse(
        userToAddToCourse.id, 
        selectedCourseForAdd, 
        selectedRoleForAdd, // Pass the selected role
        currentUser.id
      );
      
      const selectedCourseName = courses.find(c => c.id === selectedCourseForAdd)?.title || 'course';
      const roleText = getRoleDisplayName(selectedRoleForAdd);
      toast.success(`${userToAddToCourse.name} added to ${selectedCourseName} as ${roleText}`);
      
      setShowAddToCourseModal(false);
      setUserToAddToCourse(null);
      setSelectedCourseForAdd('');
      setSelectedRoleForAdd('student');
      
      // Reload users to reflect the change
      loadUsers();
    } catch (error) {
      console.error('Error adding user to course:', error);
      if (error.message.includes('already enrolled') || error.message.includes('already an instructor')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add user to course');
      }
    }
  };

  const handleRestoreInstructorRole = async (userId, courseId, courseName) => {
    try {
      await courseApi.restoreInstructorRole(userId, courseId, currentUser.id);
      toast.success(`Instructor role restored for ${courseName}`);
      // Reload users to reflect the change
      loadUsers();
    } catch (error) {
      console.error('Error restoring instructor role:', error);
      toast.error('Failed to restore instructor role');
    }
  };

  // Pending Approvals Functions
  const loadPendingApprovals = async () => {
    try {
      setApprovalsLoading(true);
      console.log('🔥 Admin loading all pending approvals across all courses');
      
      // Get all pending approvals across all courses
      const allApprovals = [];
      
      for (const course of courses) {
        try {
          const courseApprovals = await courseApi.getPendingApprovals(course.id, currentUser.id);
          // Add course info to each approval
          courseApprovals.forEach(approval => {
            approval.courseName = course.title;
            approval.courseCode = course.course_code;
          });
          allApprovals.push(...courseApprovals);
        } catch (error) {
          console.warn(`Failed to load approvals for course ${course.title}:`, error);
        }
      }
      
      console.log(`✅ Loaded ${allApprovals.length} total pending approvals`);
      setPendingApprovals(allApprovals);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setApprovalsLoading(false);
    }
  };

  const handleApprovalAction = async (membershipId, status, userName, courseName) => {
    setProcessingApproval(prev => ({ ...prev, [membershipId]: true }));
    
    try {
      await courseApi.updateMembershipStatus(membershipId, status, currentUser.id);
      
      toast.success(
        `${userName} has been ${status === 'approved' ? 'approved' : 'rejected'} for ${courseName}`
      );
      
      // Send approval confirmation email if approved
      if (status === 'approved') {
        try {
          const approval = pendingApprovals.find(a => a.id === membershipId);
          if (approval) {
            await approvalEmailService.sendApprovalConfirmation({
              userId: approval.userId,
              courseId: approval.courseId,
              approvedRole: approval.role, // Use the original requested role
              approverName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrator'
            });
            console.log('✅ Approval confirmation email sent successfully');
          }
        } catch (emailError) {
          console.warn('⚠️ Failed to send approval confirmation email:', emailError);
          // Don't fail the approval process if email fails
        }
      }
      
      // Remove from pending list
      setPendingApprovals(prev => 
        prev.filter(approval => approval.id !== membershipId)
      );
      
      // Also reload users and courses to reflect changes
      loadUsers();
      loadCourses();
      
    } catch (error) {
      console.error('Error updating membership status:', error);
      toast.error(`Failed to ${status} member`);
    } finally {
      setProcessingApproval(prev => ({ ...prev, [membershipId]: false }));
    }
  };

  const handleFixInstructorRole = async (membershipId, userName, courseName) => {
    setProcessingApproval(prev => ({ ...prev, [membershipId]: true }));
    
    try {
      // First approve the membership, then change role to instructor
      await courseApi.updateMembershipStatus(membershipId, 'approved', currentUser.id);
      
      // Get the membership to find userId and courseId
      const approval = pendingApprovals.find(a => a.id === membershipId);
      if (approval) {
        // Update role to instructor using our existing function
        const changedBy = currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrator';
        await courseApi.updateMemberRole(membershipId, 'instructor', changedBy);
        
        toast.success(`${userName} has been approved as instructor for ${courseName}`);
        
        // Remove from pending list
        setPendingApprovals(prev => 
          prev.filter(approval => approval.id !== membershipId)
        );
        
        // Reload data
        loadUsers();
        loadCourses();
      }
      
    } catch (error) {
      console.error('Error fixing instructor role:', error);
      toast.error('Failed to fix instructor role');
    } finally {
      setProcessingApproval(prev => ({ ...prev, [membershipId]: false }));
    }
  };

  // New handler for approving with specific role
  const handleApprovalWithRole = async (membershipId, role, userName, courseName) => {
    setProcessingApproval(prev => ({ ...prev, [membershipId]: true }));
    
    try {
      // First approve the membership
      await courseApi.updateMembershipStatus(membershipId, 'approved', currentUser.id);
      
      // If the role is different from the requested role, update it
      const approval = pendingApprovals.find(a => a.id === membershipId);
      if (approval && role !== approval.role) {
        const changedBy = currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrator';
        await courseApi.updateMemberRole(membershipId, role, changedBy);
      }
      
      const roleDisplayName = getRoleDisplayName(role);
      toast.success(`${userName} has been approved as ${roleDisplayName} for ${courseName}`);
      
      // Send approval confirmation email
      try {
        await approvalEmailService.sendApprovalConfirmation({
          userId: approval.userId,
          courseId: approval.courseId,
          approvedRole: role,
          approverName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrator'
        });
        console.log('✅ Approval confirmation email sent successfully');
      } catch (emailError) {
        console.warn('⚠️ Failed to send approval confirmation email:', emailError);
        // Don't fail the approval process if email fails
      }
      
      // Remove from pending list
      setPendingApprovals(prev => 
        prev.filter(approval => approval.id !== membershipId)
      );
      
      // Clear role selection
      setApprovalRoleSelection(prev => ({ ...prev, [membershipId]: undefined }));
      
      // Reload data
      loadUsers();
      loadCourses();
      
    } catch (error) {
      console.error('Error approving with role:', error);
      toast.error('Failed to approve member');
    } finally {
      setProcessingApproval(prev => ({ ...prev, [membershipId]: false }));
    }
  };

  const getAvailableCoursesForUser = (user) => {
    const userCourseIds = user.course_memberships?.map(m => m.course_id || courses.find(c => c.title === m.course)?.id) || [];
    return courses.filter(course => !userCourseIds.includes(course.id));
  };

  const getUserMembershipInCourse = (user, courseId) => {
    return user.course_memberships?.find(m => 
      m.course_id === courseId || courses.find(c => c.title === m.course)?.id === courseId
    );
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
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Course
            </button>
            <button
              onClick={handleCreateGlobalTags}
              disabled={creatingGlobalTags}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {creatingGlobalTags ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                  Create Global Tags
                </>
              )}
            </button>
            
            <button
              onClick={handleFixAccessCodes}
              disabled={fixingAccessCodes}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {fixingAccessCodes ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Fixing...
                </>
              ) : (
                <>
                  <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                  Fix Access Codes
                </>
              )}
            </button>
          </div>
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
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'approvals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClipboardDocumentListIcon className="h-5 w-5 inline-block mr-2" />
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('messaging')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messaging'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <EnvelopeIcon className="h-5 w-5 inline-block mr-2" />
            Admin Messaging
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
            Usage Analytics
          </button>
        </nav>
      </div>


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
                                          <div className="ml-2 flex items-center space-x-1">
                                            {membership.role === 'student' && (
                                              <button
                                                onClick={() => handleRestoreInstructorRole(user.id, membership.course_id || courses.find(c => c.title === membership.course)?.id, membership.course)}
                                                className="p-1 text-green-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                title={`Restore as instructor in ${membership.course}`}
                                              >
                                                <AcademicCapIcon className="h-3 w-3" />
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleRemoveFromCourse(user, membership)}
                                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                              title={`Remove from ${membership.course}`}
                                            >
                                              <TrashIcon className="h-3 w-3" />
                                            </button>
                                          </div>
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

      {activeTab === 'approvals' && (
        <>
          {/* Pending Approvals Management */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Pending Course Approvals ({pendingApprovals.length})
              </h3>
              <button
                onClick={loadPendingApprovals}
                disabled={approvalsLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {approvalsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Manage student and instructor enrollment requests across all courses
            </p>
          </div>

          {/* Pending Approvals List */}
          {approvalsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      All course enrollment requests have been processed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                approval.role === 'instructor' 
                                  ? 'bg-green-100' 
                                  : 'bg-blue-100'
                              }`}>
                                {approval.role === 'instructor' ? (
                                  <AcademicCapIcon className="h-5 w-5 text-green-600" />
                                ) : (
                                  <UsersIcon className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {approval.users?.name || 'Unknown User'}
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleStyle(approval.role)}`}>
                                  Requested: {getRoleDisplayName(approval.role)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {approval.users?.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                <strong>Course:</strong> {approval.courseName} ({approval.courseCode})
                              </div>
                              <div className="text-xs text-gray-400">
                                Requested {format(new Date(approval.joinedAt?.toDate ? approval.joinedAt.toDate() : approval.joinedAt || approval.createdAt?.toDate ? approval.createdAt.toDate() : approval.createdAt), 'MMM dd, yyyy HH:mm')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprovalAction(approval.id, 'rejected', approval.users?.name || 'Unknown User', approval.courseName)}
                            disabled={processingApproval[approval.id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {processingApproval[approval.id] ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700"></div>
                            ) : (
                              <>
                                <XMarkIcon className="h-3 w-3 mr-1" />
                                Reject
                              </>
                            )}
                          </button>
                          
                          {/* Role selection dropdown and approve button */}
                          <div className="flex items-center space-x-1">
                            <div className="relative">
                              <select
                                value={approvalRoleSelection[approval.id] || approval.role}
                                onChange={(e) => setApprovalRoleSelection(prev => ({ 
                                  ...prev, 
                                  [approval.id]: e.target.value 
                                }))}
                                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={processingApproval[approval.id]}
                              >
                                {Object.values(ROLES).map((role) => (
                                  <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                  </option>
                                ))}
                              </select>
                              <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                            </div>
                            
                            <button
                              onClick={() => handleApprovalWithRole(
                                approval.id, 
                                approvalRoleSelection[approval.id] || approval.role, 
                                approval.users?.name || 'Unknown User', 
                                approval.courseName
                              )}
                              disabled={processingApproval[approval.id]}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              {processingApproval[approval.id] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700"></div>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                                  Approve
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'messaging' && (
        <AdminMessaging />
      )}

      {activeTab === 'analytics' && (
        <UsageAnalytics />
      )}

      {activeTab === 'courses' && (
        <>
          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const stats = getMembershipStats(course);
              const createdDate = course.createdAt?.toDate ? course.createdAt.toDate() : new Date(course.createdAt);
              
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
                    Created {format(createdDate, 'MMM dd, yyyy')}
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
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleStyle(membership.role)}`}>
                            {getRoleDisplayName(membership.role)}
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
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleStyle(membership.role)}`}>
                            {getRoleDisplayName(membership.role)}
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
                              <select
                                value={membership.role}
                                onChange={(e) => handleMemberRoleChange(membership.id, e.target.value, membership.users?.name)}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {Object.entries(ROLE_LABELS).map(([roleValue, roleLabel]) => (
                                  <option key={roleValue} value={roleValue}>
                                    {roleLabel}
                                  </option>
                                ))}
                              </select>
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
                    <option value="student_assistant">Student Assistant</option>
                    <option value="teaching_assistant">Teaching Assistant</option>
                    <option value="instructor">Instructor</option>
                    <option value="school_administrator">School Administrator</option>
                    <option value="admin">Global Administrator</option>
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
                
                <div className="space-y-4">
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
                      {courses.map((course) => {
                        const membership = getUserMembershipInCourse(userToAddToCourse, course.id);
                        const isAlreadyMember = !!membership;
                        const isInstructor = membership?.role === 'instructor';
                        
                        return (
                          <option 
                            key={course.id} 
                            value={course.id}
                            disabled={isAlreadyMember}
                          >
                            {course.title} ({course.course_code})
                            {isInstructor ? ' - Already Instructor' : isAlreadyMember ? ' - Already Member' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Role
                    </label>
                    <select
                      value={selectedRoleForAdd}
                      onChange={(e) => setSelectedRoleForAdd(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {Object.entries(ROLE_LABELS).map(([roleValue, roleLabel]) => (
                        <option key={roleValue} value={roleValue}>
                          {roleLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {selectedCourseForAdd && userToAddToCourse && (() => {
                  const membership = getUserMembershipInCourse(userToAddToCourse, selectedCourseForAdd);
                  const isInstructor = membership?.role === 'instructor';
                  const selectedCourseName = courses.find(c => c.id === selectedCourseForAdd)?.title;
                  
                  if (membership && membership.role !== selectedRoleForAdd) {
                    return (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium">Note:</p>
                            <p className="mt-1">This user is currently a {getRoleDisplayName(membership.role)} in {selectedCourseName}. Their role will be changed to {getRoleDisplayName(selectedRoleForAdd)}.</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
                {courses.filter(course => !getUserMembershipInCourse(userToAddToCourse, course.id)).length === 0 && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Note:</p>
                        <p className="mt-1">This user is already enrolled in all available courses. Use the "Restore as Instructor" button above to change their role in existing courses.</p>
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
                  disabled={
                    !selectedCourseForAdd || 
                    !selectedRoleForAdd
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add as {getRoleDisplayName(selectedRoleForAdd)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}