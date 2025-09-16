import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function EmailServerTest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const sendTestEmail = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          subject: 'Test Email from AI Engagement Hub',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">🎉 Test Email Successful!</h2>
              <p>This is a test email from your AI Engagement Hub application.</p>
              <p>If you're seeing this message, your SendGrid integration is working correctly!</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                Sent via SendGrid API from AI Engagement Hub<br>
                Timestamp: ${new Date().toLocaleString()}
              </p>
            </div>
          `,
          textContent: `Test Email Successful! This is a test email from your AI Engagement Hub application. If you're seeing this message, your SendGrid integration is working correctly! Sent at: ${new Date().toLocaleString()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Test email sent successfully to ${email}!`);
        console.log('✅ Email sent:', data);
      } else {
        const error = await response.json();
        toast.error(`Failed to send email: ${error.error || 'Unknown error'}`);
        console.error('❌ Email error:', error);
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      toast.error(`Failed to send email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">📧 SendGrid Email Server Test</h3>

      <form onSubmit={sendTestEmail} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to send test"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This will send a test email via SendGrid to verify your email configuration
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
            '📬 Send Test Email'
          )}
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-600 space-y-2">
        <p><strong>After clicking send:</strong></p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Check your email inbox for the test message</li>
          <li>Check browser console for success/error messages</li>
          <li>Check Vercel Function logs for detailed debugging</li>
          <li>Verify SendGrid Activity Feed shows the email</li>
        </ol>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> This tests the direct SendGrid API integration.
          Make sure SENDGRID_API_KEY and REACT_APP_SENDGRID_FROM_EMAIL are set in Vercel.
        </p>
      </div>
    </div>
  );
}