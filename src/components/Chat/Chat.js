import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectApi, chatApi, tagApi, reflectionApi, instructorNotesApi, attachmentApi, courseApi } from '../../services/supabaseApi';
import { aiApi, AI_TOOLS } from '../../services/aiApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PaperAirplaneIcon,
  ArrowLeftIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PaperClipIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import ChatMessage from './ChatMessage';
import TaggingModal from './TaggingModal';
import ReflectionModal from './ReflectionModal';
import InstructorNotes from '../Instructor/InstructorNotes';

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
  const [selectedTool, setSelectedTool] = useState('Claude Sonnet 4');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Modal states
  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [currentChatForModal, setCurrentChatForModal] = useState(null);

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

  useEffect(() => {
    loadProjectAndChats();
  }, [projectId, currentUser]);

  // Load tags when project is loaded (to get course_id)
  useEffect(() => {
    if (project) {
      loadTags();
    }
  }, [project]);

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
          navigate('/projects');
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
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      // Get courseId from project if available
      const courseId = project?.course_id || null;
      const tags = await tagApi.getAllTags(courseId);
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type - accept multiple formats
      const allowedTypes = ['pdf', 'txt', 'docx', 'doc'];
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      const isValidType = allowedTypes.some(type => 
        fileType.includes(type) || fileName.endsWith(`.${type}`)
      );
      
      if (!isValidType) {
        toast.error('Supported formats: PDF, TXT, DOC, DOCX');
        return;
      }
      
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
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!prompt.trim() && !selectedFile) || sending) return;

    const userPrompt = prompt.trim();
    let finalPrompt = userPrompt;
    
    // If there's a file but no text prompt, create a default prompt
    if (selectedFile && !userPrompt) {
      finalPrompt = `I've uploaded a PDF file "${selectedFile.name}". Please analyze its content and provide insights.`;
    }
    
    setPrompt('');
    setSending(true);

    try {
      // Get conversation history for context (last 5 messages)
      const recentChats = chats
        .filter(chat => chat.user_id === currentUser.id)
        .slice(-5);

      // Upload PDF first if selected
      let pdfContent = '';
      let tempChatId = null;
      
      if (selectedFile) {
        try {
          setUploading(true);
          // Create a temporary chat record to get an ID for the PDF upload
          const tempChatData = {
            user_id: currentUser.id,
            created_by: currentUser.id,
            project_id: projectId,
            tool_used: selectedTool,
            prompt: finalPrompt,
            response: 'Processing PDF...', // Temporary response to satisfy NOT NULL constraint
            title: finalPrompt.length > 50 ? finalPrompt.substring(0, 50) + '...' : finalPrompt
          };
          
          const tempChat = await chatApi.createChat(tempChatData, project?.course_id);
          tempChatId = tempChat.id;
          
          const attachment = await attachmentApi.uploadPDFAttachment(
            selectedFile, 
            tempChat.id, 
            currentUser.id
          );
          
          pdfContent = `\n\n[PDF Attachment: ${attachment.file_name}]\n${attachment.extracted_text}`;
          
          // Check if it was summarized (large file)
          if (attachment.extracted_text.includes('Large PDF Document Summary')) {
            toast.success('Large PDF uploaded and summarized successfully!');
          } else {
            toast.success('PDF uploaded successfully!');
          }
        } catch (uploadError) {
          console.error('PDF upload failed:', uploadError);
          toast.error('PDF upload failed, but message will be sent without attachment');
        } finally {
          setUploading(false);
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
          response: aiResponse.response
        });
      } else {
        // Create a new chat without PDF
        const chatData = {
          user_id: currentUser.id,
          created_by: currentUser.id,
          project_id: projectId,
          tool_used: selectedTool,
          prompt: finalPrompt,
          response: aiResponse.response,
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

      // Show success message and offer tagging
      toast.success('Message sent successfully!');
      
      // Prompt for tagging after a brief delay
      setTimeout(() => {
        setCurrentChatForModal(finalChat);
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
              currentUserId={currentUser.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Instructor Notes Section - Compact */}
      {project && (
        <div className="px-6 py-2">
          <InstructorNotes 
            project={project} 
            courseId={project.course_id}
            isInstructorView={isInstructor && !isProjectOwner}
          />
        </div>
      )}

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
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
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
                  placeholder={selectedFile ? "Ask a question about your PDF (optional)..." : "Type your message here..."}
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
                {/* File Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    title="Upload PDF"
                  >
                    <PaperClipIcon className="h-4 w-4" />
                  </button>
                </div>
                
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
              <span>Press Enter to send, Shift+Enter for new line • Upload PDF, TXT, DOC, DOCX up to 10MB • Large files auto-summarized</span>
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

      {/* Modals */}
      {showTaggingModal && currentChatForModal && (
        <TaggingModal
          chat={currentChatForModal}
          availableTags={availableTags}
          onClose={() => setShowTaggingModal(false)}
          onTagsUpdated={onTagsUpdated}
          courseId={project?.course_id}
          userRole={userRole}
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