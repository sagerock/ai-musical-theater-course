import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  PlayCircleIcon,
  RocketLaunchIcon,
  BookOpenIcon
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

      {/* Video Tutorials Banner */}
      <Link
        to="/tutorials"
        className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 mb-8 hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center">
          <PlayCircleIcon className="h-8 w-8 text-indigo-600 mr-4 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-indigo-900">Video Tutorials</h2>
            <p className="text-indigo-700 text-sm">Watch short, focused videos covering everything from account setup to advanced features.</p>
          </div>
        </div>
        <span className="text-indigo-600 font-medium text-sm group-hover:translate-x-1 transition-transform whitespace-nowrap ml-4">
          Browse Tutorials &rarr;
        </span>
      </Link>

      {/* How-To Guides */}
      <div className="space-y-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How-To Guides</h2>

        {/* Instructor: Getting Started */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <RocketLaunchIcon className="h-5 w-5 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Instructor: Register & Get Started</h3>
          </div>

          <div className="space-y-5">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Create your account</h4>
              <p className="text-gray-600">
                Go to the login page and click <strong>"Don't have an account? Sign up"</strong>.
                Enter your full name, email, and a password (6+ characters). After signing up you'll land on your Dashboard.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Get promoted to Instructor</h4>
              <p className="text-gray-600">
                All new accounts start with the <strong>Student</strong> role. To become an instructor, a platform
                <strong> Admin</strong> must promote your account to the Instructor role. Contact your institution's
                admin or reach out to our support team to request instructor access.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Create your first course</h4>
              <p className="text-gray-600">
                From the Instructor Dashboard, click <strong>"Create Course"</strong>. Fill in the course name,
                an optional description, semester, and year. A unique course code (e.g. <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">INTSP25042</code>) is
                generated automatically, and you're added as the instructor.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">4. Share your course code with students</h4>
              <p className="text-gray-600">
                Your course code is displayed on the Instructor Dashboard header. Share it with students — they'll
                enter it on the <strong>Join Course</strong> page. You can also add students directly from the
                <strong> Students</strong> tab by searching their email address.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">5. Approve student enrollments</h4>
              <p className="text-gray-600">
                When students join via the course code, their enrollment starts as <strong>pending</strong>.
                You'll receive an email notification for each request. Go to the <strong>Overview</strong> tab
                to see pending approvals and click <strong>Approve</strong> or <strong>Reject</strong> for
                each request. Students receive an email confirmation either way.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">6. Explore your Instructor Dashboard</h4>
              <p className="text-gray-600 mb-2">
                Once students are approved and start using AI, their activity appears in real time. Key tabs:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li><strong>Overview</strong> — course stats (total chats, projects, reflection rate) and pending approvals</li>
                <li><strong>Student Activity</strong> — filter and view AI interactions by student, date, or model</li>
                <li><strong>Students</strong> — manage enrollments, view per-student stats, change roles</li>
                <li><strong>Messaging</strong> — communicate with your students</li>
                <li><strong>Files</strong> — manage PDF attachments for the course</li>
                <li><strong>Course Settings</strong> — manage tags and configuration</li>
                <li><strong>Export Data</strong> — download course data as CSV</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Student: Getting Started */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BookOpenIcon className="h-5 w-5 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Student: Register & Get Started</h3>
          </div>

          <div className="space-y-5">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Create your account</h4>
              <p className="text-gray-600">
                Go to the login page and click <strong>"Don't have an account? Sign up"</strong>.
                Enter your name, email, and a password. You'll be taken to your Dashboard.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Join your course</h4>
              <p className="text-gray-600">
                Click <strong>"Join Course"</strong> from the sidebar or dashboard and enter the course code
                your instructor gave you. Your enrollment request will be sent to your instructor for approval.
                You'll receive an email once you've been approved.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Create a project</h4>
              <p className="text-gray-600">
                Once approved, go to your course and click <strong>"Projects"</strong>, then <strong>"New Project"</strong>.
                Give it a title and description. Projects are where all of your AI conversations live.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">4. Start chatting with AI</h4>
              <p className="text-gray-600">
                Open your project and type a message to start a conversation. Use the <strong>model selector</strong> dropdown
                to switch between AI models (GPT, Claude, Gemini, Perplexity). You can attach PDFs using the paperclip icon,
                and switch models mid-conversation.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">5. Tag and reflect</h4>
              <p className="text-gray-600">
                After a conversation, use <strong>tags</strong> to organize your chats by topic or assignment.
                Add <strong>reflections</strong> to document what you learned and how you plan to apply it.
                Both help you stay organized and show your instructor you're engaging thoughtfully with AI.
              </p>
            </div>
          </div>
        </div>
      </div>

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
              <p className="text-gray-600 mb-3">
                AI Engagement Hub has two types of roles: <strong>course roles</strong> (assigned per course) and <strong>global roles</strong> (system-wide).
              </p>

              <p className="text-sm font-medium text-gray-700 mb-2">Course Roles</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
                <li><strong>Student:</strong> Access AI tools, create projects, chat with AI models, write reflections, and apply tags to conversations.</li>
                <li><strong>Student Assistant:</strong> Everything a student can do, plus view peer projects within the course to support mentoring.</li>
                <li><strong>Teaching Assistant:</strong> Everything above, plus view student AI conversations, manage tags, approve or reject join requests, and access course analytics.</li>
                <li><strong>Instructor:</strong> Full course management including creating courses, viewing all student work and AI conversations, managing course members, and accessing detailed analytics. Instructors can promote members up to the Teaching Assistant level.</li>
              </ul>

              <p className="text-sm font-medium text-gray-700 mb-2">Global Roles</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>School Administrator:</strong> Oversight across all courses within their school. Can view multi-course analytics, approve join requests, and manage members for any course in their school. Cannot access courses at other schools or the global admin panel.</li>
                <li><strong>Admin:</strong> Full system-wide access. Can manage all users, courses, and schools. Can promote members to any role including Instructor and School Administrator. Can add users directly to any course.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">How do I get assigned a role?</h4>
              <p className="text-gray-600">
                Everyone joins a course as a <strong>Student</strong> by default. After your join request is approved,
                an instructor can promote you to Student Assistant or Teaching Assistant. Only a global Admin can
                promote members to Instructor or School Administrator.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can I have different roles in different courses?</h4>
              <p className="text-gray-600">
                Yes! Your role is specific to each course. You might be a student in one course, a teaching
                assistant in another, and an instructor in a third. Each role gives you appropriate permissions
                for that specific course.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Do instructors and school administrators need to pay?</h4>
              <p className="text-gray-600">
                No. If you are an instructor or teaching assistant in any course, or if you have the School Administrator
                or Admin global role, you can join additional courses without paying. Only students are required to
                pay the semester access fee (or use a promo code).
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can instructors see my AI conversations?</h4>
              <p className="text-gray-600">
                Yes. Instructors and teaching assistants in your course can view your AI conversations for educational
                oversight. However, student assistants and school administrators cannot read your chat sessions.
                Your conversations in other courses remain private to those courses.
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
                We offer 8 powerful AI models: GPT-5 Nano, GPT-5 Mini, and GPT-5 (OpenAI), Claude Sonnet 4 and Claude Opus 4 (Anthropic), 
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