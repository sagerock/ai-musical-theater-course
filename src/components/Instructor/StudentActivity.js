import React, { useState, useEffect, useCallback } from 'react';
import { chatApi, projectApi, userApi, tagApi } from '../../services/firebaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import SessionDetailModal from './SessionDetailModal';
import {
  FunnelIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function StudentActivity({ selectedCourseId, selectedCourse, currentUser }) {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    userId: '',
    projectId: '',
    toolUsed: '',
    tagId: '',
    startDate: '',
    endDate: '',
    hasReflection: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const promises = [
        Promise.resolve({ totalChats: 0, totalUsers: 0, totalProjects: 0, reflectionCompletionRate: 0 }), // Default stats for Firebase
        chatApi.getChatsWithFilters({
          courseId: selectedCourseId,
          userId: filters.userId,
          projectId: filters.projectId,
          toolUsed: filters.toolUsed,
          startDate: filters.startDate,
          endDate: filters.endDate
        }),
        projectApi.getAllProjects(selectedCourseId),
        userApi.getAllUsers(selectedCourseId),
        tagApi.getAllTags(selectedCourseId)
      ];
      
      const results = await Promise.allSettled(promises);

      // Handle chats
      if (results[1].status === 'fulfilled') {
        setChats(results[1].value);
      }

      // Handle projects
      if (results[2].status === 'fulfilled') {
        setProjects(results[2].value);
      }

      // Handle users
      if (results[3].status === 'fulfilled') {
        setUsers(results[3].value);
      }

      // Handle tags
      if (results[4].status === 'fulfilled') {
        setTags(results[4].value);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, currentUser?.id, filters.userId, filters.projectId, filters.toolUsed, filters.startDate, filters.endDate]);

  const applyFilters = useCallback(() => {
    let filtered = [...chats];

    // Apply tag filter
    if (filters.tagId) {
      filtered = filtered.filter(chat => 
        chat.chat_tags?.some(tag => tag.tags?.id === filters.tagId)
      );
    }

    // Apply reflection filter
    if (filters.hasReflection) {
      const hasReflection = filters.hasReflection === 'true';
      filtered = filtered.filter(chat => 
        hasReflection ? chat.has_reflection : !chat.has_reflection
      );
    }

    setFilteredChats(filtered);
  }, [chats, filters.tagId, filters.hasReflection]);

  useEffect(() => {
    if (selectedCourseId && currentUser?.id) {
      loadDashboardData();
    }
  }, [selectedCourseId, currentUser?.id, loadDashboardData]);

  useEffect(() => {
    // Reload data when significant filters change to optimize backend queries
    if (selectedCourseId && currentUser?.id) {
      setFiltersLoading(true);
      loadDashboardData().finally(() => setFiltersLoading(false));
    }
  }, [filters.userId, filters.projectId, filters.toolUsed, filters.startDate, filters.endDate, selectedCourseId, currentUser?.id, loadDashboardData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]); // Only apply client-side for tag and reflection filters


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      projectId: '',
      toolUsed: '',
      tagId: '',
      startDate: '',
      endDate: '',
      hasReflection: ''
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Firebase users don't have analytics export functionality yet
      toast.error('Data export is not yet available. Please contact support.');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    setIsModalOpen(true);
  };

  const uniqueTools = [...new Set(chats.map(chat => chat.tool_used).filter(Boolean))];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Student Activity</h2>
          <p className="text-sm text-gray-600">
            {filteredChats.length} of {chats.length} interactions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Students</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                name="projectId"
                value={filters.projectId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Tool</label>
              <select
                name="toolUsed"
                value={filters.toolUsed}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Tools</option>
                {uniqueTools.map(tool => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
              <select
                name="tagId"
                value={filters.tagId}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Has Reflection</label>
              <select
                name="hasReflection"
                value={filters.hasReflection}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="true">With Reflection</option>
                <option value="false">Without Reflection</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Cards */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No interactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters to see more results.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <div key={chat.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {/* Student Info */}
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <UsersIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {chat.users?.name || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {chat.users?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Project Info */}
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <FolderIcon className="h-4 w-4 text-gray-400" />
                          <span className="truncate">
                            {chat.projects?.title || 'Untitled Project'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Date */}
                      <div className="text-sm text-gray-500">
                        {(() => {
                          if (!chat.created_at) return 'Unknown date';
                          
                          // Handle Firestore timestamp
                          const date = chat.created_at?.toDate ? chat.created_at.toDate() : new Date(chat.created_at);
                          
                          if (isNaN(date)) return 'Unknown date';
                          
                          return format(date, 'MMM dd, yyyy');
                        })()}
                      </div>
                    </div>
                    
                    {/* Message Preview */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {chat.user_message?.substring(0, 200)}
                        {chat.user_message?.length > 200 ? '...' : ''}
                      </p>
                    </div>
                    
                    {/* Metadata Row */}
                    <div className="flex items-center space-x-4 text-sm">
                      {/* AI Tool */}
                      <div className="flex items-center space-x-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {chat.tool_used || 'Unknown'}
                        </span>
                      </div>
                      
                      {/* Reflection Status */}
                      <div className="flex items-center space-x-1">
                        {chat.has_reflection ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Reflection Complete</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">No Reflection</span>
                          </>
                        )}
                      </div>
                      
                      {/* Tags if available */}
                      {chat.chat_tags && chat.chat_tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-500">Tags:</span>
                          <div className="flex space-x-1">
                            {chat.chat_tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag.tags?.name || 'Tag'}
                              </span>
                            ))}
                            {chat.chat_tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{chat.chat_tags.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => handleChatClick(chat)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <SessionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chat={selectedChat}
      />
    </div>
  );
}