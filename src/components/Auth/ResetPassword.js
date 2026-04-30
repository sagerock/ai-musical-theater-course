import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase password recovery flow:
    //   1. User clicks the recovery link in their email.
    //   2. Supabase opens the app with a recovery token in the URL hash; the
    //      JS client picks it up automatically and emits a `PASSWORD_RECOVERY`
    //      auth event with a temporary session.
    //   3. While that session is active, calling `supabase.auth.updateUser`
    //      with a new password completes the reset.
    //
    // This effect waits for either the recovery event or an existing session
    // (the user may have already followed the link earlier in this tab).
    let isMounted = true;

    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (session) {
        setValidSession(true);
        toast.success('Reset link verified. Enter your new password below.');
      }
      setVerifying(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        setValidSession(true);
        setVerifying(false);
        toast.success('Reset link verified. Enter your new password below.');
      }
    });

    checkExistingSession();

    // Fail closed: if no recovery session shows up within a few seconds,
    // surface the invalid-link state so users aren't stuck on a spinner.
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;
      setVerifying(prev => {
        if (prev) {
          // We never received a recovery session.
          return false;
        }
        return prev;
      });
    }, 4000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validSession) {
      toast.error('No active password reset session');
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      console.log('Supabase password reset completed successfully');
      toast.success('Password updated successfully! Please sign in with your new password.');

      // Sign the temporary recovery session out so the user logs in fresh.
      await supabase.auth.signOut().catch(() => {});

      navigate('/login');
    } catch (error) {
      console.error('Error updating password:', error);

      let errorMessage = 'Failed to update password';
      if (error?.message) {
        if (/weak|short|password/i.test(error.message)) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
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
        ) : validSession ? (
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
