import React, { useState, useEffect } from 'react';
import { userApi, courseApi, chatApi, analyticsApi, projectApi } from '../../services/supabaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
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
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function Students({ selectedCourseId, selectedCourse, currentUser }) {
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentStats, setStudentStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [removeLoading, setRemoveLoading] = useState(null);
  const [approveLoading, setApproveLoading] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);

  useEffect(() => {
    if (selectedCourseId) {
      loadStudents();
    }
  }, [selectedCourseId]);

  useEffect(() => {
    applyFilters();
  }, [students, searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const courseMembers = await userApi.getAllUsers(selectedCourseId);
      
      // Separate students and instructors based on their course membership role
      const studentsOnly = courseMembers.filter(user => {
        // Handle both fallback (course_role) and normal (course_memberships) data structures
        const membershipRole = user.course_role || 
                               user.course_memberships?.[0]?.role || 
                               user.course_memberships?.role || 
                               user.role;
        // console.log(`🔍 Filtering ${user.name}: membershipRole = "${membershipRole}"`);
        return membershipRole === 'student';
      });
      
      const instructorsOnly = courseMembers.filter(user => {
        // Handle both fallback (course_role) and normal (course_memberships) data structures
        const membershipRole = user.course_role || 
                               user.course_memberships?.[0]?.role || 
                               user.course_memberships?.role || 
                               user.role;
        // console.log(`🎓 Filtering ${user.name}: membershipRole = "${membershipRole}"`);
        return membershipRole === 'instructor';
      });
      
      console.log('👥 Students found:', studentsOnly.length);
      console.log('👨‍🏫 Instructors found:', instructorsOnly.length);
      
      setStudents(studentsOnly);
      setInstructors(instructorsOnly);
      
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
        
        // Calculate completion rate (projects with reflections / total projects)
        const projectsWithReflections = projects.filter(project => 
          project.reflections && project.reflections.length > 0
        );
        const completionRate = projects.length > 0 
          ? Math.round((projectsWithReflections.length / projects.length) * 100)
          : 0;
        
        // Find most recent activity
        const lastActivity = chats.length > 0 
          ? new Date(Math.max(...chats.map(chat => new Date(chat.created_at).getTime())))
          : new Date(student.created_at);
        
        stats[student.id] = {
          interactions: chats.length,
          lastActivity,
          completionRate,
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
      completionRate: 0,
      projects: 0
    };
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
            {students.length} students and {instructors.length} instructors in {selectedCourse.courses?.title || selectedCourse.courses?.name}
          </p>
        </div>
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
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Instructor
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructor Info */}
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Joined {instructor.created_at ? format(new Date(instructor.created_at), 'MMM d, yyyy') : 'Unknown date'}
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
                        <button
                          onClick={() => setShowConfirmModal(student)}
                          disabled={removeLoading === student.id}
                          className="p-1 text-red-400 hover:text-red-600 transition-colors"
                          title="Remove student from course"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
                        {format(stats.lastActivity, 'MMM dd')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Completion Rate</span>
                      </div>
                      <span className={`font-medium ${stats.completionRate >= 70 ? 'text-green-600' : stats.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {stats.completionRate}%
                      </span>
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
                        Joined {format(new Date(student.joined_at || student.created_at), 'MMM dd, yyyy')}
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
    </div>
  );
}