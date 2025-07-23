import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function EmailTest() {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const sendTestPasswordReset = async (e) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(testEmail);
      toast.success(`Test password reset email sent to ${testEmail}! Check your inbox and SendGrid activity feed.`);
    } catch (error) {
      console.error('Test email error:', error);
      toast.error(`Failed to send test email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">🧪 SendGrid Email Test</h3>
      
      <form onSubmit={sendTestPasswordReset} className="space-y-4">
        <div>
          <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Test Email Address
          </label>
          <input
            type="email"
            id="testEmail"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email to test SendGrid"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This will send a password reset email to test your SendGrid configuration
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending Test Email...
            </div>
          ) : (
            '📧 Send Test Email'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-sm text-gray-600 space-y-2">
        <p><strong>After clicking send:</strong></p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Check your email inbox for the password reset message</li>
          <li>Check SendGrid Dashboard → Activity Feed for delivery status</li>
          <li>Look at browser console for any errors</li>
          <li>Check Supabase Dashboard → Logs for SMTP issues</li>
        </ol>
      </div>
    </div>
  );
}