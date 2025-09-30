import React, { useState, useEffect, useCallback } from 'react';
import { chatApi, tagApi } from '../../services/firebaseApi';
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
  XCircleIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export default function StudentActivity({ selectedCourseId, selectedCourse, currentUser }) {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  
  // Filter states with default date range (last 30 days for performance)
  const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const [filters, setFilters] = useState({
    userId: '',
    projectId: '',
    toolUsed: '',
    tagId: '',
    ...getDefaultDateRange(), // Default to last 30 days
    hasReflection: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalChats, setTotalChats] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const CHATS_PER_PAGE = 50; // Reasonable page size

  // Helper function to display user-friendly AI tool names
  const getToolDisplayName = useCallback((toolName) => {
    if (!toolName) return 'Unknown Tool';
    
    const toolMap = {
      // OpenAI Models
      'gpt-5-mini-2025-08-07': 'GPT-5 Mini',
      'gpt-5-2025-08-07': 'GPT-5',
      // Anthropic Models
      'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
      'claude-opus-4-1-20250805': 'Claude Opus 4.1',
      // Google Models
      'gemini-2.5-flash': 'Gemini Flash',
      'gemini-flash': 'Gemini Flash',
      // Perplexity Models
      'sonar-pro': 'Sonar Pro',
      // Display name mappings
      'Claude Sonnet 4': 'Claude Sonnet 4',
      'GPT-5 Nano': 'GPT-5 Nano',
      'GPT-5 Mini': 'GPT-5 Mini',
      'GPT-5': 'GPT-5',
      'Gemini Flash': 'Gemini Flash',
      'Sonar Pro': 'Sonar Pro'
    };
    
    return toolMap[toolName] || toolName;
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Users, projects, and tags will all be extracted from chats

      // Set available AI tools from system configuration
      // Use actual database values that might exist in chats
      const allConfiguredTools = [
        // Current models
        'gpt-5-mini-2025-08-07',
        'gpt-5-2025-08-07',
        'claude-sonnet-4-5-20250929',
        'claude-opus-4-1-20250805', 
        'gemini-2.5-flash',
        'sonar-pro',
        // Display name formats
        'GPT-5 Nano',      // Display format
        'GPT-5 Mini',      // Display format
        'GPT-5',           // Display format
        'Claude Sonnet 4', // Display format
        'Gemini Flash',    // Display format
        'Sonar Pro'        // Display format
      ];
      
      // Remove duplicates based on display name but keep one representative value
      const uniqueTools = [];
      const seenDisplayNames = new Set();
      
      for (const tool of allConfiguredTools) {
        const displayName = getToolDisplayName(tool);
        if (!seenDisplayNames.has(displayName)) {
          seenDisplayNames.add(displayName);
          uniqueTools.push(tool);
        }
      }
      
      setAvailableTools(uniqueTools);
      console.log('📊 Available AI tools configured:', uniqueTools);

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, getToolDisplayName]);

  // Load recent chats to populate filter dropdowns (optimized - only last 200 for metadata)
  const loadFilterMetadata = useCallback(async () => {
    try {
      console.log('👥📁🏷️ Loading recent chats to extract filter metadata');
      
      const recentChats = await chatApi.getChatsWithFiltersOptimized({
        courseId: selectedCourseId,
        limit: 200 // Only load recent chats for metadata extraction
      });
      
      // Extract unique users from all chats
      const uniqueUsers = [];
      const seenUserIds = new Set();
      
      // Extract unique projects from all chats
      const uniqueProjects = [];
      const seenProjectIds = new Set();
      
      // Extract unique tags from all chats
      const uniqueTags = [];
      const seenTagIds = new Set();
      
      recentChats.forEach(chat => {
        // Extract users
        if (chat.users && chat.userId && !seenUserIds.has(chat.userId)) {
          seenUserIds.add(chat.userId);
          uniqueUsers.push({
            id: chat.userId,
            name: chat.users.name || chat.users.displayName || 'Unknown User',
            email: chat.users.email || 'No email'
          });
        }
        
        // Extract projects
        if (chat.projects && chat.projectId && !seenProjectIds.has(chat.projectId)) {
          seenProjectIds.add(chat.projectId);
          uniqueProjects.push({
            id: chat.projectId,
            title: chat.projects.title || 'Untitled Project',
            description: chat.projects.description || ''
          });
        }
        
        // Extract tags from chat_tags
        if (chat.chat_tags && Array.isArray(chat.chat_tags)) {
          chat.chat_tags.forEach(chatTag => {
            if (chatTag.tags && chatTag.tags.id && !seenTagIds.has(chatTag.tags.id)) {
              seenTagIds.add(chatTag.tags.id);
              uniqueTags.push({
                id: chatTag.tags.id,
                name: chatTag.tags.name || 'Unnamed Tag',
                color: chatTag.tags.color || '#3B82F6'
              });
            }
          });
        }
      });
      
      console.log('👥 Extracted unique users from recent chats:', uniqueUsers.length);
      console.log('📁 Extracted unique projects from recent chats:', uniqueProjects.length);
      console.log('🏷️ Extracted unique tags from recent chats:', uniqueTags.length);
      
      setUsers(uniqueUsers.sort((a, b) => a.name.localeCompare(b.name)));
      setProjects(uniqueProjects.sort((a, b) => a.title.localeCompare(b.title)));
      setTags(uniqueTags.sort((a, b) => a.name.localeCompare(b.name)));
      
    } catch (error) {
      console.error('Error loading all chats for filters:', error);
      setUsers([]);
      setProjects([]);
      setTags([]);
    }
  }, [selectedCourseId]);

  // Load paginated chats with current filters
  const loadPaginatedChats = useCallback(async (page = 1, resetData = true) => {
    try {
      setFiltersLoading(true);
      console.log(`📊 Loading page ${page} of chats with filters:`, filters);
      
      const chatsData = await chatApi.getChatsWithFiltersOptimized({
        courseId: selectedCourseId,
        userId: filters.userId || undefined,
        projectId: filters.projectId || undefined,
        toolUsed: filters.toolUsed || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: CHATS_PER_PAGE + 1 // Load one extra to check if there's a next page
      });
      
      // Check if there's a next page
      const hasMore = chatsData.length > CHATS_PER_PAGE;
      const pageData = hasMore ? chatsData.slice(0, CHATS_PER_PAGE) : chatsData;
      
      setHasNextPage(hasMore);
      setCurrentPage(page);
      
      if (resetData) {
        setChats(pageData);
        setTotalChats(pageData.length + (hasMore ? 1 : 0)); // Approximate total
      } else {
        // Append for "load more" functionality
        setChats(prev => [...prev, ...pageData]);
        setTotalChats(prev => prev + pageData.length);
      }
      
      console.log(`📊 Loaded page ${page}: ${pageData.length} chats, hasNextPage: ${hasMore}`);
      
    } catch (error) {
      console.error('Error loading paginated chats:', error);
      toast.error('Failed to load chat data');
      setChats([]);
    } finally {
      setFiltersLoading(false);
    }
  }, [selectedCourseId, filters.userId, filters.projectId, filters.toolUsed, filters.startDate, filters.endDate]);

  // Load more chats (for pagination)
  const loadMoreChats = () => {
    if (hasNextPage && !filtersLoading) {
      loadPaginatedChats(currentPage + 1, false);
    }
  };

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

  // Load initial data when component mounts
  useEffect(() => {
    if (selectedCourseId && currentUser?.id) {
      loadInitialData();
      loadFilterMetadata();
    }
  }, [selectedCourseId, currentUser?.id, loadInitialData, loadFilterMetadata]);

  // Load chats when filters change (server-side filtering with pagination)
  useEffect(() => {
    if (selectedCourseId && currentUser?.id) {
      setCurrentPage(1); // Reset to first page when filters change
      loadPaginatedChats(1, true);
    }
  }, [selectedCourseId, currentUser?.id, loadPaginatedChats, filters.userId, filters.projectId, filters.toolUsed, filters.startDate, filters.endDate]);

  // Apply client-side filters (tags and reflection status)
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);


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
      ...getDefaultDateRange(), // Reset to default 30-day range
      hasReflection: ''
    });
  };

  const viewAllTime = () => {
    setFilters(prev => ({
      ...prev,
      startDate: '',
      endDate: ''
    }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      console.log('🔽 Export started, chats data:', chats.length, 'items');
      
      if (chats.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      // Create CSV content from the chat data
      const csvHeaders = [
        'Date',
        'Student Name',
        'Student Email', 
        'Project Title',
        'AI Model',
        'Conversation Length',
        'Reflection Status',
        'Tags',
        'Chat ID'
      ];
      
      const csvRows = chats.map(chat => {
        const user = users.find(u => u.id === chat.userId);
        const project = projects.find(p => p.id === chat.projectId);
        const chatTags = tags.filter(tag => 
          chat.tags && chat.tags.includes(tag.id)
        ).map(tag => tag.name).join('; ');
        
        // Handle Firestore timestamp - it might be a Timestamp object or ISO string
        let dateString = 'Unknown Date';
        try {
          if (chat.createdAt) {
            if (chat.createdAt.toDate) {
              // Firestore Timestamp object
              dateString = format(chat.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss');
            } else {
              // ISO string or Date object
              dateString = format(new Date(chat.createdAt), 'yyyy-MM-dd HH:mm:ss');
            }
          }
        } catch (dateError) {
          console.warn('Date formatting error for chat:', chat.id, dateError);
          dateString = 'Invalid Date';
        }
        
        return [
          dateString,
          user?.displayName || user?.name || 'Unknown User',
          user?.email || 'N/A',
          project?.title || 'Unknown Project',
          chat.tool_used || 'Unknown',
          chat.conversationLength || 0,
          chat.reflection_status || 'No Reflection',
          chatTags || 'None',
          chat.id
        ];
      });
      
      console.log('🔽 CSV rows created:', csvRows.length);
      
      // Combine headers and rows
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      console.log('🔽 CSV content length:', csvContent.length, 'characters');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fileName = `${selectedCourse?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'course'}_student_activity_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      console.log('🔽 Downloading file:', fileName);
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Successfully exported ${chats.length} student interactions to CSV`);
      console.log('🔽 Export completed successfully');
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      toast.error(`Failed to export data: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    setIsModalOpen(true);
  };


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
          <div className="text-sm text-gray-600">
            {filtersLoading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
                Loading filtered results...
              </span>
            ) : (
              `${filteredChats.length} of ${chats.length} interactions`
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium ${
              Object.values(filters).some(value => value) 
                ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {Object.values(filters).some(value => value) && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {Object.values(filters).filter(value => value).length}
              </span>
            )}
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
                {availableTools.map(tool => (
                  <option key={tool} value={tool}>
                    {getToolDisplayName(tool)}
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

            <div className="flex items-end space-x-2">
              <button
                onClick={clearFilters}
                className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Reset to 30 Days
              </button>
              <button
                onClick={viewAllTime}
                className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
              >
                View All Time
              </button>
            </div>
            
            {/* Performance Notice */}
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Performance Tip:</strong> Default shows last 30 days for faster loading. 
                Use "View All Time" to see complete history (may be slower for large courses).
              </p>
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
                          {getToolDisplayName(chat.tool_used)}
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
                      
                      {/* Project Tags if available */}
                      {chat.projects?.tagIds && chat.projects.tagIds.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            {chat.projects.tagIds.slice(0, 2).map((tagId, index) => {
                              const tag = tags.find(t => t.id === tagId);
                              return tag ? (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                                >
                                  <TagIcon className="h-3 w-3 mr-1" />
                                  {tag.name}
                                </span>
                              ) : null;
                            })}
                            {chat.projects.tagIds.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{chat.projects.tagIds.length - 2} more
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
        
        {/* Pagination Controls */}
        {!loading && filteredChats.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={loadMoreChats}
                disabled={!hasNextPage || filtersLoading}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {filtersLoading ? 'Loading...' : hasNextPage ? 'Load More' : 'All Loaded'}
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredChats.length}</span> results
                  {hasNextPage && <span className="text-gray-500"> (more available)</span>}
                </p>
              </div>
              {hasNextPage && (
                <div>
                  <button
                    onClick={loadMoreChats}
                    disabled={filtersLoading}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {filtersLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      'Load More Activity'
                    )}
                  </button>
                </div>
              )}
            </div>
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