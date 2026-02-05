import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDownIcon, ChevronUpIcon, ChartBarIcon, HomeIcon } from '@heroicons/react/24/outline';
import InfoRequestModal from '../Home/InfoRequestModal';

export default function FAQ() {
  const [openSections, setOpenSections] = useState({});
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { currentUser } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const faqSections = [
    {
      id: 'general',
      title: 'General Questions',
      questions: [
        {
          question: 'What is AI Engagement Hub?',
          answer: 'AI Engagement Hub is a comprehensive AI literacy education platform that combines real-time student engagement analytics with advanced AI learning resources. Beyond helping educators monitor student AI interactions, we provide comprehensive AI literacy education through curated model selection, specialized educational prompting, citation enhancement, and in-depth learning guides that teach students when and how to use different AI models effectively.'
        },
        {
          question: 'Who is this platform designed for?',
          answer: 'AI Engagement Hub is designed for educators at any level—from high school to higher education—who want to understand and guide how their students use AI tools. It\'s perfect for instructors who want to promote responsible AI use while gaining insights into student learning patterns.'
        },
        {
          question: 'How is this different from just using ChatGPT or Claude directly?',
          answer: 'AI Engagement Hub goes far beyond simple AI access. We provide comprehensive AI literacy education with 8 specially optimized models, built-in learning resources, model comparison guides, prompt engineering education, and enhanced citation capabilities. Students learn not just how to use AI, but when to use which model and why. Plus, educators get valuable oversight and analytics to guide student development—creating a complete educational ecosystem rather than just AI access.'
        }
      ]
    },
    {
      id: 'features',
      title: 'Features & Capabilities',
      questions: [
        {
          question: 'What AI models are available?',
          answer: 'We offer 8 carefully curated AI models optimized for educational use: GPT-5 Nano (ultra-fast), GPT-5 Mini (balanced default), and GPT-5 (premium coding & reasoning) from OpenAI, Claude Sonnet 4 (analytical excellence) and Claude Opus 4 (premium research) from Anthropic, Gemini Flash (efficient responses) and Gemini 2.5 Pro (superior citations with LearnLM educational training) from Google, and Sonar Pro (Perplexity) for real-time research with live citations. Each model receives specialized educational prompting to enhance learning outcomes.'
        },
        {
          question: 'Can students upload documents?',
          answer: 'Yes! Students can upload PDF files directly in their chat conversations. The AI models can read, analyze, and discuss the content of these documents, making it perfect for research papers, course materials, or any educational content.'
        },
        {
          question: 'How does the analytics dashboard work?',
          answer: 'The analytics dashboard provides real-time insights into student AI usage. Instructors can see interaction counts, model preferences, engagement patterns over time, project progress, and tag-based categorization. All analytics respect student privacy while providing educational oversight.'
        },
        {
          question: 'What is the reflection feature?',
          answer: 'Reflections allow students to add thoughtful commentary to their AI interactions. After important conversations, students can document what they learned, questions that arose, or how they plan to apply insights. This promotes critical thinking about AI use.'
        }
      ]
    },
    {
      id: 'ai-literacy',
      title: 'AI Literacy & Learning',
      questions: [
        {
          question: 'How does the platform teach AI literacy?',
          answer: 'AI Engagement Hub provides comprehensive AI literacy education through multiple approaches: curated model selection with educational optimization, built-in learning guides accessible via the info icon next to the model selector, specialized prompting that enhances each model\'s educational capabilities, citation enhancement systems, and prompt engineering education. Students learn not just to use AI tools, but to understand their strengths, limitations, and appropriate applications.'
        },
        {
          question: 'What is the "Understanding AI Models" guide?',
          answer: 'The Understanding AI Models guide is a comprehensive educational resource accessible by clicking the "ℹ️" icon next to the model selector. It features detailed model comparisons, token economics, citations & research techniques, AI optimization insights showing how we enhance each model, company profiles, and best practices for model selection and prompt engineering. This guide helps students develop crucial AI literacy skills.'
        },
        {
          question: 'How do different models help with different learning tasks?',
          answer: 'Each AI model excels at different educational tasks: Gemini 2.5 Pro provides superior citations for research papers, Claude Sonnet 4 excels at analytical thinking and breaking down complex concepts, Claude Opus 4 offers premium research assistance, GPT-5 Nano delivers ultra-fast summarization, GPT-5 Mini provides balanced cost-effective learning, GPT-5 excels at complex coding and reasoning tasks, Gemini Flash delivers quick efficient responses, and Sonar Pro provides real-time information with live citations. Our platform teaches students when to use each model for optimal learning outcomes.'
        },
        {
          question: 'What makes this educational vs. just using AI tools directly?',
          answer: 'Our educational approach includes: specialized prompting that enhances each model for learning (not just raw AI access), comprehensive learning resources and guides, model-specific educational optimization, enhanced citation requirements for academic integrity, prompt engineering education, critical thinking development, and structured reflection tools. We\'re teaching students how to be intelligent AI users, not just AI consumers.'
        },
        {
          question: 'How do students learn to choose the right AI model?',
          answer: 'Students learn model selection through our comprehensive educational approach: the Understanding AI Models guide provides detailed comparisons and use cases, each model interaction includes educational context about why that model excels at the task, we provide workflow recommendations for different types of academic work, and students can explore model differences through hands-on experience with guided learning resources. This develops critical thinking about AI tool selection.'
        },
        {
          question: 'What is model-specific optimization and why does it matter?',
          answer: 'Model-specific optimization means each AI model receives specialized educational prompting that leverages its unique strengths. For example, Gemini 2.5 Pro gets enhanced citation prompts, Claude models get analytical excellence prompts, and Sonar Pro gets current research prompts. This ensures students get the best possible educational experience from each model while learning about AI capabilities and differences—skills they\'ll use throughout their academic and professional careers.'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      questions: [
        {
          question: 'Is my data used to train AI models?',
          answer: 'No! We use enterprise-tier API access for all AI providers, which means your data is never used to train or improve AI models. Your educational content, student interactions, and prompts remain completely private.'
        },
        {
          question: 'How is student data protected?',
          answer: 'We use Firebase\'s enterprise-grade security infrastructure with encrypted data transmission, secure authentication, role-based access control, and strict data isolation between courses. We\'re FERPA-compliant and follow educational privacy best practices.'
        },
        {
          question: 'Can instructors see all student conversations?',
          answer: 'Instructors can only view AI interactions from students enrolled in their courses. This educational oversight helps guide students and ensure academic integrity. Students\' personal projects or work in other courses remain private to those contexts.'
        },
        {
          question: 'How long is data retained?',
          answer: 'Your data on our platform is retained as long as your account is active. The AI providers we use typically retain API data for 30 days or less (some have zero-day retention). You can export or delete your data at any time.'
        }
      ]
    },
    {
      id: 'courses',
      title: 'Courses & Enrollment',
      questions: [
        {
          question: 'How do I join a course?',
          answer: 'Your instructor will provide you with a course code. Simply click "Join Course" from your dashboard or go to the join page, enter the code, and you\'ll be enrolled pending instructor approval.'
        },
        {
          question: 'What happens if I\'m removed from a course?',
          answer: 'If you\'re removed from a course, you lose access to projects created within that course context. However, your work is preserved and will be restored if you\'re re-enrolled. Personal projects outside the course remain unaffected.'
        },
        {
          question: 'Can I be in multiple courses simultaneously?',
          answer: 'Absolutely! You can be enrolled in multiple courses at once. The platform keeps each course\'s work separate, and you can easily switch between course contexts from your dashboard.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical & Account',
      questions: [
        {
          question: 'What browsers are supported?',
          answer: 'AI Engagement Hub works best on modern browsers including Chrome, Firefox, Safari, and Edge. Make sure JavaScript is enabled and you\'re using the latest version of your browser for the best experience.'
        },
        {
          question: 'How do I reset my password?',
          answer: 'Click "Forgot your password?" on the login page and enter your email address. You\'ll receive a password reset link via email. Check your spam folder if you don\'t see it within a few minutes.'
        },
        {
          question: 'Can I export my data?',
          answer: 'Yes! You can export your chat conversations, projects, and reflections at any time. We provide exports in standard formats (JSON, CSV) that you can use for your own analysis or record-keeping.'
        },
        {
          question: 'Is there a mobile app?',
          answer: 'Currently, AI Engagement Hub is a web-based platform optimized for desktop use. While it works on mobile browsers, we recommend using a computer for the best experience, especially for longer AI conversations and document uploads.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to={currentUser ? "/dashboard" : "/"} className="flex items-center">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="ml-3 text-lg font-bold text-gray-900">AI Engagement Hub</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                // Logged-in user navigation
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                >
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              ) : (
                // Anonymous user navigation
                <>
                  <Link
                    to="/philosophy"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Philosophy
                  </Link>
                  <Link
                    to="/privacy"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Privacy
                  </Link>
                  <Link
                    to="/pricing"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/join"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Join Course
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to know about AI Engagement Hub
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {faqSections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                {openSections[section.id] ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {openSections[section.id] && (
                <div className="px-6 pb-6 space-y-6">
                  {section.questions.map((qa, index) => (
                    <div key={index} className="border-t border-gray-100 pt-6 first:border-0 first:pt-0">
                      <h3 className="font-medium text-gray-900 mb-2">{qa.question}</h3>
                      <p className="text-gray-600 leading-relaxed">{qa.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-blue-800 mb-6">
            We're here to help! Reach out to our support team for personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowInfoModal(true)}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Contact Support
            </button>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
      
      {/* Info Request Modal */}
      {showInfoModal && (
        <InfoRequestModal onClose={() => setShowInfoModal(false)} />
      )}
    </div>
  );
}