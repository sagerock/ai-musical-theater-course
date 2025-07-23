import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/supabaseApi';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function CourseJoin() {
  const [courseCode, setCourseCode] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);

  const { currentUser, login } = useAuth();

  const handleCourseCodeSubmit = async (e) => {
    e.preventDefault();
    
    if (!courseCode.trim()) {
      toast.error('Please enter a course code');
      return;
    }

    // Check if user is logged in first
    if (!currentUser) {
      toast.error('Please log in first to join a course');
      // Store course info for after login
      localStorage.setItem('pendingCourseJoin', JSON.stringify({
        courseCode: courseCode.trim().toUpperCase(),
        role: role
      }));
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    
    try {
      // Find the course
      const course = await courseApi.getCourseByCode(courseCode.trim().toUpperCase());
      setCourseInfo(course);
      
      // Join the course directly using existing user data
      await courseApi.joinCourse(courseCode.trim().toUpperCase(), currentUser.id, role);
      
      toast.success(`Successfully requested to join ${course.title}! ${
        role === 'instructor' 
          ? 'Your request is pending admin approval.' 
          : 'Your request is pending instructor approval.'
      }`);
      
      // Redirect to appropriate dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error joining course:', error);
      if (error.message.includes('Course not found')) {
        toast.error('Course not found. Please check your course code.');
      } else if (error.message.includes('already exists')) {
        toast.error('You are already a member of this course.');
      } else {
        toast.error('Failed to join course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Join Your Course
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your course code to join
          </p>
        </div>

        <form onSubmit={handleCourseCodeSubmit} className="space-y-6">
          <div>
            <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-2">
              Course Code
            </label>
            <input
              id="courseCode"
              name="courseCode"
              type="text"
              required
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-widest"
              placeholder="MT-SP25"
              maxLength={10}
            />
            <p className="mt-1 text-xs text-gray-500">
              Ask your instructor for the course code
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am joining as a:
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === 'student'}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Student</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="instructor"
                  checked={role === 'instructor'}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Instructor</span>
              </label>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong>
              <p className="mt-1">
                {role === 'instructor' 
                  ? 'Your request will need to be approved by a course admin.'
                  : 'Your request will need to be approved by an instructor.'
                }
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                Join Course
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Don't have a course code? Contact your instructor or administrator.
          </p>
        </div>
      </div>
    </div>
  );
}