import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { chatApi, courseApi, projectApi, userApi } from '../../services/firebaseApi';
import toast from 'react-hot-toast';
import {
  FolderIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

export default function Overview({ selectedCourseId, selectedCourse, currentUser }) {
  const [stats, setStats] = useState({
    totalChats: 0,
    totalUsers: 0,
    totalProjects: 0,
    reflectionCompletionRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to display user-friendly AI tool names
  const getToolDisplayName = useCallback((toolName) => {
    if (!toolName) return 'Unknown Tool';
    
    const toolMap = {
      // OpenAI Models (new)
      'gpt-4.1-mini': 'GPT-4.1 Mini',
      'gpt-4.1': 'GPT-4.1',
      // OpenAI Models (legacy - for backward compatibility)
      'gpt-4o-2024-08-06': 'GPT-4o',
      'gpt-4o': 'GPT-4o',
      // Anthropic Models
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      'claude-sonnet-4': 'Claude Sonnet 4',
      'claude-4-opus-20250514': 'Claude Opus 4',
      // Google Models
      'gemini-1.5-flash': 'Gemini Flash',
      'gemini-flash': 'Gemini Flash',
      'gemini-2.5-pro': 'Gemini 2.5 Pro',
      // Perplexity Models
      'sonar-pro': 'Sonar Pro',
      // Display name mappings
      'Claude Sonnet 4': 'Claude Sonnet 4',
      'Claude Opus 4': 'Claude Opus 4',
      'GPT-4.1 Mini': 'GPT-4.1 Mini',
      'GPT-4.1': 'GPT-4.1',
      'GPT-4o': 'GPT-4o',
      'Gemini Flash': 'Gemini Flash',
      'Gemini 2.5 Pro': 'Gemini 2.5 Pro',
      'Sonar Pro': 'Sonar Pro'
    };
    
    return toolMap[toolName] || toolName;
  }, []);

  const loadOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading overview data for course:', selectedCourseId);
      
      // Load chat data (which includes user/project info) and pending requests
      const [chats, pendingRequests] = await Promise.all([
        chatApi.getChatsWithFilters({
          courseId: selectedCourseId,
          limit: 1000  // Get all chats for accurate count
        }).catch(error => {
          console.log('❌ Error loading chats:', error);
          return [];
        }),
        courseApi.getPendingApprovals(selectedCourseId, currentUser.id).catch(error => {
          console.log('❌ Error loading pending approvals (this is normal for Teaching Assistants):', error);
          return [];
        })
      ]);

      // Extract unique projects and users from chat data
      const projectsFromChats = [];
      const usersFromChats = [];
      const seenProjects = new Set();
      const seenUsers = new Set();

      chats.forEach(chat => {
        // Extract project info
        if (chat.projects && chat.projects.id && !seenProjects.has(chat.projects.id)) {
          projectsFromChats.push(chat.projects);
          seenProjects.add(chat.projects.id);
        }
        
        // Extract user info  
        if (chat.users && chat.userId && !seenUsers.has(chat.userId)) {
          usersFromChats.push({
            id: chat.userId,
            name: chat.users.name,
            email: chat.users.email,
            course_role: 'student', // Assume student role for counting
            status: 'approved' // Assume approved if they have chats
          });
          seenUsers.add(chat.userId);
        }
      });

      const projects = projectsFromChats;
      const users = usersFromChats;
      
      // Debug logging
      console.log('🔍 Debug data loaded:', {
        selectedCourseId,
        chatsCount: chats.length,
        projectsCount: projects.length,
        usersCount: users.length,
        pendingRequestsCount: pendingRequests.length,
        sampleChat: chats[0] ? {
          id: chats[0].id,
          userId: chats[0].userId || chats[0].user_id,
          projectId: chats[0].projectId || chats[0].project_id,
          fields: Object.keys(chats[0])
        } : 'No chats',
        sampleUser: users[0] ? {
          id: users[0].id || users[0].user_id,
          name: users[0].name,
          fields: Object.keys(users[0])
        } : 'No users',
        sampleProject: projects[0] ? {
          id: projects[0].id,
          title: projects[0].title,
          fields: Object.keys(projects[0])
        } : 'No projects'
      });
      
      // Calculate statistics
      const totalChats = chats.length;
      const totalProjects = projects.length;
      // Count only approved students (not instructors)
      const totalUsers = users.filter(user => 
        user.course_role === 'student' && user.status === 'approved'
      ).length;
      
      // Calculate reflection completion rate
      const chatsWithReflections = chats.filter(chat => chat.has_reflection).length;
      const reflectionCompletionRate = totalChats > 0 ? 
        Math.round((chatsWithReflections / totalChats) * 100) : 0;
      
      const calculatedStats = {
        totalChats,
        totalUsers,
        totalProjects,
        reflectionCompletionRate
      };
      
      console.log('📊 Calculated overview stats:', calculatedStats);
      setStats(calculatedStats);
      
      // Recent activity uses chat data directly (already enriched by getChatsWithFilters)
      const recentChats = chats.slice(0, 10);
      
      console.log('🔍 Sample chat data:', recentChats[0]);
      setRecentActivity(recentChats);
      setPendingApprovals(pendingRequests);
      
    } catch (error) {
      console.error('Error loading overview data:', error);
      toast.error('Failed to load overview data');
      // Set fallback stats
      setStats({
        totalChats: 0,
        totalUsers: 0,
        totalProjects: 0,
        reflectionCompletionRate: 0
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, currentUser?.id]);

  useEffect(() => {
    if (selectedCourseId && currentUser?.id) {
      loadOverviewData();
    }
  }, [selectedCourseId, currentUser?.id, loadOverviewData]);

  const handleApproval = async (membershipId, status) => {
    try {
      await courseApi.updateMembershipStatus(membershipId, status, currentUser.id);
      toast.success(`Request ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      // Reload pending approvals
      const updatedRequests = await courseApi.getPendingApprovals(selectedCourseId, currentUser.id);
      setPendingApprovals(updatedRequests);
    } catch (error) {
      console.error('Error updating membership status:', error);
      toast.error(`Failed to ${status === 'approved' ? 'approve' : 'reject'} request`);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Context Header */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCourse?.courses?.title || 'Course Overview'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedCourse?.courses?.course_code && selectedCourse?.courses?.semester && selectedCourse?.courses?.year ? (
                <>
                  {selectedCourse.courses.course_code} • {selectedCourse.courses.semester} {selectedCourse.courses.year}
                  <span className="ml-2 text-gray-400">•</span>
                  <span className="ml-2">All metrics below are for this specific course</span>
                </>
              ) : (
                'All metrics below are for the currently selected course'
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Course Statistics</div>
            <div className="text-xs text-gray-400 mt-1">
              Updated in real-time
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Notification */}
      {pendingApprovals.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Pending Course Requests ({pendingApprovals.length})
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p className="mb-3">
                  {pendingApprovals.length === 1 
                    ? 'There is 1 person waiting for approval to join this course.'
                    : `There are ${pendingApprovals.length} people waiting for approval to join this course.`
                  }
                </p>
                <div className="space-y-3">
                  {pendingApprovals.map(request => (
                    <div 
                      key={request.id} 
                      className="flex items-center justify-between bg-white p-3 rounded border border-orange-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <UserPlusIcon className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.users?.name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.users?.email || 'No email'} • Role: {request.role || 'student'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval(request.id, 'approved')}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval(request.id, 'rejected')}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">
              <FolderIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Student Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              <p className="text-xs text-gray-500 mt-1">In this course</p>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/instructor/activity"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
            >
              View all projects <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Interactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChats}</p>
              <p className="text-xs text-gray-500 mt-1">Course-specific chats</p>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/instructor/activity"
              className="text-sm text-green-600 hover:text-green-700 flex items-center"
            >
              View interactions <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Enrolled in this course</p>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/instructor/activity"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              View students <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-md">
              <DocumentTextIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reflection Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.reflectionCompletionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">AI chats with reflections</p>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/instructor/activity"
              className="text-sm text-orange-600 hover:text-orange-700 flex items-center"
            >
              View reflections <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/instructor/messaging"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-md mr-3">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Send Message</p>
              <p className="text-sm text-gray-500">Message students in this course</p>
            </div>
          </Link>

          <Link
            to="/instructor/files"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-md mr-3">
              <DocumentTextIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Review Files</p>
              <p className="text-sm text-gray-500">View student PDF uploads</p>
            </div>
          </Link>

          <Link
            to="/instructor/course-settings"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-md mr-3">
              <ChartBarIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Manage Tags</p>
              <p className="text-sm text-gray-500">Organize interaction categories</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Link 
            to="/instructor/activity"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            View all <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No recent activity in this course</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((chat) => (
              <div key={chat.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {chat.has_reflection ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{chat.users?.name || 'Unknown User'}</p>
                    <span className="text-xs text-gray-500">•</span>
                    <p className="text-sm text-gray-500">{chat.projects?.title || 'Untitled Project'}</p>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{chat.user_message?.substring(0, 100)}...</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {(() => {
                        if (!chat.created_at) return 'Unknown date';
                        const date = chat.created_at?.toDate ? chat.created_at.toDate() : new Date(chat.created_at);
                        if (isNaN(date)) return 'Unknown date';
                        return date.toLocaleDateString();
                      })()}
                    </span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {getToolDisplayName(chat.tool_used)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}