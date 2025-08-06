import React, { useState, useEffect } from 'react';
import { FullPageChat } from 'flowise-embed-react';
import { ChevronDownIcon, ChevronUpIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function FlowiseChatbot() {
  const [isExpanded, setIsExpanded] = useState(true);

  const chatflowId = "6736e8ec-32fb-4826-8448-1a77417b8e06";
  const apiHost = "https://flowise-qs18.onrender.com";

  // Custom styles to ensure proper scrolling
  const chatContainerStyle = {
    height: '500px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  };

  // Add custom CSS to ensure chat messages are scrollable
  useEffect(() => {
    if (isExpanded) {
      // Add custom styles to ensure proper scrolling in the Flowise chat
      const style = document.createElement('style');
      style.textContent = `
        /* Ensure the Flowise chat container is scrollable */
        .flowise-fullchatbot-container {
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Make the messages area scrollable */
        .flowise-fullchatbot-container .messages-container,
        .flowise-fullchatbot-container .chat-messages,
        .flowise-fullchatbot-container [class*="messages"] {
          overflow-y: auto !important;
          max-height: calc(100% - 120px) !important;
          flex: 1 !important;
        }
        
        /* Ensure message content doesn't overflow */
        .flowise-fullchatbot-container .message-content {
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
        }
        
        /* Fix for the chat window itself */
        #flowise-fullchatbot {
          height: 100% !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isExpanded]);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm mb-8">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100/50 transition-colors rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-blue-900">AI Help Assistant</h2>
            <p className="text-sm text-blue-700">Get instant answers to your questions</p>
          </div>
        </div>
        <button
          className="p-2 rounded-full hover:bg-blue-200 transition-colors"
          aria-label={isExpanded ? "Collapse chatbot" : "Expand chatbot"}
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-blue-600" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-blue-600" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0">
          <div className="bg-white rounded-lg shadow-inner overflow-auto" style={chatContainerStyle}>
            <FullPageChat
              chatflowid={chatflowId}
              apiHost={apiHost}
              theme={{    
                chatWindow: {
                  showTitle: true,
                  showAgentMessages: true,
                  title: 'AI Engagement Hub Helper',
                  titleAvatarSrc: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/google-messages.svg',
                  welcomeMessage: 'Hello! I know stuff about this tool. Maybe I can help you.',
                  errorMessage: 'Oops! Something went wrong. Please try again.',
                  backgroundColor: '#ffffff',
                  height: '100%',
                  width: '100%',
                  fontSize: 16,
                  overflowY: 'auto',
                  starterPrompts: [
                    "How do I get started with AI Engagement Hub as a Student?",
                    "What are projects and how do I use them?",
                    "How do I join a course?",
                    "What AI models are available?"
                  ],
                  starterPromptFontSize: 14,
                  clearChatOnReload: false,
                  sourceDocsTitle: 'Sources:',
                  renderHTML: true,
                  botMessage: {
                    backgroundColor: '#f7f8ff',
                    textColor: '#303235',
                    showAvatar: true,
                    avatarSrc: 'https://raw.githubusercontent.com/zahidkhawaja/langchain-chat-nextjs/main/public/parroticon.png'
                  },
                  userMessage: {
                    backgroundColor: '#3B81F6',
                    textColor: '#ffffff',
                    showAvatar: true,
                    avatarSrc: 'https://raw.githubusercontent.com/zahidkhawaja/langchain-chat-nextjs/main/public/usericon.png'
                  },
                  textInput: {
                    placeholder: 'Type your question...',
                    backgroundColor: '#ffffff',
                    textColor: '#303235',
                    sendButtonColor: '#3B81F6',
                    maxChars: 500,
                    maxCharsWarningMessage: 'You exceeded the character limit. Please keep your message under 500 characters.',
                    autoFocus: true,
                    sendMessageSound: false,
                    receiveMessageSound: false
                  },
                  feedback: {
                    color: '#303235'
                  },
                  dateTimeToggle: {
                    date: false,
                    time: false
                  },
                  footer: {
                    textColor: '#9CA3AF',
                    text: 'Powered by',
                    company: 'AI Engagement Hub',
                    companyLink: 'https://www.ai-engagement-hub.com/'
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}