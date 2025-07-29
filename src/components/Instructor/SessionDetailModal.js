import React from 'react';
import { format } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';
import MarkdownRenderer from '../Chat/MarkdownRenderer';
import InstructorNotes from './InstructorNotes';

export default function SessionDetailModal({ chat, isOpen, onClose }) {
  if (!isOpen || !chat) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Chat Session Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Student</h4>
                  <p className="text-sm text-gray-600">{chat.users?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{chat.users?.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Project</h4>
                  <p className="text-sm text-gray-600">{chat.projects?.title || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">AI Tool Used</h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {chat.tool_used}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Date</h4>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      if (!chat.created_at) return 'Unknown date';
                      const date = chat.created_at?.toDate ? chat.created_at.toDate() : new Date(chat.created_at);
                      if (isNaN(date)) return 'Unknown date';
                      return format(date, 'MMM dd, yyyy HH:mm');
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Tags */}
              {chat.chat_tags && chat.chat_tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {chat.chat_tags.map((chatTag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {chatTag.tags.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Conversation */}
            <div className="space-y-4">
              {/* Student Prompt */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Student Prompt</h4>
                <div className="text-sm text-blue-800 whitespace-pre-wrap">
                  {chat.prompt}
                </div>
              </div>

              {/* AI Response */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">AI Response</h4>
                <div className="text-sm text-green-800 prose prose-sm max-w-none">
                  {chat.response ? (
                    <MarkdownRenderer>{chat.response}</MarkdownRenderer>
                  ) : (
                    <div className="text-gray-400 italic">No response available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Reflection */}
            {chat.reflections && chat.reflections.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-900 mb-2">Student Reflection</h4>
                <div className="text-sm text-purple-800 whitespace-pre-wrap">
                  {chat.reflections[0].content}
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  Submitted: {(() => {
                    const reflection = chat.reflections[0];
                    if (!reflection?.created_at) return 'Unknown date';
                    const date = reflection.created_at?.toDate ? reflection.created_at.toDate() : new Date(reflection.created_at);
                    if (isNaN(date)) return 'Unknown date';
                    return format(date, 'MMM dd, yyyy HH:mm');
                  })()}
                </p>
              </div>
            )}

            {/* Instructor Notes */}
            {chat.projects && (
              <div className="mt-6">
                <InstructorNotes 
                  project={chat.projects} 
                  courseId={chat.course_id}
                  isInstructorView={true}
                />
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}