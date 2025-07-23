import React from 'react';
import { ShieldCheckIcon, LockClosedIcon, EyeSlashIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const PrivacyHighlight = () => {
  const privacyFeatures = [
    {
      icon: <LockClosedIcon className="h-8 w-8 text-blue-600" />,
      title: "Student Data Isolation",
      description: "Students can only access their own AI interactions, documents, and personal information. Complete privacy between students guaranteed."
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8 text-green-600" />,
      title: "Database-Level Security",
      description: "19 active Row Level Security policies enforce privacy at the database level - protection that cannot be bypassed by application bugs."
    },
    {
      icon: <EyeSlashIcon className="h-8 w-8 text-purple-600" />,
      title: "Course-Based Access",
      description: "Instructors see only data from their enrolled students. Complete isolation between different courses and instructors."
    },
    {
      icon: <AcademicCapIcon className="h-8 w-8 text-indigo-600" />,
      title: "FERPA Compliant",
      description: "Built specifically for educational institutions with enterprise-grade privacy protection and comprehensive audit logging."
    }
  ];

  const protectionStats = [
    { number: "19", label: "Active Privacy Policies" },
    { number: "7", label: "Protected Database Tables" },
    { number: "53+", label: "AI Interactions Secured" },
    { number: "100%", label: "Student Data Isolation" }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <ShieldCheckIcon className="h-12 w-12 text-blue-600 mr-3" />
            <h2 className="text-4xl font-bold text-gray-900">
              Enterprise-Grade Privacy Protection
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built specifically for educational institutions with student privacy as our highest priority. 
            Your students' AI interactions and personal data are completely secure.
          </p>
        </div>

        {/* Privacy Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {privacyFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                {feature.icon}
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Protection Statistics */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Current Privacy Protection Status
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {protectionStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Guarantees */}
        <div className="mt-12 bg-white rounded-lg p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Our Privacy Guarantees for Schools
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-green-600 mb-3 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                What We Protect
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  All AI conversations and interactions
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Student uploaded documents and PDFs
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Personal information and account data
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Academic projects and coursework
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Student reflections and self-assessments
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-blue-600 mb-3 flex items-center">
                <LockClosedIcon className="h-5 w-5 mr-2" />
                How We Protect It
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">⚡</span>
                  Database-level Row Level Security policies
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">⚡</span>
                  Automatic privacy enforcement
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">⚡</span>
                  Cross-student data isolation
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">⚡</span>
                  Course-based instructor access only
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">⚡</span>
                  Complete audit trails for compliance
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-blue-600 text-white rounded-lg p-8 inline-block">
            <h3 className="text-xl font-bold mb-3">
              Ready to See Our Privacy Protection in Action?
            </h3>
            <p className="text-blue-100 mb-4 max-w-2xl">
              Join our trial course (TR-SP25) to experience enterprise-grade privacy protection firsthand, 
              or contact us for a detailed privacy review for your institution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '#trial-course'}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Try Our Trial Course
              </button>
              <button 
                onClick={() => window.open('/STUDENT_DATA_PRIVACY.md', '_blank')}
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Full Privacy Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyHighlight;