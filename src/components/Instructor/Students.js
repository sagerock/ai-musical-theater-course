import React, { useState, useEffect } from 'react';
import { userApi, courseApi, chatApi, projectApi } from '../../services/firebaseApi';
import { hasAdminPermissions } from '../../utils/roleUtils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import MemberRoleManager from '../Course/MemberRoleManager';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EnvelopeIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function Students({ selectedCourseId, selectedCourse, currentUser }) {
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [teachingAssistants, setTeachingAssistants] = useState([]);
  const [otherRoles, setOtherRoles] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentStats, setStudentStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [removeLoading, setRemoveLoading] = useState(null);
  const [approveLoading, setApproveLoading] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  // Check if current user can delete students (only instructors and admins)
  const canDeleteStudents = hasAdminPermissions(currentUser?.role) || 
                           currentUser?.role === 'admin';


  useEffect(() => {
    if (selectedCourseId && currentUser?.id) {
      loadStudents();
    }
  }, [selectedCourseId, currentUser?.id]);

  useEffect(() => {
    applyFilters();
  }, [students, searchTerm]);

  // Debounced search effect for user search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showAddStudentModal) {
        searchUsers(userSearchTerm);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm, showAddStudentModal, selectedCourseId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      
      const courseMembers = await userApi.getAllUsers(selectedCourseId);
      
      // Separate all users by their course membership role
      const studentsOnly = [];
      const instructorsOnly = [];
      const teachingAssistantsOnly = [];
      const otherRolesOnly = [];

      courseMembers.forEach(user => {
        // Handle both fallback (course_role) and normal (course_memberships) data structures
        const membershipRole = user.course_role || 
                               user.course_memberships?.[0]?.role || 
                               user.course_memberships?.role || 
                               user.role;
        
        switch (membershipRole) {
          case 'student':
            studentsOnly.push(user);
            break;
          case 'instructor':
            instructorsOnly.push(user);
            break;
          case 'teaching_assistant':
            teachingAssistantsOnly.push(user);
            break;
          case 'student_assistant':
          case 'school_administrator':
            otherRolesOnly.push(user);
            break;
          default:
            // Unknown roles go to other
            otherRolesOnly.push(user);
        }
      });
      
      console.log('👥 Students found:', studentsOnly.length);
      console.log('👨‍🏫 Instructors found:', instructorsOnly.length);
      console.log('🎓 Teaching Assistants found:', teachingAssistantsOnly.length);
      console.log('👤 Other roles found:', otherRolesOnly.length);
      
      setStudents(studentsOnly);
      setInstructors(instructorsOnly);
      setTeachingAssistants(teachingAssistantsOnly);
      setOtherRoles(otherRolesOnly);
      
      // Load real statistics for each student
      await loadStudentStats(studentsOnly);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentStats = async (students) => {
    try {
      const stats = {};
      
      // Get statistics for each student
      for (const student of students) {
        // Get student's AI interactions in this course
        const chats = await chatApi.getChatsWithFilters({
          courseId: selectedCourseId,
          userId: student.id
        });
        
        // Get student's projects in this course
        const projects = await projectApi.getUserProjects(student.id, selectedCourseId);
        
        // Calculate number of reflections across all chats
        const totalReflections = chats.filter(chat => chat.has_reflection).length;
        
        // Calculate unique AI models used
        const uniqueModels = [...new Set(chats.map(chat => chat.tool_used || chat.toolUsed).filter(Boolean))];
        const modelsUsed = uniqueModels.length;
        
        // Find most recent activity
        const lastActivity = chats.length > 0 
          ? new Date(Math.max(...chats.map(chat => new Date(chat.created_at).getTime())))
          : new Date(student.created_at);
        
        stats[student.id] = {
          interactions: chats.length,
          lastActivity,
          reflections: totalReflections,
          modelsUsed: modelsUsed,
          projects: projects.length
        };
      }
      
      setStudentStats(stats);
    } catch (error) {
      console.error('Error loading student stats:', error);
      // Don't show error toast for stats, just use placeholder data
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by name
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    setFilteredStudents(filtered);
  };

  const handleRemoveStudent = async (student) => {
    try {
      setRemoveLoading(student.id);
      
      // Remove student from course
      await courseApi.removeStudentFromCourse(student.id, selectedCourseId, currentUser.id);
      
      // Update local state
      setStudents(prev => prev.filter(s => s.id !== student.id));
      
      toast.success(`${student.name || student.email} has been removed from the course`);
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student from course');
    } finally {
      setRemoveLoading(null);
      setShowConfirmModal(null);
    }
  };

  const handleApproveStudent = async (student) => {
    try {
      setApproveLoading(student.id);
      
      // Approve student enrollment
      await courseApi.approveStudentEnrollment(student.id, selectedCourseId, currentUser.id);
      
      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === student.id 
          ? { ...s, status: 'approved' }
          : s
      ));
      
      toast.success(`${student.name || student.email} has been approved for the course`);
    } catch (error) {
      console.error('Error approving student:', error);
      toast.error('Failed to approve student');
    } finally {
      setApproveLoading(null);
      setShowApprovalModal(null);
    }
  };

  const handleRejectStudent = async (student) => {
    try {
      setRejectLoading(student.id);
      
      // Reject student enrollment (removes them from course)
      await courseApi.rejectStudentEnrollment(student.id, selectedCourseId, currentUser.id);
      
      // Update local state (remove from list since they're rejected)
      setStudents(prev => prev.filter(s => s.id !== student.id));
      
      toast.success(`${student.name || student.email} has been rejected from the course`);
    } catch (error) {
      console.error('Error rejecting student:', error);
      toast.error('Failed to reject student');
    } finally {
      setRejectLoading(null);
      setShowApprovalModal(null);
    }
  };

  const getStudentStats = (student) => {
    // Return real stats from the database, or default values while loading
    const stats = studentStats[student.id];
    
    if (stats) {
      return stats;
    }
    
    // Fallback values while stats are loading
    return {
      interactions: 0,
      lastActivity: new Date(student.created_at),
      reflections: 0,
      modelsUsed: 0,
      projects: 0
    };
  };

  // Search users for adding to course
  const searchUsers = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      
      const results = await userApi.searchUsers(term, selectedCourseId, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  // Handle add student
  const handleAddStudent = () => {
    setUserSearchTerm('');
    setSearchResults([]);
    setShowAddStudentModal(true);
  };

  const confirmAddStudent = async (userId) => {
    if (!selectedCourseId) return;
    
    try {
      await courseApi.addStudentToCourse(userId, selectedCourseId, currentUser.id);
      const addedUser = searchResults.find(u => u.id === userId);
      toast.success(`${addedUser.name} added to course`);
      setShowAddStudentModal(false);
      setUserSearchTerm('');
      setSearchResults([]);
      // Reload students to reflect the change
      await loadStudents();
    } catch (error) {
      console.error('Error adding student to course:', error);
      if (error.message.includes('already enrolled')) {
        toast.error('Student is already enrolled in this course');
      } else {
        toast.error('Failed to add student to course');
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Course Selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a course to view students.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Course Members</h2>
          <p className="text-sm text-gray-600">
            {students.length} students, {instructors.length} instructors
            {teachingAssistants.length > 0 && `, ${teachingAssistants.length} teaching assistants`}
            {otherRoles.length > 0 && `, ${otherRoles.length} other members`}
            {' '}in {selectedCourse.courses?.title || selectedCourse.courses?.name}
          </p>
        </div>
        <button
          onClick={handleAddStudent}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Student
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Instructors Section */}
      {instructors.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Course Instructors ({instructors.length})
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {instructors.map((instructor) => (
              <div key={instructor.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50 hover:shadow-md transition-shadow">
                {/* Instructor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {instructor.name || 'No name provided'}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {instructor.email || 'No email provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Management */}
                <div className="mb-3">
                  <MemberRoleManager 
                    member={instructor}
                    currentUserRole={currentUser?.role || 'instructor'}
                    onRoleUpdated={loadStudents}
                  />
                </div>

                {/* Instructor Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Joined {(() => {
                      // Try multiple possible date fields from course membership  
                      const joinDate = instructor.course_memberships?.[0]?.joinedAt || 
                                     instructor.course_memberships?.[0]?.createdAt ||
                                     instructor.joined_at || 
                                     instructor.created_at ||
                                     instructor.createdAt ||
                                     instructor.joinedAt;
                      
                      if (joinDate && !isNaN(new Date(joinDate))) {
                        return format(new Date(joinDate), 'MMM d, yyyy');
                      }
                      return 'Unknown date';
                    })()}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <EnvelopeIcon className="h-3 w-3 mr-1" />
                    {instructor.email || 'No email'}
                  </div>
                  {instructor.status && (
                    <div className="flex items-center text-xs text-gray-500">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Status: {instructor.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Assistants Section */}
      {teachingAssistants.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Teaching Assistants ({teachingAssistants.length})
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {teachingAssistants.map((ta) => (
              <div key={ta.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50 hover:shadow-md transition-shadow">
                {/* TA Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <AcademicCapIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {ta.name || 'No name provided'}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {ta.email || 'No email provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Management */}
                <div className="mb-3">
                  <MemberRoleManager 
                    member={ta}
                    currentUserRole={currentUser?.role || 'instructor'}
                    onRoleUpdated={loadStudents}
                  />
                </div>

                {/* TA Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Joined {(() => {
                      const joinDate = ta.course_memberships?.[0]?.joinedAt || 
                                     ta.course_memberships?.[0]?.createdAt ||
                                     ta.joined_at || 
                                     ta.created_at ||
                                     ta.createdAt ||
                                     ta.joinedAt;
                      
                      if (joinDate && !isNaN(new Date(joinDate))) {
                        return format(new Date(joinDate), 'MMM d, yyyy');
                      }
                      return 'Unknown date';
                    })()}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <EnvelopeIcon className="h-3 w-3 mr-1" />
                    {ta.email || 'No email'}
                  </div>
                  {ta.status && (
                    <div className="flex items-center text-xs text-gray-500">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Status: {ta.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Roles Section */}
      {otherRoles.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <UsersIcon className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Other Course Members ({otherRoles.length})
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {otherRoles.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow-md transition-shadow">
                  {/* Member Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {member.name || 'No name provided'}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {member.email || 'No email provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Role Management */}
                  <div className="mb-3">
                    <MemberRoleManager 
                      member={member}
                      currentUserRole={currentUser?.role || 'instructor'}
                      onRoleUpdated={loadStudents}
                    />
                  </div>

                  {/* Member Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Joined {(() => {
                        const joinDate = member.course_memberships?.[0]?.joinedAt || 
                                       member.course_memberships?.[0]?.createdAt ||
                                       member.joined_at || 
                                       member.created_at ||
                                       member.createdAt ||
                                       member.joinedAt;
                        
                        if (joinDate && !isNaN(new Date(joinDate))) {
                          return format(new Date(joinDate), 'MMM d, yyyy');
                        }
                        return 'Unknown date';
                      })()}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <EnvelopeIcon className="h-3 w-3 mr-1" />
                      {member.email || 'No email'}
                    </div>
                    {member.status && (
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Status: {member.status}
                      </div>
                    )}
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Students Grid */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Students ({students.length})
            </h3>
          </div>
        </div>
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No students have joined this course yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredStudents.map((student) => {
              const stats = getStudentStats(student);
              return (
                <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Student Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {student.name || 'No name provided'}
                        </h3>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <EnvelopeIcon className="h-3 w-3" />
                          <span className="truncate">{student.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex items-center space-x-1">
                      {student.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => setShowApprovalModal({ student, action: 'approve' })}
                            disabled={approveLoading === student.id}
                            className="p-1 text-green-400 hover:text-green-600 transition-colors"
                            title="Approve student"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowApprovalModal({ student, action: 'reject' })}
                            disabled={rejectLoading === student.id}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="Reject student"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        canDeleteStudents && (
                          <button
                            onClick={() => setShowConfirmModal(student)}
                            disabled={removeLoading === student.id}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="Remove student from course"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Role Management */}
                  <div className="mb-3">
                    <MemberRoleManager 
                      member={student}
                      currentUserRole={currentUser?.role || 'instructor'}
                      onRoleUpdated={loadStudents}
                    />
                  </div>

                  {/* Student Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <ChartBarIcon className="h-4 w-4" />
                        <span>AI Interactions</span>
                      </div>
                      <span className="font-medium text-gray-900">{stats.interactions}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Last Activity</span>
                      </div>
                      <span className="text-gray-900">
                        {stats.lastActivity && !isNaN(new Date(stats.lastActivity)) ? 
                          format(new Date(stats.lastActivity), 'MMM dd') : 'No activity'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>Reflections</span>
                      </div>
                      <span className="font-medium text-gray-900">{stats.reflections}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <UsersIcon className="h-4 w-4" />
                        <span>AI Models Used</span>
                      </div>
                      <span className="font-medium text-gray-900">{stats.modelsUsed}/7</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {student.status === 'approved' ? 'Active' : 'Pending'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Joined {(() => {
                          // Try multiple possible date fields from course membership
                          const joinDate = student.course_memberships?.[0]?.joinedAt || 
                                         student.course_memberships?.[0]?.createdAt ||
                                         student.joined_at || 
                                         student.created_at ||
                                         student.createdAt ||
                                         student.joinedAt;
                          
                          if (joinDate && !isNaN(new Date(joinDate))) {
                            return format(new Date(joinDate), 'MMM dd, yyyy');
                          }
                          return 'Unknown date';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{students.length}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Active Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {students.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Remove Student</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to remove <strong>{showConfirmModal.name || showConfirmModal.email}</strong> from this course? 
              They will lose access to all course materials and their progress will be preserved but hidden.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveStudent(showConfirmModal)}
                disabled={removeLoading === showConfirmModal.id}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {removeLoading === showConfirmModal.id ? 'Removing...' : 'Remove Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                showApprovalModal.action === 'approve' 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                {showApprovalModal.action === 'approve' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {showApprovalModal.action === 'approve' ? 'Approve Student' : 'Reject Student'}
                </h3>
                <p className="text-sm text-gray-500">
                  {showApprovalModal.action === 'approve' 
                    ? 'Grant access to course materials' 
                    : 'This action cannot be undone'
                  }
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to {showApprovalModal.action} <strong>{showApprovalModal.student.name || showApprovalModal.student.email}</strong>?
              {showApprovalModal.action === 'approve' 
                ? ' They will gain full access to course materials and be able to participate in activities.'
                : ' They will be removed from the course and will not be able to access any materials.'
              }
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowApprovalModal(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => showApprovalModal.action === 'approve' 
                  ? handleApproveStudent(showApprovalModal.student)
                  : handleRejectStudent(showApprovalModal.student)
                }
                disabled={
                  (showApprovalModal.action === 'approve' && approveLoading === showApprovalModal.student.id) ||
                  (showApprovalModal.action === 'reject' && rejectLoading === showApprovalModal.student.id)
                }
                className={`flex-1 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                  showApprovalModal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                {showApprovalModal.action === 'approve' 
                  ? (approveLoading === showApprovalModal.student.id ? 'Approving...' : 'Approve Student')
                  : (rejectLoading === showApprovalModal.student.id ? 'Rejecting...' : 'Reject Student')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAddStudentModal(false)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mr-3">
                  <PlusIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Add Student to Course</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-4">
                  Search for a student to add to this course:
                </p>
                
                {/* Search Input */}
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email... (at least 2 characters)"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    autoFocus
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    </div>
                  )}
                </div>
                
                {/* Search Results */}
                {userSearchTerm.length < 2 ? (
                  <div className="text-center py-8">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Start typing to search</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Enter at least 2 characters to search for students by name or email.
                    </p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No Name'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                        <button
                          onClick={() => confirmAddStudent(user.id)}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : !searching && userSearchTerm.length >= 2 ? (
                  <div className="text-center py-8">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No users found matching "{userSearchTerm}". Try a different search term.
                    </p>
                  </div>
                ) : null}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}