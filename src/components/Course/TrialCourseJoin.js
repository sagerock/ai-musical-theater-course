import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/supabaseApi';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  UserIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Export for debugging
window.debugJoinTrialCourse = async (userRole = 'instructor') => {
  try {
    const { courseApi } = await import('../../services/supabaseApi');
    const currentUser = JSON.parse(localStorage.getItem('firebase_uid'));
    
    if (!currentUser) {
      console.error('No current user found');
      return;
    }
    
    console.log('🔄 Debug: Joining trial course as', userRole);
    const course = await courseApi.getCourseByCode('TR-SP25');
    console.log('✅ Found course:', course);
    
    const membership = await courseApi.joinTrialCourse('TR-SP25', currentUser, userRole);
    console.log('✅ Created membership:', membership);
    
    // Refresh the page
    window.location.reload();
  } catch (error) {
    console.error('❌ Debug join failed:', error);
  }
};

export default function TrialCourseJoin({ onClose }) {
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('roleSelection'); // 'roleSelection', 'accountCreation', 'joining'
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const { currentUser, login, signup, refreshUserStatus } = useAuth();

  const handleRoleSelection = async (selectedRole) => {
    setRole(selectedRole);
    
    console.log('🔄 Role selection - Current user:', currentUser?.uid);
    console.log('🔄 Role selection - Selected role:', selectedRole);
    
    if (!currentUser) {
      console.log('👤 No current user, showing account creation');
      setStep('accountCreation');
    } else {
      console.log('✅ Current user exists, joining trial course');
      await joinTrialCourse(selectedRole);
    }
  };

  const handleAccountCreation = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('🔄 Creating account for trial course...');
      console.log('  - Email:', accountData.email);
      console.log('  - Role:', role);
      
      // Create account
      const result = await signup(accountData.email, accountData.password, accountData.displayName, role);
      console.log('✅ Account created successfully');
      console.log('📊 New user:', result.user.uid);
      
      // Wait for auth context to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the newly created user directly from the result
      const newUserId = result.user.uid;
      console.log('🔄 Using new user ID for trial course join:', newUserId);
      
      // Join the trial course directly with the new user ID
      await joinTrialCourseWithUserId(newUserId, role);
      
    } catch (error) {
      console.error('❌ Error creating account:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinTrialCourse = async (userRole) => {
    setLoading(true);
    setStep('joining');
    
    try {
      console.log('🔄 Starting trial course join process...');
      console.log('  - User ID:', currentUser?.uid);
      console.log('  - Role:', userRole);
      
      // Find the trial course
      const course = await courseApi.getCourseByCode('TR-SP25');
      console.log('✅ Found trial course:', course);
      
      // Join the trial course with auto-approval
      const membership = await courseApi.joinTrialCourse('TR-SP25', currentUser?.uid, userRole);
      console.log('✅ Created membership:', membership);
      
      toast.success(`Successfully joined ${course.name} as ${userRole}! You now have access to all features.`);
      
      // Refresh user status to update instructor permissions
      console.log('🔄 Refreshing user status...');
      await refreshUserStatus();
      console.log('✅ User status refreshed');
      
      // Small delay to ensure auth context updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('❌ Error joining trial course:', error);
      if (error.message.includes('already exists')) {
        toast.success('You are already a member of the trial course!');
        
        // Still refresh user status in case permissions need updating
        console.log('🔄 Refreshing user status for existing member...');
        await refreshUserStatus();
        
        window.location.href = '/dashboard';
      } else {
        toast.error('Failed to join trial course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const joinTrialCourseWithUserId = async (userId, userRole) => {
    setLoading(true);
    setStep('joining');
    
    try {
      console.log('🔄 Starting trial course join process with user ID...');
      console.log('  - User ID:', userId);
      console.log('  - Role:', userRole);
      
      // Find the trial course
      const course = await courseApi.getCourseByCode('TR-SP25');
      console.log('✅ Found trial course:', course);
      
      // Join the trial course with auto-approval
      const membership = await courseApi.joinTrialCourse('TR-SP25', userId, userRole);
      console.log('✅ Created membership:', membership);
      
      toast.success(`Successfully joined ${course.name} as ${userRole}! You now have access to all features.`);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('❌ Error joining trial course:', error);
      if (error.message.includes('already exists')) {
        toast.success('You are already a member of the trial course!');
        window.location.href = '/dashboard';
      } else {
        toast.error('Failed to join trial course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'joining') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Joining Trial Course...
            </h3>
            <p className="text-gray-600">
              Please wait while we set up your trial experience.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'accountCreation') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Create Account for Trial
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              You'll join the trial course <strong>TR-SP25</strong> as a <strong>{role}</strong> once your account is created.
            </p>
          </div>

          <form onSubmit={handleAccountCreation} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={accountData.displayName}
                onChange={(e) => setAccountData({...accountData, displayName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={accountData.email}
                onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={accountData.password}
                onChange={(e) => setAccountData({...accountData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setStep('roleSelection')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account & Join'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Try AI Engagement Hub
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600 mb-4">
            Join our trial course <strong>TR-SP25</strong> to explore AI Engagement Hub's features.
          </p>
          <p className="text-sm text-gray-500">
            Choose your role to get started:
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelection('student')}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md mr-3">
                <UserIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Join as Student</div>
                <div className="text-sm text-gray-500">Explore AI interactions and analytics</div>
              </div>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          </button>

          <button
            onClick={() => handleRoleSelection('instructor')}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md mr-3">
                <UserGroupIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Join as Instructor</div>
                <div className="text-sm text-gray-500">Access analytics and monitoring tools</div>
              </div>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-xs text-green-800">
            <strong>Trial Course:</strong> Experience all features with sample data. 
            No approval required - you'll have immediate access to explore the platform!
          </p>
        </div>

        {currentUser && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Logged in as: <strong>{currentUser.displayName || currentUser.email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}