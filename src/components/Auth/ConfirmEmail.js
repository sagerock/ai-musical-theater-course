import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ConfirmEmail() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Processing...');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleFirebaseEmailFlow = async () => {
      try {
        // Firebase handles email verification automatically through the authentication flow
        // This component is primarily for handling redirect after email verification
        
        console.log('Firebase email confirmation page loaded');
        console.log('Current user:', currentUser);
        
        // Check if user is now authenticated after email verification
        if (currentUser) {
          setMessage('Email verified successfully! Redirecting to dashboard...');
          toast.success('Welcome! Your email has been verified.');
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // User not authenticated, likely need to sign in
          setMessage('Please sign in with your verified email address.');
          toast.info('Please sign in to continue.');
          
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
        
      } catch (error) {
        console.error('Email confirmation error:', error);
        setMessage('Something went wrong. Please try signing in.');
        toast.error('Please try signing in again.');
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleFirebaseEmailFlow();
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="mx-auto h-12 w-12 bg-primary-500 rounded-lg flex items-center justify-center mb-6">
            {loading ? (
              <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Email Confirmation
          </h2>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {!loading && (
            <div className="space-y-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}