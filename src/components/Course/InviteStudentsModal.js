import React, { useState } from 'react';
import { XMarkIcon, EnvelopeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import emailService from '../../services/emailService';

export default function InviteStudentsModal({ isOpen, onClose, course, instructorName }) {
  const [emailsText, setEmailsText] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const parseEmails = (text) => {
    return text
      .split(/[,;\n]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0 && e.includes('@'));
  };

  const emails = parseEmails(emailsText);
  const joinUrl = `https://www.ai-engagement-hub.com/join?code=${course.course_code}`;

  const handleSend = async () => {
    if (emails.length === 0) return;

    setSending(true);
    setResults(null);

    const sendResults = { sent: [], failed: [] };

    for (const email of emails) {
      try {
        const result = await emailService.sendCourseInviteEmail({
          studentEmail: email,
          courseName: course.title,
          courseCode: course.course_code,
          instructorName: instructorName,
          joinUrl: joinUrl,
          discountCode: discountCode.trim() || null,
          semester: course.semester,
          year: course.year
        });
        if (result.success) {
          sendResults.sent.push(email);
        } else {
          sendResults.failed.push(email);
        }
      } catch (err) {
        console.error(`Failed to send invite to ${email}:`, err);
        sendResults.failed.push(email);
      }
    }

    setResults(sendResults);
    setSending(false);

    if (sendResults.failed.length === 0) {
      setEmailsText('');
      setDiscountCode('');
    }
  };

  const handleClose = () => {
    setEmailsText('');
    setDiscountCode('');
    setResults(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-lg bg-white rounded-lg text-left shadow-xl transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <EnvelopeIcon className="h-6 w-6 text-white mr-2" />
                <h3 className="text-lg font-semibold text-white">Invite Students</h3>
              </div>
              <button onClick={handleClose} className="text-white hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-indigo-100 text-sm mt-1">{course.title}</p>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Email Addresses
              </label>
              <textarea
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                placeholder="Enter email addresses separated by commas or one per line&#10;&#10;student1@school.edu&#10;student2@school.edu"
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                disabled={sending}
              />
              {emailsText.trim() && (
                <p className="text-xs text-gray-500 mt-1">
                  {emails.length} valid email{emails.length !== 1 ? 's' : ''} detected
                </p>
              )}
            </div>

            {/* Discount Code */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="e.g. FALL2026FREE"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={sending}
              />
              <p className="text-xs text-gray-400 mt-1">
                If provided, students will be told to enter this code at checkout
              </p>
            </div>

            {/* Email Preview */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Preview
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-medium text-gray-900 mb-2">
                  Subject: You're invited to join {course.title} on AI Engagement Hub
                </p>
                <hr className="my-2 border-gray-200" />
                <p className="mb-2">
                  <strong>{instructorName}</strong> has invited you to join <strong>{course.title}</strong> ({course.semester} {course.year}) on AI Engagement Hub.
                </p>
                <p className="mb-2">
                  Click the link below to get started:
                </p>
                <p className="text-indigo-600 underline mb-2 break-all text-xs">{joinUrl}</p>
                <p className="mb-1 font-medium">Here's what to expect:</p>
                <ol className="list-decimal list-inside mb-2 space-y-1 text-xs text-gray-600">
                  <li>Create your free account (or log in if you have one)</li>
                  {discountCode.trim() ? (
                    <li>Enter your discount code <strong>{discountCode.trim()}</strong> at checkout</li>
                  ) : (
                    <li>Pay the $49 semester access fee (or enter a discount code if you have one)</li>
                  )}
                  <li>Your instructor will approve your enrollment</li>
                </ol>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="mb-4">
                {results.sent.length > 0 && (
                  <div className="flex items-start bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {results.sent.length} invitation{results.sent.length !== 1 ? 's' : ''} sent successfully
                      </p>
                    </div>
                  </div>
                )}
                {results.failed.length > 0 && (
                  <div className="flex items-start bg-red-50 border border-red-200 rounded-lg p-3">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Failed to send to {results.failed.length} address{results.failed.length !== 1 ? 'es' : ''}:
                      </p>
                      <p className="text-xs text-red-600 mt-1">{results.failed.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={sending}
            >
              {results ? 'Close' : 'Cancel'}
            </button>
            {!results && (
              <button
                onClick={handleSend}
                disabled={emails.length === 0 || sending}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Send {emails.length > 0 ? `${emails.length} Invite${emails.length !== 1 ? 's' : ''}` : 'Invites'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
