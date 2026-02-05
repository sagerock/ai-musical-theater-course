import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChartBarIcon, HomeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import InfoRequestModal from '../Home/InfoRequestModal';

export default function Philosophy() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { currentUser } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const humanCapacities = [
    {
      name: 'Creativity',
      description: 'Not generating content — AI does that. Having original vision. Seeing what doesn\'t exist yet and feeling compelled to make it real.'
    },
    {
      name: 'Empathy',
      description: 'Understanding another person\'s experience. Not simulating understanding — actually feeling it, and letting it change how you act.'
    },
    {
      name: 'Judgment',
      description: 'Deciding what should be done, not just what can be done. Weighing tradeoffs that have no clean answer. Living with ambiguity.'
    },
    {
      name: 'Collaboration',
      description: 'Building something together that none of us could build alone. The friction, negotiation, and unexpected breakthroughs of real human teamwork.'
    },
    {
      name: 'Discernment',
      description: 'Knowing when AI is right, when it\'s plausible but wrong, and when the question itself is flawed. The essential literacy of our era.'
    },
    {
      name: 'Adaptability',
      description: 'Thriving in a world that changes faster than any curriculum can keep up with. Learning how to learn, again and again.'
    }
  ];

  const principles = [
    {
      name: 'Partnership over Policing',
      description: 'We coach responsible AI use, not surveil it. The relationship between students and AI should be transparent and productive — not adversarial. When students feel trusted, they use AI more thoughtfully.'
    },
    {
      name: 'Transparency by Design',
      description: 'Every prompt, every AI response, every edit is visible. Not as surveillance, but as a shared record of the learning process. Transparency turns AI interactions from black boxes into teaching moments.'
    },
    {
      name: 'Discovery over Delivery',
      description: 'Education is not content delivery — it\'s guided discovery. We design experiences where students find answers rather than receive them. AI amplifies this by making the universe of knowledge available to every learner.'
    },
    {
      name: 'Collective Intelligence',
      description: 'The most powerful learning happens when individual exploration meets group synthesis. Our platform is designed for this rhythm: explore alone, build together, repeat.'
    },
    {
      name: 'Human Capacity Growth',
      description: 'Every feature exists to develop creativity, empathy, judgment, collaboration, discernment, and adaptability. If a feature doesn\'t build human capacity, it doesn\'t belong.'
    },
    {
      name: 'Dignity and Equity',
      description: 'Every student deserves access to powerful AI tools, regardless of background. Every student deserves an educational experience that treats them as capable and worthy of trust. Privacy is a right, not a privilege.'
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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Our Philosophy
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-95">
              AI has become the smartest in the room. Education must become something greater.
            </p>
          </div>
        </div>
      </div>

      {/* The Shift */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">The Honest Reality</h2>
          <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
            <p>
              AI is already the most knowledgeable entity in any classroom. It retrieves facts instantly,
              synthesizes research in seconds, and generates polished work on demand. This isn't coming — it's here.
            </p>
            <p>
              The old model — where teachers hold knowledge and distribute it to students who prove they
              absorbed it — is over. Not because teachers failed, but because the game changed. When any
              student can access the sum of human knowledge through a conversation, "knowing things" stops
              being the point of education.
            </p>
            <p className="text-xl font-medium text-gray-900">
              This is not a crisis. It's a liberation.
            </p>
          </div>
        </div>
      </div>

      {/* What Remains Uniquely Human */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Makes Us Human</h2>
          <p className="text-lg text-gray-600 mb-10">
            If AI handles knowledge, what's left for us? Everything that matters.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {humanCapacities.map((capacity) => (
              <div key={capacity.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{capacity.name}</h3>
                <p className="text-gray-600 leading-relaxed">{capacity.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-lg font-medium text-gray-900 text-center">
            These aren't "soft skills." They're the hard skills of being human in an age of intelligent machines.
          </p>
        </div>
      </div>

      {/* The New Roles */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">New Roles for a New Era</h2>
          <div className="space-y-12">
            {/* The Guide */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">The Guide <span className="text-lg font-normal text-gray-500">— Teacher</span></h3>
              <div className="text-gray-600 space-y-4">
                <p>
                  The teacher is no longer the source of knowledge — they are the shaper of journeys. A Guide
                  focuses attention on what matters, prevents students from wandering down unproductive paths,
                  asks the questions that AI can't ask for itself, and maintains the human dimension of
                  learning: care, challenge, belonging.
                </p>
                <p>
                  Great Guides don't compete with AI. They do what AI cannot: see the whole student and shape
                  an educational experience around who that student is becoming.
                </p>
              </div>
            </div>

            {/* The Explorer */}
            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">The Explorer <span className="text-lg font-normal text-gray-500">— Student</span></h3>
              <div className="text-gray-600 space-y-4">
                <p>
                  Students are no longer passive recipients. They are explorers — charting their own path
                  through knowledge with AI as a powerful tool at their side. Each student's journey is
                  different. Each brings back something unique to share with the group.
                </p>
                <p>
                  The Explorer's job is not to memorize what AI already knows. It's to ask better questions,
                  make unexpected connections, and develop the human capacities that define meaningful work.
                </p>
              </div>
            </div>

            {/* The Partner */}
            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">The Partner <span className="text-lg font-normal text-gray-500">— AI</span></h3>
              <div className="text-gray-600 space-y-4">
                <p>
                  AI brings knowledge, speed, and tireless availability. It handles retrieval so humans can
                  focus on meaning. It generates possibilities so humans can exercise judgment. It provides
                  feedback so students can iterate faster.
                </p>
                <p>
                  But AI doesn't care about your students. It doesn't understand your classroom culture. It
                  doesn't know what your students need to grow. That's why partnership — not replacement — is
                  the model.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How We Learn Now */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">How We Learn Now</h2>
          <p className="text-lg text-gray-600 mb-10">
            Learning becomes a cycle of <strong className="text-gray-900">individual exploration</strong> and <strong className="text-gray-900">collective collaboration</strong>.
          </p>
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">1</div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Explore individually</h3>
                <p className="text-gray-600">
                  Each student works with AI to investigate, create, and discover. They go deep into questions
                  that fascinate them, using AI to push further than they could alone.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">2</div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Bring it back to the group</h3>
                <p className="text-gray-600">
                  Students share what they found — the insights, the surprises, the dead ends. The Guide
                  facilitates synthesis. The group builds understanding that no individual (and no AI) could
                  reach alone.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">3</div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Repeat at a higher level</h3>
                <p className="text-gray-600">
                  Each cycle deepens understanding. The Guide adjusts the journey based on what the group
                  discovers. Everyone — students, Guide, and AI alike — arrives somewhere new.
                </p>
              </div>
            </div>
          </div>
          <p className="mt-10 text-lg text-gray-600">
            This is how knowledge has always been built at its best: individual curiosity feeding collective
            wisdom. AI just makes it possible at every level of education.
          </p>
        </div>
      </div>

      {/* Our Principles */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">Our Principles</h2>
          <div className="space-y-8">
            {principles.map((principle, index) => (
              <div key={principle.name} className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{principle.name}</h3>
                  <p className="text-gray-600 leading-relaxed">{principle.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection to New Human Education */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Rooted in New Human Education</h2>
          <div className="max-w-3xl mx-auto text-lg text-gray-600 space-y-6">
            <p>
              Our philosophy grows from the New Human Education movement — a practical framework for thriving
              alongside intelligent machines. New Human Education starts from what we know about human beings:
              that we are creative, social, meaning-seeking, and capable of growth at every age. It asks a
              simple question: if AI handles knowledge, what should education do?
            </p>
            <p className="font-medium text-gray-900">
              The answer: develop the capacities that make human experience meaningful.
            </p>
            <p>
              AI Engagement Hub is where this philosophy meets practice. Every feature, every design choice,
              every interaction is shaped by this vision.
            </p>
          </div>
          <div className="mt-8">
            <a
              href="https://www.newhumaneducation.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-lg"
            >
              Explore New Human Education
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Join the Movement</h2>
          <p className="text-lg text-gray-300 mb-4 max-w-2xl mx-auto">
            Education is transforming. The question isn't whether AI will change how we teach and
            learn — it's whether we'll shape that change with intention, or let it happen to us.
          </p>
          <p className="text-xl font-medium mb-10">
            We choose intention.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowInfoModal(true)}
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
            >
              Get More Information
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
            <Link
              to="/join"
              className="inline-flex items-center justify-center px-8 py-4 border border-white text-lg font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10"
            >
              Join a Course
            </Link>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="bg-gray-50 py-8 text-center">
        <Link
          to="/"
          className="text-gray-600 hover:text-gray-900"
        >
          &larr; Back to Home
        </Link>
      </div>

      {/* Info Request Modal */}
      {showInfoModal && (
        <InfoRequestModal onClose={() => setShowInfoModal(false)} />
      )}
    </div>
  );
}
