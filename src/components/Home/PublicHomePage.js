import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TrialCourseJoin from '../Course/TrialCourseJoin';
import Footer from '../Layout/Footer';
import {
  ChartBarIcon,
  EyeIcon,
  TagIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon,
  CogIcon,
  ArrowRightIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function PublicHomePage() {
  const [showTrialModal, setShowTrialModal] = useState(false);
  
  const features = [
    {
      name: 'Real-time AI Monitoring',
      description: 'Track student interactions with AI models as they happen, providing immediate insights into usage patterns.',
      icon: EyeIcon,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Multi-Model Support',
      description: 'Works with OpenAI, Anthropic, and Google AI models, giving you comprehensive visibility across platforms.',
      icon: CogIcon,
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Rich Analytics Dashboard',
      description: 'Visualize engagement patterns, model preferences, and usage trends through intuitive charts and reports.',
      icon: ChartBarIcon,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Academic Integrity Tools',
      description: 'Support responsible AI use with tagging, filtering, and monitoring capabilities that promote transparency.',
      icon: ShieldCheckIcon,
      color: 'bg-red-100 text-red-600'
    },
    {
      name: 'Course Management',
      description: 'Organize students into courses with instructor oversight and customizable learning environments.',
      icon: UserGroupIcon,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      name: 'Reflection & Learning',
      description: 'Enable structured reflection on AI interactions to deepen understanding and improve learning outcomes.',
      icon: AcademicCapIcon,
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  const benefits = [
    {
      title: 'For Educators',
      points: [
        'Understand how students are using AI tools',
        'Monitor prompt quality and learning progression',
        'Identify students who need additional support',
        'Maintain academic integrity standards'
      ]
    },
    {
      title: 'For Students',
      points: [
        'Develop better AI interaction skills',
        'Reflect on learning processes',
        'Access multiple AI models in one place',
        'Build responsible AI usage habits'
      ]
    },
    {
      title: 'For Institutions',
      points: [
        'Scalable across departments and courses',
        'Data-driven insights for curriculum development',
        'Support for AI literacy initiatives',
        'Transparent AI usage policies'
      ]
    }
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">AI Engagement Hub</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <button
                onClick={() => setShowTrialModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Try Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI Engagement Hub
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto">
              A powerful analytics platform that helps educators understand how students interact with AI in real time
            </p>
            <p className="text-lg mb-10 max-w-2xl mx-auto opacity-90">
              Designed for classrooms at any level—from high school to higher ed—providing a smarter lens on AI usage with clear visibility into prompt activity, model selection, and engagement patterns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowTrialModal(true)}
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
              >
                Try Demo Course
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
              <Link
                to="/join"
                className="inline-flex items-center px-8 py-4 border border-white text-lg font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10"
              >
                Join a Course
              </Link>
            </div>
          </div>
        </div>
      </div>


      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Choose AI Engagement Hub?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Rather than generating content, AI Engagement Hub empowers teachers to observe, reflect, and respond to how students are learning with AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">{feature.name}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Benefits for Everyone
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Supporting accountability, academic integrity, and deeper insight into the evolving relationship between students and artificial intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">{benefit.title}</h3>
                <ul className="space-y-4">
                  {benefit.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start text-left">
                      <CheckCircleIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <span className="text-gray-600">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-light mb-8">
            Understanding how students engage with AI—intelligently.
          </h2>
          <p className="text-lg text-gray-300 mb-12">
            Transform your classroom with data-driven insights into AI usage patterns, 
            student engagement, and learning outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowTrialModal(true)}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
            >
              Try Demo Course
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
            <Link
              to="/join"
              className="inline-flex items-center px-8 py-4 border border-white text-lg font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10"
            >
              Join Existing Course
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold text-gray-900">AI Engagement Hub</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <button
                onClick={() => setShowTrialModal(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                Try Demo
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>© 2025 AI Engagement Hub. Built for educators and students exploring AI-enhanced learning.</p>
          </div>
        </div>
      </footer>
      
      {/* Privacy Footer */}
      <Footer />
      
      {/* Trial Course Join Modal */}
      {showTrialModal && (
        <TrialCourseJoin onClose={() => setShowTrialModal(false)} />
      )}
    </div>
  );
}