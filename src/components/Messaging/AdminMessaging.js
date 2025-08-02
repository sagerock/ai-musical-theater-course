import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/firebaseApi';
import { emailNotifications, getDisplayNameForEmail } from '../../services/emailService';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon,
  UsersIcon,
  AcademicCapIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function AdminMessaging() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);
  
  const [formData, setFormData] = useState({
    recipientType: 'instructors', // 'instructors' or 'all'
    subject: '',
    message: '',
    priority: 'normal'
  });

  const [recipientStats, setRecipientStats] = useState({
    instructors: 0,
    students: 0,
    total: 0
  });

  useEffect(() => {
    loadRecipientStats();
  }, []);

  const loadRecipientStats = async () => {
    try {
      setLoading(true);
      const [allUsers] = await Promise.all([
        userApi.getAllUsers()
      ]);

      // Count users who are instructors (either globally or in any course)
      const instructorUsers = allUsers.filter(user => {
        // Check if user has global instructor role
        if (user.role === 'instructor') return true;
        
        // Check if user has instructor role in any course
        if (user.course_memberships && user.course_memberships.length > 0) {
          return user.course_memberships.some(membership => 
            membership.role === 'instructor' && membership.status === 'approved'
          );
        }
        
        return false;
      });

      const instructors = instructorUsers.length;
      const students = allUsers.filter(user => user.role === 'student').length;
      const total = allUsers.length;

      console.log('📊 Instructor stats:', {
        totalUsers: allUsers.length,
        instructorUsers: instructorUsers.map(u => ({ name: u.name, email: u.email, globalRole: u.role, courseMemberships: u.course_memberships })),
        instructorCount: instructors
      });

      setRecipientStats({
        instructors,
        students,
        total
      });
    } catch (error) {
      console.error('Error loading recipient stats:', error);
      toast.error('Failed to load recipient statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    try {
      setSending(true);
      setSendResults(null);

      // Get recipients based on selected type
      const allUsers = await userApi.getAllUsers();
      let recipients = [];
      
      if (formData.recipientType === 'instructors') {
        // Filter users who are instructors (either globally or in any course)
        recipients = allUsers.filter(user => {
          // Check if user has global instructor role
          if (user.role === 'instructor') return true;
          
          // Check if user has instructor role in any course
          if (user.course_memberships && user.course_memberships.length > 0) {
            return user.course_memberships.some(membership => 
              membership.role === 'instructor' && membership.status === 'approved'
            );
          }
          
          return false;
        });
        
        console.log('📧 Selected instructors for messaging:', recipients.map(u => ({ name: u.name, email: u.email, globalRole: u.role })));
      } else if (formData.recipientType === 'all') {
        recipients = allUsers;
      }

      // Format recipients for email service
      const formattedRecipients = recipients.map(user => ({
        email: user.email,
        name: getDisplayNameForEmail(user, user.role)
      }));

      // Send messages
      const messageData = {
        recipients: formattedRecipients,
        subject: formData.subject,
        messageContent: formData.message.replace(/\n/g, '<br>'),
        senderName: getDisplayNameForEmail(currentUser, 'administrator'),
        recipientType: formData.recipientType === 'instructors' ? 'Instructors' : 'All Users',
        priority: formData.priority
      };

      const results = await emailNotifications.sendAdminMessage(messageData);
      setSendResults(results);

      if (results.success) {
        const successCount = results.results.filter(r => r.success).length;
        toast.success(`Message sent successfully to ${successCount} recipients!`);
        
        // Clear form
        setFormData({
          recipientType: 'instructors',
          subject: '',
          message: '',
          priority: 'normal'
        });
      } else {
        toast.error('Failed to send messages');
      }
    } catch (error) {
      console.error('Error sending admin message:', error);
      toast.error('Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const getRecipientCount = () => {
    if (formData.recipientType === 'instructors') {
      return recipientStats.instructors;
    } else if (formData.recipientType === 'all') {
      return recipientStats.total;
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <EnvelopeIcon className="h-5 w-5 mr-2 text-red-500" />
            Admin Messaging
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Send messages to instructors or all platform users
          </p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <AcademicCapIcon className="h-4 w-4 mr-1" />
            <span>{recipientStats.instructors} instructors</span>
          </div>
          <div className="flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            <span>{recipientStats.total} total users</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="space-y-6">
        {/* Recipient Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipients
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="recipientType"
                value="instructors"
                checked={formData.recipientType === 'instructors'}
                onChange={handleInputChange}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                formData.recipientType === 'instructors' 
                  ? 'bg-red-500 border-red-500' 
                  : 'border-gray-300'
              }`}>
                {formData.recipientType === 'instructors' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="font-medium">Instructors Only</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Send to {recipientStats.instructors} instructors
                </p>
              </div>
            </label>
            
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="recipientType"
                value="all"
                checked={formData.recipientType === 'all'}
                onChange={handleInputChange}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                formData.recipientType === 'all' 
                  ? 'bg-red-500 border-red-500' 
                  : 'border-gray-300'
              }`}>
                {formData.recipientType === 'all' && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <UsersIcon className="h-5 w-5 mr-2 text-green-500" />
                  <span className="font-medium">All Users</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Send to {recipientStats.total} total users
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="Enter message subject"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={6}
            placeholder="Enter your message here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Send Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            This message will be sent to {getRecipientCount()} recipients
          </div>
          <button
            type="submit"
            disabled={sending || !formData.subject.trim() || !formData.message.trim()}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </button>
        </div>
      </form>

      {/* Send Results */}
      {sendResults && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Send Results</h4>
          
          <div className="space-y-2">
            {sendResults.results.map((result, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center">
                  {result.success ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm">{result.name}</span>
                </div>
                <span className="text-xs text-gray-500">{result.email}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span>Success Rate:</span>
              <span className={`font-medium ${
                sendResults.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {sendResults.results.filter(r => r.success).length}/{sendResults.results.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important Notice</p>
            <ul className="space-y-1 text-xs">
              <li>• Messages will be sent immediately to all selected recipients</li>
              <li>• Recipients will receive notifications based on their email preferences</li>
              <li>• Use admin messaging responsibly for important announcements only</li>
              <li>• All messages are logged for administrative oversight</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}