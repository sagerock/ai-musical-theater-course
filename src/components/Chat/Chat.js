import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectApi, chatApi, tagApi, reflectionApi } from '../../services/supabaseApi';
import { aiApi, AI_TOOLS } from '../../services/aiApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PaperAirplaneIcon,
  ArrowLeftIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import ChatMessage from './ChatMessage';
import TaggingModal from './TaggingModal';
import ReflectionModal from './ReflectionModal';

export default function Chat() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);

  const [project, setProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedTool, setSelectedTool] = useState('Claude Sonnet 4');
  const [availableTags, setAvailableTags] = useState([]);
  
  // Modal states
  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [currentChatForModal, setCurrentChatForModal] = useState(null);

  useEffect(() => {
    loadProjectAndChats();
    loadTags();
  }, [projectId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProjectAndChats = async () => {
    try {
      setLoading(true);
      
      // Load project details
      const projectData = await projectApi.getProjectById(projectId);
      setProject(projectData);

      // Load project chats
      const projectChats = await chatApi.getProjectChats(projectId);
      setChats(projectChats);

    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await tagApi.getAllTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim() || sending) return;

    const userPrompt = prompt.trim();
    setPrompt('');
    setSending(true);

    try {
      // Get conversation history for context (last 5 messages)
      const recentChats = chats
        .filter(chat => chat.user_id === currentUser.uid)
        .slice(-5);

      // Call AI API (automatically routes to correct provider)
      const aiResponse = await aiApi.sendChatCompletion(
        userPrompt, 
        selectedTool,
        recentChats
      );

      // Save chat to database
      const chatData = {
        user_id: currentUser.uid,
        project_id: projectId,
        tool_used: selectedTool,
        prompt: userPrompt,
        response: aiResponse.response
      };

      const newChat = await chatApi.createChat(chatData);

      // Add to local state
      setChats(prev => [...prev, {
        ...newChat,
        users: { name: currentUser.displayName || 'You', email: currentUser.email },
        chat_tags: [],
        reflections: []
      }]);

      // Show success message and offer tagging
      toast.success('Message sent successfully!');
      
      // Prompt for tagging after a brief delay
      setTimeout(() => {
        setCurrentChatForModal(newChat);
        setShowTaggingModal(true);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      setPrompt(userPrompt); // Restore the prompt
    } finally {
      setSending(false);
    }
  };

  const handleTagChat = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    setCurrentChatForModal(chat);
    setShowTaggingModal(true);
  };

  const handleReflectOnChat = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    setCurrentChatForModal(chat);
    setShowReflectionModal(true);
  };

  const onTagsUpdated = (chatId, newTags) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, chat_tags: newTags.map(tag => ({ tags: tag })) }
        : chat
    ));
  };

  const onReflectionUpdated = (chatId, reflection) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, reflections: reflection ? [reflection] : [] }
        : chat
    ));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-gray-900 font-medium">Project not found</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-2 text-primary-600 hover:text-primary-500"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/projects')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{project.title}</h1>
              <p className="text-sm text-gray-500">
                {project.description || 'AI Chat Interface'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-primary-500 focus:border-primary-500"
            >
              {Object.keys(AI_TOOLS).map(tool => (
                <option key={tool} value={tool}>{tool}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chats.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Start your conversation</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              Ask questions, get help with your work, or explore ideas with AI. Remember to reflect on how AI helps your learning process.
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <ChatMessage
              key={chat.id}
              chat={chat}
              onTagChat={handleTagChat}
              onReflectOnChat={handleReflectOnChat}
              currentUserId={currentUser.uid}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-6">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your message here..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-primary-500 focus:border-primary-500 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          <div className="flex flex-col justify-end">
            <button
              type="submit"
              disabled={!prompt.trim() || sending}
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                <div className="flex items-center">
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Send
                </div>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-3 flex items-center text-xs text-gray-500">
          <SparklesIcon className="h-4 w-4 mr-1" />
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>

      {/* Modals */}
      {showTaggingModal && currentChatForModal && (
        <TaggingModal
          chat={currentChatForModal}
          availableTags={availableTags}
          onClose={() => setShowTaggingModal(false)}
          onTagsUpdated={onTagsUpdated}
        />
      )}

      {showReflectionModal && currentChatForModal && (
        <ReflectionModal
          chat={currentChatForModal}
          onClose={() => setShowReflectionModal(false)}
          onReflectionUpdated={onReflectionUpdated}
        />
      )}
    </div>
  );
} 