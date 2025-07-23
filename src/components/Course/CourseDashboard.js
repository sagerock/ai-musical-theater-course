import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/supabaseApi';
import { format } from 'date-fns';
import {
  AcademicCapIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function CourseDashboard() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [courseMembers, setCourseMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      
      // Get course info by ID
      const courseData = await courseApi.getCourseById(courseId);
      setCourse(courseData);
      
      // Get course members
      const members = await courseApi.getCourseMembers(courseId);
      setCourseMembers(members);
      
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Course not found</h2>
          <p className="text-gray-600 mt-2">The course you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const instructors = courseMembers.filter(m => m.role === 'instructor');
  const students = courseMembers.filter(m => m.role === 'student');

  return (
    <div className="p-6">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium mr-2">
                {course.course_code}
              </span>
              <span>{course.semester} {course.year}</span>
            </div>
          </div>
        </div>
        {course.description && (
          <p className="text-gray-600 max-w-3xl">{course.description}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{instructors.length}</p>
              <p className="text-sm text-gray-600">Instructors</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
              <p className="text-sm text-gray-600">Students</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Conversations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructors */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Instructors</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {instructors.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">
                No instructors yet
              </div>
            ) : (
              instructors.map((member) => (
                <div key={member.id} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <AcademicCapIcon className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {member.users?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.users?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Students */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Students</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {students.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">
                No students yet
              </div>
            ) : (
              students.map((member) => (
                <div key={member.id} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {member.users?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.users?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Course Info */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="text-xs text-gray-500">
          Course created {format(new Date(course.created_at), 'MMMM dd, yyyy')}
        </div>
      </div>
    </div>
  );
}