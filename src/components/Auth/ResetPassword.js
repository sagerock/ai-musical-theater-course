import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Handle Firebase password reset flow
    const handleFirebasePasswordReset = async () => {
      console.log('Firebase ResetPassword component loaded');
      console.log('Current user:', currentUser);
      
      // Get the action code from URL parameters (Firebase uses 'oobCode')
      const actionCode = searchParams.get('oobCode');
      const mode = searchParams.get('mode');
      
      console.log('Firebase reset params:', { actionCode: !!actionCode, mode });
      
      if (!actionCode || mode !== 'resetPassword') {
        console.log('Missing or invalid Firebase reset parameters');
        toast.error('Invalid password reset link');
        navigate('/login');
        return;
      }
      
      try {
        // Verify the password reset code
        await verifyPasswordResetCode(auth, actionCode);
        console.log('Firebase password reset code verified successfully');
        setValidCode(true);
        toast.success('Reset link verified. Enter your new password below.');
      } catch (error) {
        console.error('Firebase password reset verification error:', error);
        
        let errorMessage = 'Invalid or expired reset link';
        if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'This password reset link is invalid or has already been used.';
        } else if (error.code === 'auth/expired-action-code') {
          errorMessage = 'This password reset link has expired. Please request a new one.';
        }
        
        toast.error(errorMessage);
        navigate('/login');
      } finally {
        setVerifying(false);
      }
    };

    handleFirebasePasswordReset();
  }, [searchParams, navigate, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validCode) {
      toast.error('Invalid reset code');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const actionCode = searchParams.get('oobCode');
      
      // Confirm the password reset with Firebase
      await confirmPasswordReset(auth, actionCode, password);
      
      console.log('Firebase password reset completed successfully');
      toast.success('Password updated successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (error) {
      console.error('Error updating password:', error);
      
      let errorMessage = 'Failed to update password';
      if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'This reset link is invalid or has expired.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-500 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {verifying ? (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        ) : validCode ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your new password"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Confirm your new password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Password...
                  </div>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </form>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Reset Link</h3>
            <p className="text-gray-600 mb-4">This password reset link is invalid or has expired.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}