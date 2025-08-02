import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/firebaseApi';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function CourseJoin() {
  const [courseCode, setCourseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);

  const { currentUser, login } = useAuth();

  const handleCourseCodeSubmit = async (e) => {
    e.preventDefault();
    console.log('🎯 CourseJoin: Form submitted');
    console.log('📝 Course join details:', { courseCode, currentUser: currentUser?.id });
    
    if (!courseCode.trim()) {
      toast.error('Please enter a course code');
      return;
    }

    // Check if user is logged in first
    if (!currentUser) {
      console.log('❌ CourseJoin: User not logged in');
      toast.error('Please log in first to join a course');
      // Store course info for after login
      localStorage.setItem('pendingCourseJoin', JSON.stringify({
        courseCode: courseCode.trim().toUpperCase()
      }));
      window.location.href = '/login';
      return;
    }

    console.log('✅ CourseJoin: User is logged in, proceeding with enrollment');
    setLoading(true);
    
    // Check if this is a Firebase user (Firebase UIDs don't follow UUID format)
    // Using Firebase API
    
    try {
      console.log('🔍 CourseJoin: Looking up course by code');
      
      // Find the course
      const course = await courseApi.getCourseByCode(courseCode.trim().toUpperCase());
      console.log('✅ CourseJoin: Course found:', course.title);
      setCourseInfo(course);
      
      console.log('🚀 CourseJoin: Calling joinCourse API');
      // Join the course directly using existing user data (defaults to student role)
      await courseApi.joinCourse(currentUser.id, course.id, courseCode.trim().toUpperCase());
      console.log('✅ CourseJoin: joinCourse completed successfully');
      
      toast.success(`Successfully requested to join ${course.title}! Your request is pending instructor approval.`);
      
      console.log('🎉 CourseJoin: Course enrollment completed successfully!');
      console.log('⏳ CourseJoin: Delaying redirect to show logs...');
      
      // Delay redirect to allow logs to be visible
      setTimeout(() => {
        console.log('🚀 CourseJoin: Redirecting to dashboard now...');
        window.location.href = '/dashboard';
      }, 5000); // 5 second delay to see logs
      
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

          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <strong>Note:</strong>
              <p className="mt-1">
                Your request to join this course will need to be approved by an instructor.
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