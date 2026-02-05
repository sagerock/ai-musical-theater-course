import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CheckIcon, ChartBarIcon, HomeIcon } from '@heroicons/react/24/outline';
import InfoRequestModal from '../Home/InfoRequestModal';

export default function Pricing() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { currentUser } = useAuth();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const plans = [
    {
      name: 'Monthly Plan',
      description: 'Flexible month-to-month pricing',
      basePrice: '$750',
      period: 'per month',
      accounts: '25 accounts included',
      features: [
        'Base platform for up to 25 accounts',
        'School Administrators, Instructors, Teaching Assistants, Student Assistants, Students',
        'Access to all 7 curated AI models',
        'Unlimited AI interactions',
        'Real-time analytics dashboard',
        'Student progress tracking',
        'AI literacy education resources',
        'Tag system for organization',
        'PDF upload capabilities',
        'Email support',
        'FERPA-compliant data handling'
      ],
      cta: 'Contact Sales',
      highlighted: false
    },
    {
      name: 'Annual Plan',
      description: 'Best value with annual commitment',
      basePrice: '$500',
      period: 'per month',
      billing: 'billed annually ($6,000)',
      accounts: '25 accounts included',
      savings: 'Save $250/month vs monthly',
      features: [
        'Base platform for up to 25 accounts',
        'School Administrators, Instructors, Teaching Assistants, Student Assistants, Students',
        'Access to all 7 curated AI models',
        'Unlimited AI interactions',
        'Real-time analytics dashboard',
        'Student progress tracking',
        'AI literacy education resources',
        'Tag system for organization',
        'PDF upload capabilities',
        'Priority support',
        'Advanced analytics',
        'Bulk student enrollment',
        'Custom course branding',
        'API access (coming soon)',
        'Training webinars',
        'Dedicated success manager'
      ],
      cta: 'Contact Sales',
      highlighted: true
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
            <p className="mt-4 text-xl text-gray-600">
              Base platform for up to 25 accounts. If you require more accounts, discounts are available.
            </p>
            <p className="mt-2 text-lg text-primary-600 font-semibold">
              <button onClick={() => setShowInfoModal(true)} className="underline hover:text-primary-700">
                Contact Sales for more information
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl ${
                plan.highlighted
                  ? 'bg-white shadow-xl ring-2 ring-primary-500'
                  : 'bg-white shadow-lg'
              } p-8`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit">
                  <span className="bg-primary-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    BEST VALUE
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                <p className="mt-2 text-gray-600">{plan.description}</p>
                {plan.savings && (
                  <p className="mt-2 text-green-600 font-semibold">{plan.savings}</p>
                )}
              </div>

              <div className="mb-8">
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.basePrice}</span>
                  <span className="ml-2 text-gray-600">{plan.period}</span>
                </div>
                <div className="text-lg text-gray-600 mb-2">
                  {plan.accounts}
                </div>
                {plan.billing && (
                  <p className="mt-2 text-sm text-gray-500">{plan.billing}</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className={feature.startsWith('Everything') ? 'font-semibold' : ''}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowInfoModal(true)}
                className={`block w-full py-3 px-6 text-center rounded-md font-medium transition-colors ${
                  plan.highlighted
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Platform Overview */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">
            Platform Overview
          </h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Base Platform</h4>
              <p className="text-gray-600">Every account sets up with a minimum of 25 accounts</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Account Types Included:</h5>
                <ul className="space-y-2 text-gray-600">
                  <li>• School Administrators</li>
                  <li>• Instructors</li>
                  <li>• Teaching Assistants</li>
                  <li>• Student Assistants</li>
                  <li>• Students</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Pricing Options:</h5>
                <ul className="space-y-2 text-gray-600">
                  <li><strong>Annual:</strong> $500/month ($6,000 invoice)</li>
                  <li><strong>Monthly:</strong> $750/month</li>
                  <li><strong>Volume:</strong> Discounts available for more accounts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">
            Pricing Questions
          </h3>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-2">How does billing work?</h4>
              <p className="text-gray-600">
                Every account starts with a base platform fee for up to 25 accounts. You can add or remove 
                users within this limit at any time. For more than 25 accounts, volume discounts are available.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-2">Can I switch between monthly and annual?</h4>
              <p className="text-gray-600">
                Yes! You can upgrade to annual billing at any time to lock in the savings. If you need to 
                switch from annual to monthly, you can do so at the end of your annual term.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-2">What about volume discounts?</h4>
              <p className="text-gray-600">
                If you require more than 25 accounts, discounts are available. 
                <button onClick={() => setShowInfoModal(true)} className="text-primary-600 hover:text-primary-700 underline">Contact Sales</button> for more information about volume pricing.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to enhance your classroom with AI?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join educators using AI Engagement Hub to transform student learning
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowInfoModal(true)}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Contact Sales
            </button>
            <button
              onClick={() => setShowInfoModal(true)}
              className="inline-flex items-center justify-center px-6 py-3 border border-primary-300 text-base font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100"
            >
              Get Volume Pricing
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