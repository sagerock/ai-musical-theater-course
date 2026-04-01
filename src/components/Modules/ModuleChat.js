import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { modulesApi, moduleProgressApi, chatApi, moduleChatApi } from '../../services/firebaseApi';
import { aiApi } from '../../services/aiApi';
import { getSmartConversationHistory } from '../../utils/conversationHistory';
import ContentRenderer from '../common/ContentRenderer';
import toast from 'react-hot-toast';

const ModuleChat = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [module, setModule] = useState(null);
  const [chats, setChats] = useState([]);
  const [progress, setProgress] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const loadData = useCallback(async () => {
    if (!currentUser || !moduleId) return;
    try {
      const [moduleData, chatHistory] = await Promise.all([
        modulesApi.getModuleById(moduleId),
        moduleChatApi.getModuleChats(moduleId, currentUser.uid)
      ]);
      setModule(moduleData);
      setChats(chatHistory);

      // Create or get progress
      const progressData = await moduleProgressApi.createOrGetProgress(
        currentUser.uid, moduleId, courseId
      );
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading module chat:', error);
      toast.error('Failed to load module');
    } finally {
      setLoading(false);
    }
  }, [currentUser, moduleId, courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || sending || !module) return;

    const userPrompt = prompt.trim();
    setPrompt('');
    setSending(true);

    try {
      // Build conversation history from existing chats
      const recentChats = getSmartConversationHistory(
        chats,
        module.aiModel,
        userPrompt,
        ''
      );

      // Send to AI with the module's custom system prompt
      const aiResponse = await aiApi.sendChatCompletion(
        userPrompt,
        module.aiModel,
        recentChats,
        module.systemPrompt
      );

      // Save the chat
      const chatData = {
        user_id: currentUser.uid,
        created_by: currentUser.uid,
        project_id: null,
        moduleId: moduleId,
        tool_used: module.aiModel,
        prompt: userPrompt,
        response: aiResponse,
        title: userPrompt.length > 50 ? userPrompt.substring(0, 50) + '...' : userPrompt
      };
      const savedChat = await chatApi.createChat(chatData, courseId);

      // Add to local state
      setChats(prev => [...prev, savedChat]);

      // Increment exchange count and check completion
      const updatedProgress = await moduleProgressApi.incrementExchangeCount(currentUser.uid, moduleId);
      setProgress(updatedProgress);

      if (updatedProgress && !updatedProgress.completed &&
          updatedProgress.exchangeCount >= module.minimumExchanges) {
        const completedProgress = await moduleProgressApi.markComplete(currentUser.uid, moduleId, savedChat.id);
        setProgress(completedProgress);
        toast.success('Module completed! Great conversation.', { duration: 5000 });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      setPrompt(userPrompt);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Module not found.</p>
        </div>
      </div>
    );
  }

  const isCompleted = progress?.completed;
  const exchangeCount = progress?.exchangeCount || 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <button
              onClick={() => navigate(`/course/${courseId}/modules`)}
              className="mr-3 p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                  Module {module.order}
                </span>
                <h2 className="text-lg font-semibold text-gray-900 truncate">{module.title}</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Using {module.aiModel}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Progress indicator */}
            {!isCompleted ? (
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((exchangeCount / module.minimumExchanges) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {exchangeCount}/{module.minimumExchanges}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Completion banner */}
      {isCompleted && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
          <p className="text-sm text-green-700 text-center">
            You've completed this module! Feel free to continue the conversation.
          </p>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chats.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">Start a conversation about this module.</p>
            <p className="text-sm text-gray-400">
              The AI will guide you through the material. Complete {module.minimumExchanges} exchanges to finish.
            </p>
          </div>
        )}

        {chats.map((chat, index) => (
          <div key={chat.id || index} className="space-y-3">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-primary-600 text-white rounded-lg px-4 py-3">
                <p className="text-sm whitespace-pre-wrap">{chat.prompt}</p>
              </div>
            </div>
            {/* AI response */}
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-gray-100 rounded-lg px-4 py-3">
                <div className="text-sm text-gray-900 prose prose-sm max-w-none">
                  <ContentRenderer content={chat.response} />
                </div>
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animation-delay-200"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animation-delay-400"></div>
                </div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chats.length === 0
                ? "What would you like to explore about this topic?"
                : "Continue the conversation..."}
              rows={1}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!prompt.trim() || sending}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModuleChat;
