import React, { useState } from 'react';
import {
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import HelpRequestModal from './HelpRequestModal';
import FlowiseChatbot from './FlowiseChatbot';

export default function Help() {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Help & Support</h1>
        <p className="text-lg text-gray-600">
          Welcome to AI Engagement Hub! Find answers to common questions or get in touch with our support team.
        </p>
      </div>

      {/* AI Help Assistant */}
      <FlowiseChatbot />

      {/* Contact Support */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center mb-4">
          <EnvelopeIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-blue-900">Need Help?</h2>
        </div>
        <p className="text-blue-800 mb-4">
          If you can't find the answer you're looking for in our FAQ below, please don't hesitate to reach out!
        </p>
        <button
          onClick={() => setShowHelpModal(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
        >
          <EnvelopeIcon className="h-4 w-4 mr-2" />
          Contact Support Team
        </button>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

        {/* Getting Started */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <LightBulbIcon className="h-5 w-5 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Getting Started</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How do I create my first project?</h4>
              <p className="text-gray-600">
                After logging in, go to your Dashboard and click "New Project" or navigate to the Projects page. 
                Give your project a title and description, then start chatting with AI tools to explore your ideas.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How do I join a course?</h4>
              <p className="text-gray-600">
                Your instructor will provide you with a course code or invite link. Click "Join Course" from your 
                dashboard or navigate to the join page and enter the course information provided by your instructor.
              </p>
            </div>
          </div>
        </div>

        {/* User Roles & Permissions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <UserGroupIcon className="h-5 w-5 text-yellow-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">User Roles & Permissions</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What are the different user roles?</h4>
              <p className="text-gray-600 mb-2">
                AI Engagement Hub supports 5 different roles, each with specific permissions:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li><strong>Student:</strong> Access course materials and AI tools, create projects and reflections</li>
                <li><strong>Student Assistant:</strong> Help manage course activities and assist other students</li>
                <li><strong>Teaching Assistant:</strong> Assist with grading and course management, view student work</li>
                <li><strong>Instructor:</strong> Full course management, student oversight, and administrative access</li>
                <li><strong>School Administrator:</strong> System-wide oversight and administrative access across all courses</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How do I get assigned a role?</h4>
              <p className="text-gray-600">
                When you join a course, you select your intended role during enrollment. Your request must be 
                approved by an instructor. Instructors and administrators can also change your role at any time 
                to match your responsibilities in the course.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can I have different roles in different courses?</h4>
              <p className="text-gray-600">
                Yes! Your role is specific to each course. You might be a student in one course, a teaching 
                assistant in another, and an instructor in a third. Each role gives you appropriate permissions 
                for that specific course context.
              </p>
            </div>
          </div>
        </div>

        {/* Using AI Tools */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Using AI Tools</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What AI models are available?</h4>
              <p className="text-gray-600">
                We offer 7 powerful AI models: GPT-4.1 Mini and GPT-4.1 (OpenAI), Claude Sonnet 4 and Claude Opus 4 (Anthropic), 
                Gemini Flash and Gemini 2.5 Pro (Google), and Sonar Pro (Perplexity for research). Each has unique strengths 
                for different types of conversations and tasks.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can I upload documents to share with AI?</h4>
              <p className="text-gray-600">
                Yes! You can upload PDF files in your chat conversations. Click the paperclip icon next to 
                the message input to attach a PDF. The AI will be able to reference and discuss your document.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How do I switch between different AI models?</h4>
              <p className="text-gray-600">
                In any chat conversation, use the dropdown menu above the message input to select different 
                AI models. You can switch models at any time during your conversation.
              </p>
            </div>
          </div>
        </div>

        {/* Course Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Course Management</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Why can't I see my project anymore?</h4>
              <p className="text-gray-600">
                If you were recently removed from a course, you won't be able to access projects from that course. 
                Your work is preserved, and access will be restored if you're re-enrolled. Contact your instructor 
                if you believe this was done in error.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can instructors see my AI conversations?</h4>
              <p className="text-gray-600">
                Yes, instructors can view AI interactions from students in their courses for educational oversight. 
                This helps them understand how you're using AI tools and provide better guidance. Your conversations 
                in other courses or personal projects remain private to those contexts.
              </p>
            </div>
          </div>
        </div>

        {/* Account & Technical */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Account & Technical Issues</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">I forgot my password. How do I reset it?</h4>
              <p className="text-gray-600">
                On the login page, click "Forgot your password?" and enter your email address. 
                You'll receive a password reset link via email. Check your spam folder if you don't see it.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">The platform isn't loading properly. What should I do?</h4>
              <p className="text-gray-600">
                Try refreshing your browser first. If that doesn't work, clear your browser cache and cookies 
                for this site, or try using a different browser. Make sure JavaScript is enabled in your browser settings.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Is my data secure?</h4>
              <p className="text-gray-600">
                Yes! We use enterprise-grade security measures to protect your data. All communications are encrypted, 
                and access is strictly controlled based on your course enrollments and permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Features & Tips */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <QuestionMarkCircleIcon className="h-5 w-5 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Tips & Best Practices</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How can I get better responses from AI?</h4>
              <p className="text-gray-600">
                Be specific and clear in your questions. Provide context about what you're trying to achieve. 
                Don't hesitate to ask follow-up questions or request clarification. Different AI models excel 
                at different tasks, so experiment with multiple models.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can I organize my conversations with tags?</h4>
              <p className="text-gray-600">
                Yes! Instructors and admins can create tags for organizing conversations by topic, assignment, 
                or any other category. Students can apply these tags to their conversations for better organization.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What's the reflection feature for?</h4>
              <p className="text-gray-600">
                Reflections help you think critically about your AI interactions. After important conversations, 
                you can add reflections to document what you learned, questions that arose, or how you might 
                apply the insights. This deepens your learning experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Contact */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center">
        <p className="text-gray-600 mb-4">
          Still have questions? We're here to help!
        </p>
        <button 
          onClick={() => setShowHelpModal(true)}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <EnvelopeIcon className="h-5 w-5 mr-2" />
          Contact Support
        </button>
      </div>
      
      {/* Help Request Modal */}
      {showHelpModal && (
        <HelpRequestModal onClose={() => setShowHelpModal(false)} />
      )}
    </div>
  );
}