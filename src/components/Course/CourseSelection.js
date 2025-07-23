import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/supabaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function CourseSelection({ onCourseSelect }) {
  const [userCourses, setUserCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { currentUser } = useAuth();

  useEffect(() => {
    loadUserCourses();
  }, [currentUser]);

  const loadUserCourses = async () => {
    try {
      setLoading(true);
      const courses = await courseApi.getUserCourses(currentUser.id);
      setUserCourses(courses);
      
      // If user has only one approved course, auto-select it
      const approvedCourses = courses.filter(c => c.status === 'approved');
      if (approvedCourses.length === 1) {
        handleCourseSelect(approvedCourses[0]);
      }
    } catch (error) {
      console.error('Error loading user courses:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (courseMembership) => {
    setSelectedCourse(courseMembership);
    onCourseSelect(courseMembership.courses, courseMembership.role);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        role === 'instructor' 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        {role === 'instructor' ? 'Instructor' : 'Student'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your courses...</p>
          </div>
        </div>
      </div>
    );
  }

  const approvedCourses = userCourses.filter(c => c.status === 'approved');
  const pendingCourses = userCourses.filter(c => c.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Select Your Course
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose which course you'd like to access
          </p>
        </div>

        {/* Approved Courses */}
        {approvedCourses.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Your Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedCourses.map((courseMembership) => (
                <div
                  key={courseMembership.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCourseSelect(courseMembership)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        {courseMembership.courses.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {courseMembership.courses.semester} {courseMembership.courses.year}
                      </p>
                      <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                        {courseMembership.courses.course_code}
                      </div>
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                  </div>

                  {courseMembership.courses.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {courseMembership.courses.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(courseMembership.role)}
                      {getStatusBadge(courseMembership.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Joined {format(new Date(courseMembership.joined_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Courses */}
        {pendingCourses.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Pending Approval</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingCourses.map((courseMembership) => (
                <div
                  key={courseMembership.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-6 opacity-75"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-700 mb-1">
                        {courseMembership.courses.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {courseMembership.courses.semester} {courseMembership.courses.year}
                      </p>
                      <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700 mb-2">
                        {courseMembership.courses.course_code}
                      </div>
                    </div>
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(courseMembership.role)}
                      {getStatusBadge(courseMembership.status)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Requested {format(new Date(courseMembership.joined_at), 'MMM dd, yyyy')}
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-yellow-50 rounded-md">
                    <p className="text-xs text-yellow-800">
                      Your request is pending {courseMembership.role === 'instructor' ? 'admin' : 'instructor'} approval.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Courses */}
        {userCourses.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't joined any courses yet. Ask your instructor for a course code.
            </p>
          </div>
        )}

        {/* Only Pending Courses */}
        {approvedCourses.length === 0 && pendingCourses.length > 0 && (
          <div className="text-center py-8">
            <div className="bg-yellow-50 rounded-lg p-6">
              <ClockIcon className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium text-yellow-900">
                Waiting for Approval
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                All your course requests are pending approval. You'll be able to access 
                the courses once they're approved by your instructor or admin.
              </p>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need to join a new course? Contact your instructor for a course code.
          </p>
        </div>
      </div>
    </div>
  );
}