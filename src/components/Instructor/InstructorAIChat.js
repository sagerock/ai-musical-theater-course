import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { aiApi } from '../../services/aiApi';
import MarkdownRenderer from '../Chat/MarkdownRenderer';
import toast from 'react-hot-toast';

export default function InstructorAIChat({ isOpen, onClose, dashboardData }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'ai',
        content: `👋 Hello! I'm your AI assistant for analyzing student data. I can help you understand:

• **Student Activity**: Who's most active, engagement patterns, tool preferences
• **Project Insights**: Popular projects, completion rates, collaboration patterns  
• **Learning Trends**: Common topics, reflection quality, progress tracking
• **Tag Analysis**: Most used tags, thematic patterns, categorization insights

You can ask me questions like:
- "Which students need more support?"
- "What are the most popular AI tools?"
- "Show me reflection completion rates by project"
- "What themes appear most in student tags?"

What would you like to know about your students?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  const generateDataContext = () => {
    const { chats, users, projects, tags, stats } = dashboardData;
    
    // Generate summary statistics
    const userStats = users.map(user => {
      const userChats = chats.filter(chat => chat.user_id === user.id);
      const userReflections = userChats.filter(chat => chat.reflections?.length > 0);
      const toolsUsed = [...new Set(userChats.map(chat => chat.tool_used))];
      
      return {
        name: user.name,
        email: user.email,
        chatCount: userChats.length,
        reflectionCount: userReflections.length,
        reflectionRate: userChats.length > 0 ? (userReflections.length / userChats.length * 100).toFixed(1) : 0,
        toolsUsed: toolsUsed,
        mostRecentActivity: userChats.length > 0 ? userChats[0].created_at : null
      };
    });

    const projectStats = projects.map(project => {
      const projectChats = chats.filter(chat => chat.project_id === project.id);
      const uniqueUsers = [...new Set(projectChats.map(chat => chat.user_id))];
      
      return {
        title: project.title,
        description: project.description,
        chatCount: projectChats.length,
        userCount: uniqueUsers.length,
        avgChatsPerUser: uniqueUsers.length > 0 ? (projectChats.length / uniqueUsers.length).toFixed(1) : 0
      };
    });

    const tagStats = tags.map(tag => {
      const tagUsage = chats.filter(chat => 
        chat.chat_tags?.some(ct => ct.tags.id === tag.id)
      ).length;
      
      return {
        name: tag.name,
        usageCount: tagUsage,
        description: tag.description
      };
    });

    const toolUsage = chats.reduce((acc, chat) => {
      acc[chat.tool_used] = (acc[chat.tool_used] || 0) + 1;
      return acc;
    }, {});

    return {
      overview: {
        totalChats: stats.totalChats,
        totalUsers: stats.totalUsers,
        totalProjects: stats.totalProjects,
        reflectionRate: stats.reflectionCompletionRate
      },
      students: userStats,
      projects: projectStats,
      tags: tagStats,
      toolUsage: toolUsage,
      recentActivity: chats.slice(0, 10).map(chat => ({
        student: chat.users?.name,
        project: chat.projects?.title,
        tool: chat.tool_used,
        hasReflection: chat.reflections?.length > 0,
        date: chat.created_at
      }))
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const dataContext = generateDataContext();
      
      const systemPrompt = `You are an AI assistant helping an instructor analyze student learning data. You have access to comprehensive data about students, their AI tool usage, projects, reflections, and tagging patterns.

Here's the current data context:
${JSON.stringify(dataContext, null, 2)}

Guidelines for your responses:
1. Be conversational and helpful
2. Provide specific insights based on the actual data
3. Suggest actionable recommendations for the instructor
4. Use formatting (markdown) to make data easy to read
5. Focus on educational insights and student success
6. Protect student privacy - use general patterns rather than calling out specific students negatively
7. If asked about specific students, provide constructive insights
8. Suggest follow-up questions the instructor might want to explore

The instructor has asked: "${inputMessage.trim()}"

Analyze the data and provide helpful insights.`;

      const aiResponse = await aiApi.sendChatCompletion(
        systemPrompt,
        'claude-sonnet-4-20250514', // Use a good model for analysis
        [] // No conversation history for now
      );

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error while analyzing the data. Please try your question again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Data Assistant</h2>
                <p className="text-sm text-gray-500">Ask questions about your students and projects</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.type === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <MarkdownRenderer>{message.content}</MarkdownRenderer>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Analyzing data...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about students, projects, or learning patterns..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}