import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  EyeIcon,
  TagIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon,
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const { currentUser } = useAuth();

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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI Engagement Hub
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              A powerful analytics platform that helps educators understand how students interact with AI in real time
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/projects"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
              >
                Get Started
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/instructor"
                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10"
              >
                For Instructors
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose AI Engagement Hub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Rather than generating content, AI Engagement Hub empowers teachers to observe, reflect, and respond to how students are learning with AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-md ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">{feature.name}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Benefits for Everyone
            </h2>
            <p className="text-xl text-gray-600">
              Supporting accountability, academic integrity, and deeper insight into the evolving relationship between students and artificial intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                <ul className="space-y-2 text-gray-600">
                  {benefit.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Start understanding how your students engage with AI—intelligently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/projects"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
            >
              Start Using AI Engagement Hub
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/join"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10"
            >
              Join a Course
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}