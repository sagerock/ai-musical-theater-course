import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, paymentApi } from '../../services/firebaseApi';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  UserGroupIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student', description: 'Access course materials and AI tools' },
  { value: 'student_assistant', label: 'Student Assistant', description: 'Help manage course activities and assist other students' },
  { value: 'teaching_assistant', label: 'Teaching Assistant', description: 'Assist with grading and course management' },
  { value: 'instructor', label: 'Instructor', description: 'Full course management and administrative access' },
  { value: 'school_administrator', label: 'School Administrator', description: 'Oversight and administrative access across courses' }
];

// Roles that bypass payment entirely
const EDUCATOR_ROLES = ['instructor', 'teaching_assistant', 'school_administrator'];

export default function CourseJoin() {
  const [courseCode, setCourseCode] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);

  const { currentUser, userRole, hasSemesterAccess, refreshUser } = useAuth();

  // Handle payment return URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const returnedCode = params.get('code');

    if (paymentStatus === 'success') {
      toast.success('Payment successful! You can now join the course.');
      if (returnedCode) {
        setCourseCode(returnedCode);
      }
      // Refresh user doc to pick up semesterAccess written by webhook
      if (refreshUser) {
        refreshUser();
      }
      // Clean up URL params
      window.history.replaceState({}, '', '/join');
    } else if (paymentStatus === 'cancelled') {
      toast('Payment was cancelled. You can try again when ready.', { icon: '\u2139\ufe0f' });
      if (returnedCode) {
        setCourseCode(returnedCode);
      }
      window.history.replaceState({}, '', '/join');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if the selected role requires payment
  const needsPayment = () => {
    // Admins never pay
    if (userRole === 'admin') return false;
    // Educator roles bypass payment
    if (EDUCATOR_ROLES.includes(selectedRole)) return false;
    // Students/student assistants need semester access
    return !hasSemesterAccess;
  };

  const handleCourseCodeSubmit = async (e) => {
    e.preventDefault();
    console.log('CourseJoin: Form submitted');

    if (!courseCode.trim()) {
      toast.error('Please enter a course code');
      return;
    }

    // Check if user is logged in first
    if (!currentUser) {
      console.log('CourseJoin: User not logged in');
      toast.error('Please log in first to join a course');
      localStorage.setItem('pendingCourseJoin', JSON.stringify({
        courseCode: courseCode.trim().toUpperCase()
      }));
      window.location.href = '/login';
      return;
    }

    setLoading(true);

    try {
      // Find the course first
      const course = await courseApi.getCourseByCode(courseCode.trim().toUpperCase());
      console.log('CourseJoin: Course found:', course.title);
      setCourseInfo(course);

      // Payment gate: student roles without semester access must pay first
      if (needsPayment()) {
        console.log('CourseJoin: Redirecting to Stripe checkout');
        toast('Redirecting to payment...', { icon: '\ud83d\udcb3' });
        const { url } = await paymentApi.createCheckoutSession(
          currentUser.id,
          currentUser.email,
          courseCode.trim().toUpperCase()
        );
        window.location.href = url;
        return;
      }

      // Join the course with selected role
      await courseApi.joinCourse(currentUser.id, course.id, courseCode.trim().toUpperCase(), selectedRole);

      toast.success(`Successfully requested to join ${course.title}! Your request is pending instructor approval.`);

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <UserGroupIcon className="inline h-4 w-4 mr-1" />
              Your Role
            </label>
            <div className="space-y-3">
              {ROLE_OPTIONS.map((role) => (
                <label key={role.value} className="flex items-start">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{role.label}</div>
                    <div className="text-xs text-gray-500">{role.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment info for students without semester access */}
          {currentUser && needsPayment() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start">
                <CreditCardIcon className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <strong>Semester access required — $49</strong>
                  <p className="mt-1">
                    Student access requires a one-time $49 semester fee. You'll be redirected to a secure checkout page. Promo codes can be applied at checkout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Semester access confirmed */}
          {currentUser && !needsPayment() && (selectedRole === 'student' || selectedRole === 'student_assistant') && hasSemesterAccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                Semester access active — you're all set to join.
              </div>
            </div>
          )}

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
            ) : needsPayment() ? (
              <>
                Continue to Payment
                <CreditCardIcon className="ml-2 h-4 w-4" />
              </>
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
