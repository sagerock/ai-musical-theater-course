import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tutorialApi } from '../../services/firebaseApi';
import Footer from '../Layout/Footer';
import {
  ChartBarIcon,
  HomeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  PlayCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import MarkdownRenderer from '../Chat/MarkdownRenderer';

const audienceLabels = {
  student: 'Students',
  instructor: 'Instructors',
  admin: 'Admins',
};

export default function TutorialDetail() {
  const { slug } = useParams();
  const { currentUser } = useAuth();
  const [tutorial, setTutorial] = useState(null);
  const [allTutorials, setAllTutorials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    Promise.all([
      tutorialApi.getTutorialBySlug(slug),
      tutorialApi.getPublishedTutorials(),
    ])
      .then(([t, all]) => {
        setTutorial(t);
        setAllTutorials(all);
      })
      .catch(err => console.error('Error loading tutorial:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link to={currentUser ? "/dashboard" : "/"} className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
                <span className="ml-3 text-lg font-bold text-gray-900">AI Engagement Hub</span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="aspect-video bg-gray-200 rounded-xl" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return <Navigate to="/tutorials" replace />;
  }

  const index = allTutorials.findIndex(t => t.slug === slug);
  const prev = index > 0 ? allTutorials[index - 1] : null;
  const next = index < allTutorials.length - 1 ? allTutorials[index + 1] : null;
  const related = allTutorials
    .filter(t => t.category === tutorial.category && t.slug !== slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to={currentUser ? "/dashboard" : "/"} className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
                <span className="ml-3 text-lg font-bold text-gray-900">AI Engagement Hub</span>
              </Link>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
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
                  <Link to="/tutorials" className="text-gray-600 hover:text-gray-900 font-medium">Tutorials</Link>
                  <Link to="/faq" className="text-gray-600 hover:text-gray-900 font-medium">FAQ</Link>
                  <Link to="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Sign In</Link>
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

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/tutorials" className="hover:text-gray-700">Tutorials</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">{tutorial.category}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{tutorial.title}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Main column */}
          <div className="lg:col-span-2">
            {/* Title area */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {tutorial.category}
                </span>
                {(tutorial.audience || []).map(a => (
                  <span
                    key={a}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a === 'instructor'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {audienceLabels[a]}
                  </span>
                ))}
                {tutorial.duration && (
                  <span className="inline-flex items-center text-xs text-gray-500">
                    <ClockIcon className="h-3.5 w-3.5 mr-1" />
                    {tutorial.duration}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {tutorial.title}
              </h1>
              <p className="mt-3 text-lg text-gray-600">{tutorial.description}</p>
            </div>

            {/* Video player */}
            <div className="mb-8 rounded-xl overflow-hidden border border-gray-200 bg-gray-900">
              {tutorial.videoUrl ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={tutorial.videoUrl}
                    title={tutorial.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative w-full flex items-center justify-center" style={{ paddingBottom: '56.25%' }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                    <PlayCircleIcon className="h-20 w-20 mb-4" />
                    <p className="text-lg font-medium">Video coming soon</p>
                    <p className="text-sm text-white/30 mt-1">Read the transcript below for now</p>
                  </div>
                </div>
              )}
            </div>

            {/* Transcript */}
            {tutorial.transcript && (
              <div className="mb-10">
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Transcript</h2>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 prose-headings:mt-4 prose-headings:mb-2">
                  <MarkdownRenderer>{tutorial.transcript}</MarkdownRenderer>
                </div>
              </div>
            )}

            {/* Prev / Next Navigation */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-8">
              {prev ? (
                <Link
                  to={`/tutorials/${prev.slug}`}
                  className="group flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Previous</div>
                    {prev.title}
                  </div>
                </Link>
              ) : <div />}
              {next ? (
                <Link
                  to={`/tutorials/${next.slug}`}
                  className="group flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors text-right"
                >
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Next</div>
                    {next.title}
                  </div>
                  <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : <div />}
            </div>
          </div>

          {/* Sidebar */}
          <div className="mt-10 lg:mt-0">
            {/* Related tutorials */}
            {related.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  More in {tutorial.category}
                </h3>
                <div className="space-y-3">
                  {related.map(r => (
                    <Link
                      key={r.slug}
                      to={`/tutorials/${r.slug}`}
                      className="block group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                          <PlayCircleIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {r.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{r.duration}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All tutorials link */}
            <Link
              to="/tutorials"
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              All Tutorials
            </Link>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="bg-gray-50 py-8 text-center border-t">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
          &larr; Back to Home
        </Link>
      </div>

      <Footer />
    </div>
  );
}
