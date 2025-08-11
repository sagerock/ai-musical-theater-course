import React, { useState, useEffect, useRef } from 'react';
import { aiApi, AI_TOOLS } from '../../services/aiApi';
import { chatApi } from '../../services/firebaseApi';
import { MODEL_PRICING, formatCurrency } from '../../utils/costCalculator';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import MarkdownRenderer from '../Chat/MarkdownRenderer';

export default function LibraryChatModal({ 
  isOpen, 
  onClose, 
  document, 
  currentUser, 
  courseId,
  projectId 
}) {
  const [chats, setChats] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [selectedTool, setSelectedTool] = useState('GPT-5 Mini');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && document) {
      // Start with an initial context message about the document
      const contextMessage = {
        id: 'context',
        user_id: 'system',
        prompt: `Document loaded: ${document.file_name}`,
        response: `I've loaded your document "${document.file_name}". This document contains ${document.extractedText ? document.extractedText.length : 0} characters of text. What would you like to know about it?`,
        tool_used: 'System',
        created_at: new Date(),
        users: { name: 'System' }
      };
      setChats([contextMessage]);
    }
  }, [isOpen, document]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getModelPricing = (modelName) => {
    const modelId = AI_TOOLS[modelName];
    const pricing = MODEL_PRICING[modelId];
    if (pricing) {
      return {
        input: pricing.input,
        output: pricing.output,
        displayName: pricing.displayName,
        isExpensive: pricing.input >= 10 || pricing.output >= 50
      };
    }
    return null;
  };

  const isExpensiveModel = () => {
    const pricing = getModelPricing(selectedTool);
    return pricing?.isExpensive || false;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim() || sending) return;

    const userPrompt = prompt.trim();
    setPrompt('');
    setSending(true);

    try {
      // Create context with the document content
      const documentContext = document.extractedText 
        ? `\nDocument Content:\n${document.extractedText}\n\nUser Question: ` 
        : '\n[Document text not available]\n\nUser Question: ';
      
      const fullPrompt = `Regarding the document "${document.file_name}":${documentContext}${userPrompt}`;

      // Get recent chat history for context (last 3 messages)
      const recentChats = chats
        .filter(chat => chat.id !== 'context')
        .slice(-3);

      // Call AI API
      const aiResponse = await aiApi.sendChatCompletion(
        fullPrompt,
        selectedTool,
        recentChats
      );

      // Create a chat record if we have a projectId
      let chatRecord = null;
      if (projectId) {
        const chatData = {
          user_id: currentUser.id,
          created_by: currentUser.id,
          project_id: projectId,
          tool_used: selectedTool,
          prompt: `[📚 Library Document: ${document.file_name}]\n\n${userPrompt}`,
          response: aiResponse.response,
          title: `Library Chat: ${document.file_name}`
        };
        
        chatRecord = await chatApi.createChat(chatData, courseId);
      }

      // Add to local state
      const newChat = {
        id: chatRecord?.id || Date.now(),
        user_id: currentUser.id,
        prompt: userPrompt,
        response: aiResponse.response,
        tool_used: selectedTool,
        created_at: new Date(),
        users: { name: currentUser.displayName || 'You', email: currentUser.email }
      };

      setChats(prev => [...prev, newChat]);
      toast.success('Message sent!');

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      setPrompt(userPrompt); // Restore the prompt
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chat with Document</h2>
              <p className="text-sm text-gray-500">{document?.file_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Model Selection */}
        <div className="px-4 py-2 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 mr-2">AI Model:</label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className={`text-sm border rounded-md px-3 py-1 focus:ring-primary-500 focus:border-primary-500 ${
                isExpensiveModel() 
                  ? 'border-orange-300 bg-orange-50' 
                  : 'border-gray-300 bg-white'
              }`}
            >
              {Object.keys(AI_TOOLS).map(tool => (
                <option key={tool} value={tool}>
                  {tool}
                </option>
              ))}
            </select>
          </div>
          {isExpensiveModel() && (
            <div className="mt-2 flex items-start">
              <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mt-0.5 mr-1" />
              <p className="text-xs text-orange-600">
                Research model - Higher cost ({formatCurrency(getModelPricing(selectedTool)?.input / 1000)}/{formatCurrency(getModelPricing(selectedTool)?.output / 1000)} per 1K tokens)
              </p>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chats.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Start your conversation</h3>
              <p className="mt-2 text-sm text-gray-500">
                Ask questions about this document
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div key={chat.id} className="space-y-2">
                {chat.prompt && (
                  <div className="flex justify-end">
                    <div className="bg-primary-100 text-primary-900 px-4 py-2 rounded-lg max-w-2xl">
                      <p className="text-sm">{chat.prompt}</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg max-w-2xl">
                    <div className="flex items-center mb-1">
                      <SparklesIcon className="h-4 w-4 text-primary-600 mr-1" />
                      <span className="text-xs text-gray-500">{chat.tool_used || chat.users?.name}</span>
                    </div>
                    <div className="text-sm">
                      <MarkdownRenderer>{chat.response}</MarkdownRenderer>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about this document..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || sending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}