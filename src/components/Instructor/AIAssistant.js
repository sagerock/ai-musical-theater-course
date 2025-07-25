import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { aiApi } from '../../services/aiApi';
import { chatApi, projectApi, userApi, attachmentApi } from '../../services/firebaseApi';
import MarkdownRenderer from '../Chat/MarkdownRenderer';
import toast from 'react-hot-toast';

export default function AIAssistant({ selectedCourseId, selectedCourse, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load comprehensive student analytics data
  const loadStudentAnalytics = async () => {
    if (!selectedCourseId) return null;
    
    try {
      setDataLoading(true);
      
      // Get all students in the course
      const courseMembers = await userApi.getAllUsers(selectedCourseId);
      const students = courseMembers.filter(user => {
        const membershipRole = user.course_role || 
                               user.course_memberships?.[0]?.role || 
                               user.course_memberships?.role || 
                               user.role;
        return membershipRole === 'student';
      });

      // Get all chats for the course
      const allChats = await chatApi.getChatsWithFilters({
        courseId: selectedCourseId,
        limit: 1000
      });

      // Get all projects for the course
      const allProjects = await Promise.all(
        students.map(student => projectApi.getUserProjects(student.id, selectedCourseId))
      );
      const flatProjects = allProjects.flat();

      // Get PDF attachments
      const attachments = await attachmentApi.getCourseAttachments(selectedCourseId, currentUser.id);

      // Analyze the data
      const analytics = {
        courseInfo: {
          name: selectedCourse.courses?.name,
          code: selectedCourse.courses?.course_code,
          totalStudents: students.length,
          totalInteractions: allChats.length,
          totalProjects: flatProjects.length,
          totalAttachments: attachments.length
        },
        students: students.map(student => {
          const studentChats = allChats.filter(chat => chat.user_id === student.id);
          const studentProjects = flatProjects.filter(project => project.created_by === student.id);
          const studentAttachments = attachments.filter(att => 
            att.chats && att.chats.users && att.chats.users.id === student.id
          );
          
          return {
            id: student.id,
            name: student.name,
            email: student.email,
            interactions: studentChats.length,
            projects: studentProjects.length,
            attachments: studentAttachments.length,
            lastActivity: studentChats.length > 0 
              ? new Date(Math.max(...studentChats.map(chat => new Date(chat.created_at).getTime())))
              : new Date(student.created_at),
            mostUsedTools: [...new Set(studentChats.map(chat => chat.tool_used))].slice(0, 3),
            projectTitles: studentProjects.map(p => p.title),
            reflectionRate: studentProjects.length > 0 
              ? (studentProjects.filter(p => p.reflections && p.reflections.length > 0).length / studentProjects.length * 100).toFixed(1)
              : 0
          };
        }),
        tools: [...new Set(allChats.map(chat => chat.tool_used))].reduce((acc, tool) => {
          acc[tool] = allChats.filter(chat => chat.tool_used === tool).length;
          return acc;
        }, {}),
        recentActivity: allChats
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 20)
          .map(chat => ({
            studentName: chat.users?.name || 'Unknown',
            tool: chat.tool_used,
            date: chat.created_at,
            project: chat.projects?.title || 'Unknown Project'
          })),
        tagAnalysis: allChats.reduce((tags, chat) => {
          if (chat.chat_tags) {
            chat.chat_tags.forEach(chatTag => {
              if (chatTag.tags) {
                const tagName = chatTag.tags.name;
                tags[tagName] = (tags[tagName] || 0) + 1;
              }
            });
          }
          return tags;
        }, {}),
        engagementPatterns: {
          mostActiveStudents: students
            .map(s => ({
              name: s.name,
              interactions: allChats.filter(chat => chat.user_id === s.id).length
            }))
            .sort((a, b) => b.interactions - a.interactions)
            .slice(0, 5),
          leastActiveStudents: students
            .map(s => ({
              name: s.name,
              interactions: allChats.filter(chat => chat.user_id === s.id).length
            }))
            .sort((a, b) => a.interactions - b.interactions)
            .slice(0, 5)
        }
      };

      return analytics;
    } catch (error) {
      console.error('Error loading student analytics:', error);
      return null;
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load student data when course changes
  useEffect(() => {
    if (selectedCourseId && selectedCourse) {
      loadStudentAnalytics().then(data => {
        setStudentData(data);
      });
    }
  }, [selectedCourseId, selectedCourse]);

  // Initialize with welcome message
  useEffect(() => {
    if (selectedCourse && messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'ai',
        content: `👋 Hello! I'm your AI assistant for analyzing student data in **${selectedCourse.courses?.name}**.

I can help you understand:

• **Student Activity**: Who's most active, engagement patterns, tool preferences
• **Project Insights**: Popular projects, completion rates, collaboration patterns  
• **Learning Trends**: Common topics, reflection quality, progress tracking
• **Tag Analysis**: Most used tags, thematic patterns, categorization insights

You can ask me questions like:
- "Which students need more support?"
- "What are the most popular AI tools?"
- "Show me reflection completion rates by project"
- "What themes appear most in student tags?"
- "Analyze student engagement patterns"

What would you like to know about your students?`,
        timestamp: new Date()
      }]);
    }
  }, [selectedCourse, messages.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create comprehensive context with real student data
      let courseContext = `You are an AI assistant helping an instructor analyze REAL student data for the course "${selectedCourse.courses?.name}". 
      
Course Information:
- Course: ${selectedCourse.courses?.name}
- Code: ${selectedCourse.courses?.course_code}
- Semester: ${selectedCourse.courses?.semester} ${selectedCourse.courses?.year}
- Description: ${selectedCourse.courses?.description || 'No description available'}

REAL STUDENT ANALYTICS DATA:`;

      if (studentData) {
        courseContext += `

COURSE METRICS:
- Total Students: ${studentData.courseInfo.totalStudents}
- Total AI Interactions: ${studentData.courseInfo.totalInteractions}
- Total Projects: ${studentData.courseInfo.totalProjects}
- Total File Attachments: ${studentData.courseInfo.totalAttachments}

STUDENT PERFORMANCE DATA:
${studentData.students.map(student => `
• ${student.name}:
  - AI Interactions: ${student.interactions}
  - Projects Created: ${student.projects}
  - Files Uploaded: ${student.attachments}
  - Last Activity: ${student.lastActivity.toLocaleDateString()}
  - Preferred AI Tools: ${student.mostUsedTools.join(', ') || 'None yet'}
  - Project Titles: ${student.projectTitles.join(', ') || 'None yet'}
  - Reflection Completion Rate: ${student.reflectionRate}%`).join('')}

AI TOOL USAGE STATISTICS:
${Object.entries(studentData.tools).map(([tool, count]) => `- ${tool}: ${count} uses`).join('\n')}

RECENT ACTIVITY (Last 20 interactions):
${studentData.recentActivity.map(activity => `- ${activity.studentName} used ${activity.tool} in "${activity.project}" on ${new Date(activity.date).toLocaleDateString()}`).join('\n')}

TAG ANALYSIS:
${Object.entries(studentData.tagAnalysis).map(([tag, count]) => `- "${tag}": used ${count} times`).join('\n')}

ENGAGEMENT PATTERNS:
Most Active Students:
${studentData.engagementPatterns.mostActiveStudents.map(s => `- ${s.name}: ${s.interactions} interactions`).join('\n')}

Least Active Students (may need support):
${studentData.engagementPatterns.leastActiveStudents.map(s => `- ${s.name}: ${s.interactions} interactions`).join('\n')}
`;
      } else {
        courseContext += `
[Loading student data... Please ask general questions about course analytics while data loads.]`;
      }

      courseContext += `

Please analyze this REAL data to provide specific, actionable insights about student engagement, learning patterns, and areas for improvement. Reference specific students, metrics, and patterns when possible.`;

      const response = await aiApi.sendChatCompletion(
        `${courseContext}\n\nInstructor Question: ${inputMessage}`,
        'GPT-4o' // Using GPT-4o as the default model for instructor assistance
      );

      console.log('AI Response received:', response);
      console.log('AI Response type:', typeof response);
      
      // Handle different response formats
      const responseContent = typeof response === 'string' ? response : response?.response || response?.message || response?.content || 'No response received';

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: responseContent,
        timestamp: new Date()
      };

      console.log('AI Message to add:', aiMessage);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    // Re-initialize with welcome message
    setTimeout(() => {
      setMessages([{
        id: 1,
        type: 'ai',
        content: `👋 Hello! I'm your AI assistant for analyzing student data in **${selectedCourse.courses?.name}**.

I can help you understand:

• **Student Activity**: Who's most active, engagement patterns, tool preferences
• **Project Insights**: Popular projects, completion rates, collaboration patterns  
• **Learning Trends**: Common topics, reflection quality, progress tracking
• **Tag Analysis**: Most used tags, thematic patterns, categorization insights

What would you like to know about your students?`,
        timestamp: new Date()
      }]);
    }, 100);
  };

  if (!selectedCourse) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Course Selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a course to use the AI Assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2 text-blue-600" />
            AI Assistant
          </h2>
          <p className="text-sm text-gray-600">
            Get insights about student engagement and learning patterns in {selectedCourse.courses?.name}
          </p>
          {dataLoading && (
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <SparklesIcon className="h-3 w-3 mr-1 animate-pulse" />
              Loading student analytics data...
            </p>
          )}
          {studentData && (
            <p className="text-xs text-green-600 flex items-center mt-1">
              ✅ Analyzing {studentData.courseInfo.totalStudents} students, {studentData.courseInfo.totalInteractions} interactions
            </p>
          )}
        </div>
        <button
          onClick={clearChat}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Clear Chat
        </button>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.type === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div className="text-sm">
                      <MarkdownRenderer>{message.content}</MarkdownRenderer>
                    </div>
                  )}
                </div>
              </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about student engagement, learning patterns, or course analytics..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Analysis Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Which students are most active in AI interactions?",
            "What are the most popular AI tools in this course?",
            "Show me reflection completion rates by project",
            "What themes appear most in student interactions?",
            "Which projects generate the most engagement?",
            "Analyze student progress patterns over time"
          ].map((question, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(question)}
              className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm text-gray-900">{question}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}