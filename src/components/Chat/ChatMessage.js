import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '../../contexts/AuthContext';
import { attachmentApi } from '../../services/firebaseApi';
import {
  UserIcon,
  ComputerDesktopIcon,
  TagIcon,
  ChatBubbleBottomCenterTextIcon,
  PlusIcon,
  DocumentIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function ChatMessage({ chat, onTagChat, onReflectOnChat, currentUserId }) {
  const { currentUser } = useAuth();
  const isCurrentUser = chat.user_id === currentUserId;
  const hasReflection = chat.reflections && chat.reflections.length > 0;
  const hasTags = chat.chat_tags && chat.chat_tags.length > 0;
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);

  // Detect if this is a Firebase user (Firebase UIDs don't follow UUID format)
  // Using Firebase API

  // Load attachments when component mounts
  useEffect(() => {
    loadAttachments();
  }, [chat.id]);

  const loadAttachments = async () => {
    try {
      const chatAttachments = await attachmentApi.getChatAttachments(chat.id);
      setAttachments(chatAttachments);
    } catch (error) {
      console.error('Error loading attachments:', error);
      // Handle permission errors gracefully - just show no attachments
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.log('📎 Attachment loading blocked by RLS - showing empty attachments');
        setAttachments([]);
      }
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const downloadUrl = await attachmentApi.getAttachmentDownloadUrl(attachment.storage_path);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* User Message */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900">
              {chat.users?.name || 'You'}
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(chat.created_at), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          <div className="mt-1 bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{chat.prompt}</p>
            
            {/* PDF Attachments */}
            {!loadingAttachments && attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                  >
                    <div className="flex items-center">
                      <DocumentIcon className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {attachment.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(attachment)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Download PDF"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Response */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <ComputerDesktopIcon className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900">{chat.tool_used}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              AI
            </span>
          </div>
          <div className="mt-1 bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-900">
              <MarkdownRenderer>{chat.response}</MarkdownRenderer>
            </div>
          </div>
        </div>
      </div>

      {/* Tags and Reflection Section */}
      {isCurrentUser && (
        <div className="ml-11 space-y-3">
          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TagIcon className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-700">Tags</span>
              </div>
              <button
                onClick={() => onTagChat(chat.id)}
                className="text-xs text-primary-600 hover:text-primary-500 font-medium"
              >
                {hasTags ? 'Edit Tags' : 'Add Tags'}
              </button>
            </div>
            {hasTags ? (
              <div className="flex flex-wrap gap-1">
                {chat.chat_tags.map((chatTag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {chatTag.tags.name}
                  </span>
                ))}
              </div>
            ) : (
              <button
                onClick={() => onTagChat(chat.id)}
                className="inline-flex items-center px-3 py-1 border border-dashed border-gray-300 rounded-md text-xs text-gray-500 hover:border-gray-400 hover:text-gray-600"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Add tags to categorize this interaction
              </button>
            )}
          </div>

          {/* Reflection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-700">Reflection</span>
              </div>
              <button
                onClick={() => onReflectOnChat(chat.id)}
                className="text-xs text-primary-600 hover:text-primary-500 font-medium"
              >
                {hasReflection ? 'Edit Reflection' : 'Add Reflection'}
              </button>
            </div>
            {hasReflection ? (
              <div className="bg-yellow-50 rounded-md p-3 border border-yellow-200">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {chat.reflections[0].content}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Reflected on {format(new Date(chat.reflections[0].created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            ) : (
              <button
                onClick={() => onReflectOnChat(chat.id)}
                className="inline-flex items-center px-3 py-1 border border-dashed border-gray-300 rounded-md text-xs text-gray-500 hover:border-gray-400 hover:text-gray-600"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Reflect on how AI helped your learning
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 