import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectApi, chatApi, reflectionApi, instructorNotesApi, attachmentApi, courseApi } from '../../services/firebaseApi';
import { aiApi, AI_TOOLS } from '../../services/aiApi';
import { MODEL_PRICING, formatCurrency } from '../../utils/costCalculator';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PaperAirplaneIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PaperClipIcon,
  DocumentIcon,
  InformationCircleIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import ChatMessage from './ChatMessage';
import ReflectionModal from './ReflectionModal';
import InstructorNotes from '../Instructor/InstructorNotes';
import AIModelsEducationModal from './AIModelsEducationModal';
import DocumentSelectionModal from './DocumentSelectionModal';
import { getSmartConversationHistory, getHistorySummary, isLongContextModel } from '../../utils/conversationHistory';

export default function Chat() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const messagesEndRef = useRef(null);

  const [project, setProject] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedTool, setSelectedTool] = useState('GPT-5 Mini');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Modal states
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showAIModelsModal, setShowAIModelsModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentChatForModal, setCurrentChatForModal] = useState(null);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [totalFeedbackCount, setTotalFeedbackCount] = useState(0);

  // Access control - check if user can send AI messages
  const isProjectOwner = project?.created_by === currentUser?.id;
  const isInstructor = userRole === 'instructor' || userRole === 'admin';
  // Students can send AI messages on their own projects (verified course enrollment happens in loadProjectAndChats)
  // Instructors can send AI messages on any project (they have broader access)
  const canSendAIMessages = isProjectOwner || isInstructor;
  
  // Debug logging for access control
  console.log('Chat Access Control Debug:', {
    currentUserId: currentUser?.id,
    projectCreatedBy: project?.created_by,
    isProjectOwner,
    isInstructor,
    userRole,
    canSendAIMessages
  });

  // Helper function to get model pricing info
  const getModelPricing = (modelName) => {
    const modelId = AI_TOOLS[modelName];
    const pricing = MODEL_PRICING[modelId];
    if (pricing) {
      return {
        input: pricing.input,
        output: pricing.output,
        displayName: pricing.displayName,
        isExpensive: pricing.input >= 10 || pricing.output >= 50 // Flag expensive models
      };
    }
    return null;
  };

  // Check if selected model is expensive
  const isExpensiveModel = () => {
    const pricing = getModelPricing(selectedTool);
    return pricing?.isExpensive || false;
  };

  useEffect(() => {
    // Scroll to top when first loading the page
    window.scrollTo(0, 0);
    loadProjectAndChats();
  }, [projectId, currentUser]);

  useEffect(() => {
    // Only scroll to bottom if there are existing messages and we're not loading
    if (chats.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [chats, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProjectAndChats = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Chat: Firebase user, loading data...');
      
      // Load project details
      const projectData = await projectApi.getProjectById(projectId);
      console.log('🔍 Chat: Loaded project data:', {
        projectId: projectData.id,
        courseId: projectData.course_id,
        createdBy: projectData.created_by,
        currentUserId: currentUser?.id
      });
      
      // If this project belongs to a course, verify the user is still enrolled and approved
      if (projectData.course_id) {
        console.log('🔍 Chat: Verifying course membership for courseId:', projectData.course_id);
        const userCourses = await courseApi.getUserCourses(currentUser.id);
        const isEnrolledAndApproved = userCourses.some(membership => 
          membership.courses.id === projectData.course_id && membership.status === 'approved'
        );
        
        if (!isEnrolledAndApproved) {
          console.log('❌ Chat: User not enrolled or approved for course:', projectData.course_id);
          toast.error('Access denied: You are no longer enrolled in this course');
          navigate(`/course/${projectData.course_id}/projects`);
          return;
        }
        
        console.log('✅ Chat: User verified for course access');
      }
      
      setProject(projectData);

      // Load project chats
      const projectChats = await chatApi.getProjectChats(projectId);
      setChats(projectChats);

    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project');
      // Navigate to dashboard as fallback since we don't have course info in error case
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };


  const handleDocumentSelect = async (document, source) => {
    if (source === 'upload') {
      // Handle new file upload
      const file = document;
      
      // Validate file type - accept multiple formats
      const allowedTypes = ['pdf', 'txt', 'csv', 'md', 'markdown', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'];
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      // More comprehensive file type checking
      const isValidType = 
        // Check by MIME type
        fileType === 'application/pdf' ||
        fileType === 'text/plain' ||
        fileType === 'text/csv' ||
        fileType === 'text/markdown' ||
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/vnd.ms-powerpoint' ||
        fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        fileType === 'application/vnd.ms-excel' ||
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        // Check by file extension as fallback
        allowedTypes.some(type => fileName.endsWith(`.${type}`));
      
      if (!isValidType) {
        console.log('File validation failed:', { fileType, fileName });
        toast.error('Supported formats: PDF, TXT, CSV, MD, DOC, DOCX, PPT, PPTX, XLS, XLSX. Your file type: ' + (fileType || 'unknown'));
        return;
      }
      
      console.log('File validation passed:', { fileType, fileName });
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      
      // File size warnings for large files
      if (file.size > 5 * 1024 * 1024) {
        toast('Large files may take longer to process and will be automatically summarized', {
          icon: '⚠️',
          duration: 4000,
        });
      } else if (file.size > 2 * 1024 * 1024) {
        toast('Medium-sized file detected - processing may take a moment', {
          icon: 'ℹ️',
          duration: 3000,
        });
      }
      
      toast.success(`File selected: ${file.name}`);
    } else if (source === 'personal' || source === 'course') {
      // Handle document from library
      // For library documents, we'll use the existing document data
      // Store it in a different format so we can handle it differently in handleSendMessage
      setSelectedFile({
        isLibraryDocument: true,
        source: source,
        documentId: document.id,
        fileName: document.file_name || document.fileName,
        extractedText: document.extracted_text || document.extractedText,
        downloadURL: document.downloadURL
      });
      
      toast.success(`Document selected from ${source === 'personal' ? 'your' : 'course'} library: ${document.file_name || document.fileName}`);
    }
    
    // Close the modal
    setShowDocumentModal(false);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!prompt.trim() && !selectedFile) || sending) return;

    // Using Firebase APIs

    const userPrompt = prompt.trim();
    let finalPrompt = userPrompt;
    
    // If there's a file but no text prompt, create a default prompt
    if (selectedFile && !userPrompt) {
      const fileName = selectedFile.isLibraryDocument ? selectedFile.fileName : selectedFile.name;
      finalPrompt = `I've uploaded a document "${fileName}". Please analyze its content and provide insights.`;
    }
    
    setPrompt('');
    setSending(true);

    try {
      // Get smart conversation history based on the selected model
      const userChats = chats.filter(chat => chat.user_id === currentUser.id);
      const recentChats = getSmartConversationHistory(
        userChats,
        selectedTool,
        finalPrompt,
        '' // We'll add PDF content later
      );
      
      // Log history summary for debugging
      const historySummary = getHistorySummary(userChats, selectedTool, finalPrompt, '');
      console.log('💬 Conversation Context:', {
        model: selectedTool,
        includingMessages: historySummary.messagesIncluded,
        totalMessages: historySummary.totalMessages,
        estimatedTokens: historySummary.estimatedTokens,
        contextWindow: historySummary.maxTokens
      });

      // Handle document attachment
      let pdfContent = '';
      let tempChatId = null;
      
      if (selectedFile) {
        if (selectedFile.isLibraryDocument) {
          // Document from library - just use the extracted text
          pdfContent = `\n\n[Document from ${selectedFile.source === 'personal' ? 'Personal' : 'Course'} Library: ${selectedFile.fileName}]\n${selectedFile.extractedText || '[No text content available]'}`;
        } else {
          // New file upload
          try {
            setUploading(true);
            // Create a temporary chat record to get an ID for the PDF upload
            const tempChatData = {
              user_id: currentUser.id,
              created_by: currentUser.id,
              project_id: projectId,
              tool_used: selectedTool,
              prompt: finalPrompt,
              response: 'Extracting text from document...', // Temporary response to satisfy NOT NULL constraint
              title: finalPrompt.length > 50 ? finalPrompt.substring(0, 50) + '...' : finalPrompt
            };
            
            const tempChat = await chatApi.createChat(tempChatData, project?.course_id);
            tempChatId = tempChat.id;
            
            const attachment = await attachmentApi.uploadPDFAttachment(
              selectedFile, 
              tempChat.id, 
              currentUser.id
            );
            
            pdfContent = `\n\n[Document Attachment: ${attachment.file_name}]\n${attachment.extracted_text}`;
            
            // Check if it was summarized (large file)
            if (attachment.extracted_text.includes('Large PDF Document Summary')) {
              toast.success('Large document uploaded and summarized successfully!');
            } else {
              toast.success('Document uploaded successfully!');
            }
          } catch (uploadError) {
            console.error('Document upload failed:', uploadError);
            toast.error('Document upload failed, but message will be sent without attachment');
          } finally {
            setUploading(false);
          }
        }
      }

      // Call AI API with the prompt and PDF content
      const aiPrompt = finalPrompt + pdfContent;
      const aiResponse = await aiApi.sendChatCompletion(
        aiPrompt, 
        selectedTool,
        recentChats
      );

      // Create or update the chat with the AI response
      let finalChat;
      if (tempChatId) {
        // Update the temporary chat with the real AI response
        finalChat = await chatApi.updateChat(tempChatId, {
          response: aiResponse // aiResponse is already the string content
        });
      } else {
        // Create a new chat without PDF
        const chatData = {
          user_id: currentUser.id,
          created_by: currentUser.id,
          project_id: projectId,
          tool_used: selectedTool,
          prompt: finalPrompt,
          response: aiResponse, // aiResponse is already the string content
          title: finalPrompt.length > 50 ? finalPrompt.substring(0, 50) + '...' : finalPrompt
        };
        
        finalChat = await chatApi.createChat(chatData, project?.course_id);
      }

      // Add to local state
      setChats(prev => [...prev, {
        ...finalChat,
        users: { name: currentUser.displayName || 'You', email: currentUser.email },
        chat_tags: [],
        reflections: []
      }]);

      // Clear selected file
      setSelectedFile(null);

      // Show success message
      toast.success('Message sent successfully!');

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      setPrompt(userPrompt); // Restore the prompt
    } finally {
      setSending(false);
    }
  };

  const handleReflectOnChat = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    setCurrentChatForModal(chat);
    setShowReflectionModal(true);
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
            onClick={() => navigate('/dashboard')}
            className="mt-2 text-primary-600 hover:text-primary-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header - Sticky so model selector is always visible */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => {
                if (project?.course_id) {
                  navigate(`/course/${project.course_id}/projects`);
                } else {
                  navigate('/dashboard');
                }
              }}
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
            {/* Temporary diagnostic button - REMOVE IN PRODUCTION */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={async () => {
                  console.log('Running reflection integrity check...');
                  try {
                    const result = await reflectionApi.checkReflectionIntegrity(projectId);
                    console.log('Integrity check complete:', result);
                    toast.success('Check console for reflection diagnostic results');
                    // Reload chats to see fixed reflections
                    loadProjectAndChats();
                  } catch (error) {
                    console.error('Integrity check failed:', error);
                    toast.error('Integrity check failed - see console');
                  }
                }}
                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                title="Check reflection integrity"
              >
                🔍 Check Reflections
              </button>
            )}

            <div className="flex items-center space-x-2">
              <div className="relative">
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
                {isExpensiveModel() && (
                  <div className="absolute -bottom-6 left-0 text-xs text-orange-600 whitespace-nowrap">
                    ⚠️ Research Model - Higher cost
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowAIModelsModal(true)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Learn about AI models"
              >
                <InformationCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Warning Banner for Expensive Models - Sticky */}
      {isExpensiveModel() && (
        <div className="sticky top-[73px] z-10 bg-orange-50 border-l-4 border-orange-400 p-4 mx-6 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Research Mode Active:</strong> You've selected {selectedTool}, which provides superior research and writing capabilities
                but costs 5x more than standard models. Use for complex research tasks and high-quality writing.
              </p>
              <div className="mt-1 text-xs text-orange-600">
                Cost: {formatCurrency(getModelPricing(selectedTool)?.input / 1000)}/{formatCurrency(getModelPricing(selectedTool)?.output / 1000)} per 1K tokens
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Indicator - Shows how much conversation history will be included - Sticky */}
      {chats.length > 0 && (
        <div className={`sticky ${isExpensiveModel() ? 'top-[185px]' : 'top-[73px]'} z-10 px-6 py-2 bg-gray-50 border-b border-gray-200 shadow-sm`}>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>
                Context: Including {(() => {
                  const userChats = chats.filter(chat => chat.user_id === currentUser.id);
                  const summary = getHistorySummary(userChats, selectedTool, '', '');
                  return summary.messagesIncluded;
                })()} of {chats.filter(chat => chat.user_id === currentUser.id).length} messages
              </span>
              {isLongContextModel(selectedTool) && (
                <span className="text-green-600 font-medium">(Extended context model)</span>
              )}
            </div>
            <div className="text-gray-500">
              Model: {selectedTool}
            </div>
          </div>
        </div>
      )}

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
              onReflectOnChat={handleReflectOnChat}
              currentUserId={currentUser.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input or Instructor Message */}
      <div className="bg-white border-t border-gray-200 p-6">
        {canSendAIMessages ? (
          <>
            {/* File Upload Indicator */}
            {selectedFile && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                      {selectedFile.isLibraryDocument ? (
                        <>
                          {selectedFile.fileName} 
                          <span className="text-xs ml-2 text-blue-600">
                            (from {selectedFile.source === 'personal' ? 'Personal' : 'Course'} Library)
                          </span>
                        </>
                      ) : (
                        <>
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={removeSelectedFile}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={selectedFile ? "Ask a question about your PDF (optional)..." : "Enter your AI prompt or question here to start a conversation..."}
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
              <div className="flex flex-col justify-end space-y-2">
                {/* Document Selection Button */}
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  title="Add Document"
                >
                  <PaperClipIcon className="h-4 w-4" />
                </button>
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!prompt.trim() && !selectedFile) || sending}
                  className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending || uploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {uploading ? 'Uploading...' : 'Sending...'}
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
              <span>Press Enter to send, Shift+Enter for new line • Upload PDF (OCR, 50 pages), Word, TXT, CSV, Markdown, PowerPoint, Excel • Max 10MB</span>
            </div>
          </>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Instructor View - Read Only
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  You're viewing this student's project as an instructor. You can see their AI conversations but cannot send AI messages. 
                  Use the instructor dashboard to leave notes for students.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Button - Fixed position */}
      {project && (isInstructor || isProjectOwner) && (
        <button
          onClick={() => setShowFeedbackPanel(!showFeedbackPanel)}
          className="fixed right-6 bottom-6 z-40 inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-full shadow-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 hover:scale-105"
        >
          <DocumentTextIcon className="h-5 w-5" />
          {totalFeedbackCount > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-6 w-6 text-xs font-bold leading-none text-white bg-primary-500 border-2 border-white rounded-full">
              {totalFeedbackCount}
            </span>
          )}
        </button>
      )}

      {/* Feedback Flyout Panel */}
      {project && (isInstructor || isProjectOwner) && (
        <div className={`fixed inset-y-0 right-0 z-50 w-96 transform transition-transform duration-300 ease-in-out ${
          showFeedbackPanel ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="h-full bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isProjectOwner && !isInstructor ? 'Instructor Feedback' : 'Project Feedback'}
                </h2>
                <button
                  onClick={() => setShowFeedbackPanel(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <InstructorNotes
                project={project}
                courseId={project.course_id}
                isInstructorView={isInstructor && !isProjectOwner}
                isStudentView={isProjectOwner && !isInstructor}
                onTotalCountChange={setTotalFeedbackCount}
              />
            </div>
          </div>
        </div>
      )}

      {/* Overlay when panel is open */}
      {showFeedbackPanel && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowFeedbackPanel(false)}
        />
      )}

      {/* Modals */}
      {showReflectionModal && currentChatForModal && (
        <ReflectionModal
          chat={currentChatForModal}
          onClose={() => setShowReflectionModal(false)}
          onReflectionUpdated={onReflectionUpdated}
        />
      )}

      {/* AI Models Education Modal */}
      <AIModelsEducationModal
        isOpen={showAIModelsModal}
        onClose={() => setShowAIModelsModal(false)}
      />

      {/* Document Selection Modal */}
      <DocumentSelectionModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSelectDocument={handleDocumentSelect}
        courseId={project?.course_id}
        userId={currentUser?.id}
        currentProjectId={projectId}
      />
    </div>
  );
} 