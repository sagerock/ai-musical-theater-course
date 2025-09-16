import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, userApi } from '../../services/firebaseApi';
import { emailNotifications, getDisplayNameForEmail } from '../../services/emailService';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function InstructorMessaging() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);
  
  const [formData, setFormData] = useState({
    courseId: '',
    subject: '',
    message: ''
  });

  const [courses, setCourses] = useState([]);
  const [selectedCourseStudents, setSelectedCourseStudents] = useState([]);


  const loadInstructorCourses = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const instructorCourses = await courseApi.getUserCourses(currentUser.id);
      
      // Filter for courses where user is an instructor
      const instructorOnlyCourses = instructorCourses.filter(
        membership => membership.role === 'instructor'
      );
      
      setCourses(instructorOnlyCourses);
    } catch (error) {
      console.error('Error loading instructor courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  const loadCourseStudents = useCallback(async (courseId) => {
    try {
      console.log('🚨 DEBUG - loadCourseStudents called with courseId:', courseId);
      const courseMembers = await userApi.getAllUsers(courseId);
      console.log('🔍 Debug - getAllUsers result:', courseMembers);

      // Include ALL course members (students, instructors, assistants, admins)
      // No filtering - everyone in the course gets the message
      const allMembers = courseMembers.filter(member => {
        // Just check they have an email address
        return member.email;
      });

      console.log('🔍 Debug - all course members:', allMembers);
      console.log('🚨 DEBUG - Setting selectedCourseStudents to:', allMembers.length, 'members (all roles)');
      setSelectedCourseStudents(allMembers);
    } catch (error) {
      console.error('Error loading course members:', error);
      toast.error('Failed to load course members');
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadInstructorCourses();
    }
  }, [currentUser?.id, loadInstructorCourses]);

  useEffect(() => {
    if (formData.courseId) {
      loadCourseStudents(formData.courseId);
    } else {
      setSelectedCourseStudents([]);
    }
  }, [formData.courseId, loadCourseStudents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendMessage = async (e) => {
    console.log('🚨 DEBUG - handleSendMessage called!', e);
    e.preventDefault();
    
    console.log('🔍 DEBUG - Form submission started:', {
      courseId: formData.courseId,
      subject: formData.subject?.length,
      message: formData.message?.length,
      selectedCourseStudents: selectedCourseStudents.length
    });
    
    if (!formData.courseId || !formData.subject.trim() || !formData.message.trim()) {
      console.log('❌ DEBUG - Form validation failed');
      toast.error('Course, subject, and message are required');
      return;
    }

    if (selectedCourseStudents.length === 0) {
      console.log('❌ DEBUG - No members in selected course');
      console.log('🔍 DEBUG - selectedCourseStudents array:', selectedCourseStudents);
      toast.error('No members found in selected course');
      return;
    }

    try {
      setSending(true);
      setSendResults(null);

      // Get course information
      const selectedCourse = courses.find(c => c.courses.id === formData.courseId);
      
      if (!selectedCourse) {
        toast.error('Course not found');
        return;
      }

      // Format members for email service
      console.log('🔍 Debug - selectedCourseStudents:', selectedCourseStudents);

      const formattedStudents = selectedCourseStudents.map(member => {
        console.log('🔍 Debug - processing member:', member);

        // The getAllUsers method returns user data directly (not nested under 'users')
        const email = member.email;
        const memberRole = member.course_role || member.course_memberships?.[0]?.role || member.role || 'student';

        return {
          email: email,
          name: getDisplayNameForEmail(member, memberRole)
        };
      }).filter(member => {
        if (!member.email) {
          console.warn('⚠️ Member missing email:', member);
        }
        return member.email;
      });

      console.log('📧 Debug - formattedStudents:', formattedStudents);

      // Send messages
      const messageData = {
        students: formattedStudents,
        subject: formData.subject,
        messageContent: formData.message.replace(/\n/g, '<br>'),
        instructorName: getDisplayNameForEmail(currentUser, 'instructor'),
        courseName: selectedCourse.courses.title,
        courseCode: selectedCourse.courses.course_code,
        courseId: formData.courseId
      };

      const results = await emailNotifications.sendInstructorMessage(messageData);
      setSendResults(results);

      if (results.success) {
        const successCount = results.results.filter(r => r.success).length;
        toast.success(`Message sent successfully to ${successCount} course members!`);
        
        // Clear form
        setFormData({
          courseId: '',
          subject: '',
          message: ''
        });
      } else {
        toast.error('Failed to send messages');
      }
    } catch (error) {
      console.error('Error sending instructor message:', error);
      toast.error('Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const getSelectedCourse = () => {
    return courses.find(c => c.courses.id === formData.courseId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-500" />
            Instructor Messaging
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Send messages to all course members (students, instructors, assistants)
          </p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <AcademicCapIcon className="h-4 w-4 mr-1" />
            <span>{courses.length} courses</span>
          </div>
          <div className="flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            <span>{selectedCourseStudents.length} recipients</span>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-8">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No courses found where you are an instructor</p>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="space-y-6">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a course...</option>
              {courses.map((courseMembership) => (
                <option key={courseMembership.courses.id} value={courseMembership.courses.id}>
                  {courseMembership.courses.title} ({courseMembership.courses.course_code})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Course Info */}
          {formData.courseId && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">
                    {getSelectedCourse()?.courses.title}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {getSelectedCourse()?.courses.course_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{selectedCourseStudents.length}</span> course members
                  </p>
                </div>
              </div>
            </div>
          )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="Enter your message to students..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Send Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {formData.courseId ? (
                `This message will be sent to ${selectedCourseStudents.length} course members`
              ) : (
                'Select a course to see member count'
              )}
            </div>
            <button
              type="submit"
              disabled={sending || !formData.courseId || !formData.subject.trim() || !formData.message.trim()}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      )}

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

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Instructor Messaging Notes</p>
            <ul className="space-y-1 text-xs">
              <li>• Messages will be sent to all students in the selected course</li>
              <li>• Students will receive notifications based on their email preferences</li>
              <li>• Use course messaging for announcements, reminders, and feedback</li>
              <li>• All messages include course context and direct links to the course</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}