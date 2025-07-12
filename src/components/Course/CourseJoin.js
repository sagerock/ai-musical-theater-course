import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/supabaseApi';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  UserCircleIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

export default function CourseJoin() {
  const [courseCode, setCourseCode] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('code'); // 'code' or 'profile'
  const [courseInfo, setCourseInfo] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  });

  const { currentUser, login } = useAuth();

  const handleCourseCodeSubmit = async (e) => {
    e.preventDefault();
    
    if (!courseCode.trim()) {
      toast.error('Please enter a course code');
      return;
    }

    setLoading(true);
    
    try {
      const course = await courseApi.getCourseByCode(courseCode.trim().toUpperCase());
      setCourseInfo(course);
      setStep('profile');
      toast.success(`Found course: ${course.name}`);
    } catch (error) {
      console.error('Error finding course:', error);
      toast.error('Course not found. Please check your course code.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!profile.name.trim() || !profile.email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      // Check if user is already logged in
      if (!currentUser) {
        // If not logged in, redirect to login page with course info
        toast.error('Please log in first to join a course');
        // You could store course info in localStorage and redirect
        localStorage.setItem('pendingCourseJoin', JSON.stringify({
          courseCode: courseCode.trim().toUpperCase(),
          role: role,
          courseInfo: courseInfo
        }));
        window.location.href = '/login';
        return;
      }
      
      // User is logged in, join the course directly
      await courseApi.joinCourse(courseCode.trim().toUpperCase(), currentUser.uid, role);
      
      toast.success(`Successfully requested to join ${courseInfo.name}! ${
        role === 'instructor' 
          ? 'Your request is pending admin approval.' 
          : 'Your request is pending instructor approval.'
      }`);
      
      // Redirect to appropriate dashboard
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error joining course:', error);
      if (error.message.includes('already exists')) {
        toast.error('You are already a member of this course.');
      } else {
        toast.error('Failed to join course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('code');
    setCourseInfo(null);
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
            {step === 'code' 
              ? 'Enter your course code to get started'
              : 'Complete your profile to join the course'
            }
          </p>
        </div>

        {step === 'code' && (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  Find Course
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'profile' && courseInfo && (
          <div className="space-y-6">
            {/* Course Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900">
                    {courseInfo.name}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {courseInfo.semester} {courseInfo.year}
                  </p>
                  {courseInfo.description && (
                    <p className="mt-1 text-sm text-blue-700">
                      {courseInfo.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-sm text-yellow-800">
                  <strong>Joining as {role}:</strong>
                  <p className="mt-1">
                    {role === 'instructor' 
                      ? 'Your request will need to be approved by a course admin.'
                      : 'Your request will need to be approved by an instructor.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Join Course'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Don't have a course code? Contact your instructor or administrator.
          </p>
        </div>
      </div>
    </div>
  );
}