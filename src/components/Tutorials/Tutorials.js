import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tutorialApi } from '../../services/firebaseApi';
import Footer from '../Layout/Footer';
import {
  ChartBarIcon,
  HomeIcon,
  StarIcon,
  PlayCircleIcon,
  ClockIcon,
  FunnelIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const audienceLabels = {
  student: 'Students',
  instructor: 'Instructors',
  admin: 'Admins',
};

export default function Tutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeAudience, setActiveAudience] = useState('All');
  const { currentUser } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    tutorialApi.getPublishedTutorials()
      .then(data => setTutorials(data))
      .catch(err => console.error('Error loading tutorials:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(tutorials.map(t => t.category).filter(Boolean))];

  const filtered = tutorials
    .filter(t => activeCategory === 'All' || t.category === activeCategory)
    .filter(t => activeAudience === 'All' || (t.audience || []).includes(activeAudience))
    .sort((a, b) => a.order - b.order);

  // Group filtered tutorials by category
  const grouped = filtered.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

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
                  <Link to="/philosophy" className="text-gray-600 hover:text-gray-900 font-medium">Philosophy</Link>
                  <Link to="/faq" className="text-gray-600 hover:text-gray-900 font-medium">FAQ</Link>
                  <Link to="/privacy" className="text-gray-600 hover:text-gray-900 font-medium">Privacy</Link>
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

      {/* Hero Section */}
      <div className="hero-mesh text-white">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center">
            <div className="animate-fade-up inline-flex items-center px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm mb-8">
              <StarIcon className="h-4 w-4 text-amber-400 mr-2" />
              <span className="text-sm font-medium text-gray-300 tracking-wide">Learn the Platform</span>
            </div>
            <h1 className="animate-fade-up animate-delay-1 text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Tutorials
            </h1>
            <p className="animate-fade-up animate-delay-2 text-lg md:text-xl text-blue-100/80 leading-relaxed max-w-2xl mx-auto">
              Short, focused videos to help you get the most out of AI Engagement Hub
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200/80 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          {tutorials.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Category filter */}
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveCategory('All')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        activeCategory === 'All'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      All Topics
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                          activeCategory === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audience filter */}
                <div className="flex items-center gap-2 sm:ml-auto">
                  <UserGroupIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveAudience('All')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        activeAudience === 'All'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Everyone
                    </button>
                    {Object.entries(audienceLabels).map(([key, label]) => (
                      key !== 'admin' && (
                        <button
                          key={key}
                          onClick={() => setActiveAudience(key)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                            activeAudience === key
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tutorial Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {tutorials.length === 0 ? (
              <div className="text-center py-16">
                <PlayCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Tutorials coming soon!</p>
                <p className="text-gray-400 text-sm mt-2">Check back for video guides on using AI Engagement Hub.</p>
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No tutorials match your filters.</p>
                <button
                  onClick={() => { setActiveCategory('All'); setActiveAudience('All'); }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map(tutorial => (
                        <Link
                          key={tutorial.slug}
                          to={`/tutorials/${tutorial.slug}`}
                          className="group bg-white rounded-xl border border-gray-200/80 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                          {/* Video thumbnail placeholder */}
                          <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <PlayCircleIcon className="h-16 w-16 text-white/40 group-hover:text-white/70 group-hover:scale-110 transition-all duration-300" />
                            {tutorial.duration && (
                              <div className="absolute bottom-2 right-2 flex items-center bg-black/60 text-white text-xs px-2 py-1 rounded">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {tutorial.duration}
                              </div>
                            )}
                          </div>
                          {/* Card body */}
                          <div className="p-5">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                              {tutorial.title}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                              {tutorial.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(tutorial.audience || []).map(a => (
                                <span
                                  key={a}
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    a === 'instructor'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {audienceLabels[a]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* CTA Section */}
      <div className="cta-mesh text-white py-20">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Jump in and start exploring AI-enhanced learning today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-lg text-slate-900 bg-white hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-white/10"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/join"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-lg text-slate-900 bg-white hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-white/10"
                >
                  Join a Course
                </Link>
                <Link
                  to="/faq"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-lg text-white border border-white/20 hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                >
                  Read the FAQ
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="bg-gray-50 py-8 text-center">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
          &larr; Back to Home
        </Link>
      </div>

      <Footer />
    </div>
  );
}
