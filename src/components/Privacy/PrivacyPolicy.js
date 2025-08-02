import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheckIcon, LockClosedIcon, DocumentTextIcon, ExclamationTriangleIcon, HomeIcon, Bars3Icon, XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function PrivacyPolicy() {
  const { currentUser } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
                    to="/faq"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    FAQ
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

      {/* Privacy Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-8 w-8 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Privacy & Data Protection Policy</h1>
              <p className="text-gray-600 mt-1">How we protect your data and educational content</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Key Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <LockClosedIcon className="h-6 w-6 text-green-600 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Your Data is Protected
              </h2>
              <p className="text-green-800">
                <strong>None of your data is used for AI model training.</strong> We use enterprise-tier API access 
                that ensures your student interactions, prompts, and educational content remain private and are 
                never used to improve or train the AI models.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-primary-500" />
            Quick Summary
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-900">AI Provider</th>
                  <th className="text-left py-2 font-medium text-gray-900">Trains on Your Data?</th>
                  <th className="text-left py-2 font-medium text-gray-900">Data Retention</th>
                  <th className="text-left py-2 font-medium text-gray-900">Access Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 font-medium text-gray-900">OpenAI (GPT-4.1 Mini & GPT-4.1)</td>
                  <td className="py-3 text-red-600 font-medium">❌ No</td>
                  <td className="py-3 text-gray-600">30 days or less</td>
                  <td className="py-3 text-blue-600">Enterprise API</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-gray-900">Anthropic (Claude Sonnet 4 & Opus 4)</td>
                  <td className="py-3 text-red-600 font-medium">❌ No</td>
                  <td className="py-3 text-gray-600">30 days or less</td>
                  <td className="py-3 text-blue-600">Pro API</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-gray-900">Google (Gemini Flash & 2.5 Pro)</td>
                  <td className="py-3 text-red-600 font-medium">❌ No</td>
                  <td className="py-3 text-gray-600">Session-only</td>
                  <td className="py-3 text-blue-600">Workspace/Education</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-gray-900">Perplexity (Sonar)</td>
                  <td className="py-3 text-red-600 font-medium">❌ No</td>
                  <td className="py-3 text-gray-600">Zero-day retention</td>
                  <td className="py-3 text-blue-600">Enterprise API</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Provider Information */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Detailed AI Provider Policies
          </h2>

          {/* OpenAI */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">OpenAI (GPT-4.1 Mini & GPT-4.1)</h3>
                <p className="text-sm text-gray-600">Cost-effective and advanced models for general AI interactions</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Enterprise and API plans <strong>do not</strong> use your data to train models</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>You retain full ownership of your educational content</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Data retention: 30 days maximum (often less)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">ℹ</span>
                <span>Learn more: <a href="https://openai.com/enterprise-privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">OpenAI Enterprise Privacy</a></span>
              </li>
            </ul>
          </div>

          {/* Anthropic */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Anthropic (Claude Sonnet 4 & Opus 4)</h3>
                <p className="text-sm text-gray-600">Analytical excellence and premium research capabilities</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Claude API and Pro accounts <strong>do not</strong> use your data for training</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Opt-out by default - no training unless explicitly consented</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Data retention: ~30 days; safety-flagged content up to 2 years</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">ℹ</span>
                <span>Learn more: <a href="https://privacy.anthropic.com/en/articles/7996885-how-do-you-use-personal-data-in-model-training" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">Anthropic Privacy Policy</a></span>
              </li>
            </ul>
          </div>

          {/* Google Gemini */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Google (Gemini Flash & 2.5 Pro)</h3>
                <p className="text-sm text-gray-600">Efficient responses and superior citations with LearnLM educational training</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Workspace for Education <strong>does not</strong> use prompts to train models</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Data is not shared outside your educational domain</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Session-only retention - prompts are not stored</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">ℹ</span>
                <span>Learn more: <a href="https://workspace.google.com/solutions/ai/#security" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">Google Workspace AI Security</a></span>
              </li>
            </ul>
          </div>

          {/* Perplexity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Perplexity (Sonar Pro)</h3>
                <p className="text-sm text-gray-600">Research-focused model with web search capabilities</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>API & Enterprise tiers have <strong>zero-day retention</strong> and no training</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Your educational research queries are never used for model improvement</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Immediate data deletion after processing</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">ℹ</span>
                <span>Learn more: <a href="https://docs.perplexity.ai/faq/faq" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">Perplexity FAQ</a></span>
              </li>
            </ul>
          </div>
        </div>

        {/* What This Means for Educators */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            What This Means for Educators
          </h2>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start space-x-3">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <p><strong>Student data protection:</strong> Your students' prompts, conversations, and educational content are never used to train AI models.</p>
            </div>
            <div className="flex items-start space-x-3">
              <LockClosedIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <p><strong>Short retention periods:</strong> Data is retained only for minimal support needs (30 days or less) and then permanently deleted.</p>
            </div>
            <div className="flex items-start space-x-3">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <p><strong>Enterprise-grade privacy:</strong> We use business and educational tier access that provides the highest levels of data protection.</p>
            </div>
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <p><strong>Transparency:</strong> We've selected providers with clear, educator-friendly privacy policies and opt-out capabilities.</p>
            </div>
          </div>
        </div>

        {/* Firebase Security Section */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-indigo-900 mb-4">
            Firebase Security Infrastructure
          </h2>
          <div className="space-y-4 text-indigo-800">
            <p>
              <strong>AI Engagement Hub is built on Google Firebase</strong>, providing enterprise-grade security and reliability for educational institutions.
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-semibold">End-to-End Encryption</p>
                  <p className="text-sm">All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <LockClosedIcon className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Authentication & Access Control</p>
                  <p className="text-sm">Firebase Auth provides secure, token-based authentication with role-based access control (student, instructor, admin).</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <DocumentTextIcon className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Data Isolation</p>
                  <p className="text-sm">Firestore security rules ensure complete data isolation between courses. Students can only access data from their enrolled courses.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Compliance & Certifications</p>
                  <p className="text-sm">Firebase is SOC 1/2/3, ISO 27001/27017/27018 certified, GDPR compliant, and FERPA compliant for educational data protection.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Firestore Security Rules</p>
                  <p className="text-sm">Granular database-level access controls ensure course isolation, role-based permissions, and prevent unauthorized data access at the server level.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <LockClosedIcon className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Data Residency & Infrastructure</p>
                  <p className="text-sm">Data hosted on Google Cloud Platform with redundant backup systems, 99.95% uptime SLA, and configurable data residency options for compliance.</p>
                </div>
              </div>
            </div>
            <p className="text-sm mt-4">
              Learn more about Firebase security: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline">Firebase Privacy & Security</a>
            </p>
          </div>
        </div>

        {/* Technical Security Details for IT Review */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Technical Security Implementation
          </h2>
          <div className="text-blue-800 space-y-4">
            <p className="font-medium">For IT administrators and security teams:</p>
            
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Access Control Architecture</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>Database-Level Security:</strong> Firestore security rules enforce permissions at the server level before any data query execution</li>
                <li><strong>Course Isolation:</strong> Users can only access data from courses where they have approved membership</li>
                <li><strong>Role-Based Permissions:</strong> Students see only their own content + course materials; Instructors see all course content; Admins have system-wide access</li>
                <li><strong>Session Management:</strong> JWT tokens with configurable expiration, automatic refresh, and secure logout</li>
              </ul>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Data Protection & Compliance</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>FERPA Alignment:</strong> Student AI interactions are treated as educational records with appropriate access controls</li>
                <li><strong>Data Minimization:</strong> Only necessary data is collected (name, email, AI interactions, course enrollment)</li>
                <li><strong>Retention Controls:</strong> Data lifecycle management with configurable retention periods</li>
                <li><strong>Audit Logging:</strong> All data access and modifications are logged for compliance review</li>
                <li><strong>No Third-Party Analytics:</strong> No external tracking or analytics beyond Firebase's built-in security monitoring</li>
              </ul>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Infrastructure & Availability</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>Google Cloud Infrastructure:</strong> Multi-region redundancy with 99.95% uptime SLA</li>
                <li><strong>DDoS Protection:</strong> Built-in protection against distributed denial of service attacks</li>
                <li><strong>Backup & Recovery:</strong> Automated daily backups with point-in-time recovery capabilities</li>
                <li><strong>Network Security:</strong> All connections use TLS 1.3, HSTS headers, and secure cookie policies</li>
                <li><strong>Vulnerability Management:</strong> Automated security scanning and patching through Firebase platform</li>
              </ul>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Data Processing & AI Integration</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li><strong>AI Provider Security:</strong> Encrypted API calls to OpenAI, Anthropic, Google, and Perplexity with no data retention by providers</li>
                <li><strong>Local Processing:</strong> PDF text extraction and data processing occurs client-side when possible</li>
                <li><strong>No AI Training:</strong> Student data is never used to train AI models or shared with AI providers beyond query processing</li>
                <li><strong>Content Filtering:</strong> AI responses are monitored for inappropriate content and can be flagged for instructor review</li>
              </ul>
            </div>

            <p className="text-sm italic">
              For detailed security assessments or compliance documentation, please contact the development team for additional technical specifications and certifications.
            </p>
          </div>
        </div>

        {/* Our Commitment */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Our Commitment to Educational Privacy
          </h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-4">
              The AI Engagement Hub is designed specifically for educational environments with privacy as a core principle. We understand that student data is sensitive and requires the highest levels of protection.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>We never:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
              <li>Use your data to train our own models</li>
              <li>Share educational content with third parties</li>
              <li>Retain data longer than necessary for platform functionality</li>
              <li>Allow AI providers to use your data for training (all use enterprise/API tiers)</li>
            </ul>
            <p className="text-gray-700">
              <strong>We do:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>Provide full transparency about data handling</li>
              <li>Use only enterprise-grade AI services with strict privacy guarantees</li>
              <li>Give educators complete visibility into student AI interactions</li>
              <li>Regularly review and update our privacy practices</li>
            </ul>
          </div>
        </div>

        {/* Back to App */}
        <div className="mt-8 text-center">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}