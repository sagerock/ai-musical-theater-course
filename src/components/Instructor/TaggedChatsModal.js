import React, { useState, useEffect } from 'react';
import { tagApi } from '../../services/supabaseApi';
import { format } from 'date-fns';
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  FolderIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function TaggedChatsModal({ 
  isOpen, 
  onClose, 
  tagName, 
  tagId, 
  courseId,
  tagColor = '#3B82F6'
}) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tagId && courseId) {
      loadTaggedChats();
    }
  }, [isOpen, tagId, courseId]);

  const loadTaggedChats = async () => {
    try {
      setLoading(true);
      const chatData = await tagApi.getTaggedChats(tagId, courseId);
      setChats(chatData);
    } catch (error) {
      console.error('Error loading tagged chats:', error);
      toast.error('Failed to load tagged conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy \'at\' h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const createPreview = (prompt) => {
    if (!prompt) return 'No preview available';
    const cleanPrompt = prompt.replace(/\s+/g, ' ').trim();
    return cleanPrompt.length > 150 ? cleanPrompt.substring(0, 150) + '...' : cleanPrompt;
  };

  const handleViewProject = (projectId) => {
    if (projectId) {
      // Navigate to the project page where this chat exists
      window.open(`/chat/${projectId}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-6 h-6 rounded-full border border-gray-300"
              style={{ backgroundColor: tagColor }}
            />
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Conversations tagged with "{tagName}"
              </h2>
              <p className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${chats.length} conversation${chats.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-32 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No conversations have been tagged with "{tagName}" in this course yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Chat Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {chat.title || 'Untitled Conversation'}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <UserIcon className="h-3 w-3" />
                          <span>{chat.student?.name || 'Unknown Student'}</span>
                        </div>
                        {chat.project && (
                          <div className="flex items-center space-x-1">
                            <FolderIcon className="h-3 w-3" />
                            <span>{chat.project.title}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{formatDate(chat.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {chat.project_id ? (
                      <button
                        onClick={() => handleViewProject(chat.project_id)}
                        className="flex items-center space-x-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        <span>View Project</span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 px-3 py-1">
                        No project linked
                      </span>
                    )}
                  </div>

                  {/* Chat Preview */}
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {createPreview(chat.user_prompt)}
                    </p>
                  </div>

                  {/* Student Info */}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Student: {chat.student?.name || 'Unknown'} ({chat.student?.email || 'No email'})
                    </span>
                    {chat.project && (
                      <span>
                        Project: {chat.project.title}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}