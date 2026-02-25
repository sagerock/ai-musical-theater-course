import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CheckIcon, ChartBarIcon, HomeIcon, AcademicCapIcon, BookOpenIcon, SparklesIcon } from '@heroicons/react/24/outline';
import InfoRequestModal from '../Home/InfoRequestModal';

export default function Pricing() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const { currentUser } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      question: 'How does semester billing work?',
      answer: 'Students pay $49 once at the start of the semester. Access lasts the entire semester — no recurring charges, no surprise fees. Think of it like buying a textbook.'
    },
    {
      question: 'Can I use it across multiple courses?',
      answer: 'Yes! A single $49 semester pass works across every course you\'re enrolled in. One purchase, all your classes.'
    },
    {
      question: 'What happens when the semester ends?',
      answer: 'Your access expires at the end of the semester. You keep all your chat history and can export your data. To continue next semester, just purchase again.'
    },
    {
      question: 'Is it really free for educators?',
      answer: 'Yes — instructors, teaching assistants, and school administrators get full access at no cost. We believe the tool works best when educators can freely adopt it for their courses.'
    },
    {
      question: 'What about institutional licensing?',
      answer: 'We offer institutional agreements for schools that want to provide access to all students. Contact us for details on volume arrangements.'
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
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                >
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/philosophy"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Philosophy
                  </Link>
                  <Link
                    to="/faq"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    FAQ
                  </Link>
                  <Link
                    to="/privacy"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Privacy
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

      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Learn to use AI well — not to outsource your thinking
          </h1>
          <p className="mt-5 text-xl text-gray-600 max-w-2xl mx-auto">
            AI Engagement Hub gives students hands-on access to leading AI models with built-in analytics
            so educators can see how students actually learn with AI.
          </p>
          <p className="mt-3 text-lg text-primary-600 font-medium">
            Priced like a textbook. Buy once, use all semester in any class.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Student Plan */}
          <div className="relative rounded-2xl bg-white shadow-xl ring-2 ring-primary-500 p-8">
            <div className="absolute -top-4 left-0 right-0 mx-auto w-fit">
              <span className="bg-primary-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-2">
                <BookOpenIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Student</h2>
              </div>
              <p className="text-gray-600">Everything you need to use AI effectively in your courses</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="ml-2 text-lg text-gray-500">/semester</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">One-time payment — no recurring charges</p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Access to all AI models (GPT-5, Claude, Gemini, and more)',
                'Use across any and all of your courses',
                'Real-time analytics dashboard',
                'AI literacy education resources',
                'PDF upload capabilities',
                'Full conversation history and export',
                'Unlimited AI interactions'
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/join"
              className="block w-full py-3 px-6 text-center rounded-md font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700"
            >
              Get Started
            </Link>
          </div>

          {/* Educator Plan */}
          <div className="rounded-2xl bg-white shadow-lg p-8">
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <AcademicCapIcon className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Educator</h2>
              </div>
              <p className="text-gray-600">Full instructor and admin access at no cost</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">Free</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">Always free for educators</p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Create and manage courses',
                'Real-time student engagement analytics',
                'Track AI usage patterns across your class',
                'Student progress and activity monitoring',
                'Instructor notes and tagging system',
                'Announcement and discussion tools',
                'Export data for research'
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/login"
              className="block w-full py-3 px-6 text-center rounded-md font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              Sign Up Free
            </Link>
          </div>
        </div>

        {/* What's Included */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            What's included for students
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: SparklesIcon,
                title: 'Leading AI Models',
                description: 'GPT-5, GPT-4.1, Claude Opus & Sonnet, Gemini, Perplexity — all in one place with educational prompting built in.'
              },
              {
                icon: ChartBarIcon,
                title: 'Personal Analytics',
                description: 'See your own usage patterns, model preferences, and engagement trends over time.'
              },
              {
                icon: BookOpenIcon,
                title: 'AI Literacy Resources',
                description: 'Learn what each model is good at, how to write effective prompts, and how to evaluate AI output.'
              },
              {
                icon: AcademicCapIcon,
                title: 'Multi-Course Access',
                description: 'One semester pass works across every course that uses AI Engagement Hub. No per-class fees.'
              },
              {
                title: 'PDF Upload & Analysis',
                description: 'Upload documents and discuss them with any AI model. Great for papers, readings, and study materials.'
              },
              {
                title: 'Conversation History',
                description: 'All your chats are saved and searchable. Review past conversations and export your work anytime.'
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {item.icon && <item.icon className="h-6 w-6 text-primary-600 mb-3" />}
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center"
                >
                  <h4 className="font-medium text-gray-900">{faq.question}</h4>
                  <svg
                    className={`h-5 w-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to enhance your classroom with AI?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Students get started for $49/semester. Educators sign up free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/join"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Join a Course
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-primary-300 text-base font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100"
            >
              Educator Sign Up
            </Link>
            <button
              onClick={() => setShowInfoModal(true)}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Institutional Inquiries
            </button>
          </div>
        </div>
      </div>

      {/* Info Request Modal */}
      {showInfoModal && (
        <InfoRequestModal onClose={() => setShowInfoModal(false)} />
      )}
    </div>
  );
}
