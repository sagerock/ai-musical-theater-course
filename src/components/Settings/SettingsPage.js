import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import EmailSettings from './EmailSettings';
import ProfileSettings from './ProfileSettings';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const firstName = (currentUser?.displayName || currentUser?.email?.split('@')[0] || 'friend').split(' ')[0];
  const todayLabel = format(new Date(), "EEEE · MMMM d · yyyy").toUpperCase();

  return (
    <div className="dashboard-paper">
      <div className="max-w-4xl mx-auto px-6 md:px-10 lg:px-14 py-10 md:py-14">

        {/* ──────────── MASTHEAD ──────────── */}
        <header className="animate-fade-up">
          <div className="flex items-baseline justify-between flex-wrap gap-4 mb-6">
            <p className="dashboard-mono text-[11px] tracking-[0.22em] uppercase text-stone-500">
              {todayLabel}
            </p>
            <p className="dashboard-mono text-[11px] tracking-[0.18em] uppercase text-stone-500">
              <span className="text-stone-400">Account · </span>
              <span className="text-stone-900">{firstName}</span>
            </p>
          </div>

          <h1 className="dashboard-display text-[2.75rem] sm:text-6xl md:text-7xl leading-[0.95] text-stone-900">
            Settings<span className="text-[#2a2359]">.</span>
          </h1>

          <p className="mt-6 dashboard-serif-italic text-stone-600 text-lg max-w-2xl leading-relaxed">
            The quiet machinery of your account — who you are here, which emails land in your inbox, and how your data is handled.
          </p>

          <div className="mt-10 border-t border-[#e7e2d5]" />
        </header>

        {/* Section 01 — Profile */}
        <div className="mt-14">
          <ProfileSettings />
        </div>

        {/* Section 02 — Email */}
        <div className="mt-20">
          <EmailSettings />
        </div>

        {/* Section 03 — Privacy */}
        <section className="mt-20 animate-fade-up animate-delay-3">
          <div className="flex items-baseline gap-6 md:gap-8">
            <p className="dashboard-display text-5xl md:text-6xl text-[#2a2359] leading-none flex-shrink-0">
              03
            </p>
            <div className="flex-1 min-w-0">
              <p className="dashboard-mono text-[10px] tracking-[0.24em] uppercase text-stone-500">
                Privacy &amp; protection
              </p>
              <h2 className="dashboard-display text-3xl md:text-4xl text-stone-900 mt-1">
                Your data, your terms.
              </h2>
            </div>
          </div>

          <div className="mt-6 border-t border-[#e7e2d5]" />

          <ul className="mt-2">
            {[
              {
                label: 'Training',
                body: 'Your conversations are never used for AI model training — not by us, not by any of our AI providers.',
              },
              {
                label: 'Delivery',
                body: 'Email notifications are sent only to your registered address, over secured transport.',
              },
              {
                label: 'Control',
                body: 'You can change your notification preferences and account details at any time, from this page.',
              },
            ].map((row, i) => (
              <li key={row.label} className="py-6 border-b border-[#e7e2d5] grid grid-cols-1 md:grid-cols-[180px_1fr] md:gap-10 md:items-baseline">
                <div className="flex items-baseline gap-3 mb-2 md:mb-0">
                  <span className="dashboard-mono text-[10px] tabular-nums text-stone-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-900">
                    {row.label}
                  </p>
                </div>
                <p className="dashboard-serif-italic text-stone-700 leading-relaxed text-[1.02rem]">
                  {row.body}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Link
              to="/privacy"
              className="group inline-flex items-center dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-900 border-b border-stone-900 pb-1 hover:text-[#2a2359] hover:border-[#2a2359] transition-colors"
            >
              Read the full privacy policy
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </section>

        {/* Section 04 — Need help? */}
        <section className="mt-20 animate-fade-up animate-delay-4">
          <div className="flex items-baseline gap-6 md:gap-8">
            <p className="dashboard-display text-5xl md:text-6xl text-[#2a2359] leading-none flex-shrink-0">
              04
            </p>
            <div className="flex-1 min-w-0">
              <p className="dashboard-mono text-[10px] tracking-[0.24em] uppercase text-stone-500">
                Reach out
              </p>
              <h2 className="dashboard-display text-3xl md:text-4xl text-stone-900 mt-1">
                Need a hand?
              </h2>
            </div>
          </div>

          <div className="mt-6 border-t border-[#e7e2d5]" />

          <p className="mt-6 dashboard-serif-italic text-stone-600 text-lg leading-relaxed max-w-xl">
            If something here is unclear or not working as it should, there are a few places you can find help.
          </p>

          <nav className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            <Link
              to="/privacy"
              className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-900 ink-underline hover:text-[#2a2359] transition-colors"
            >
              Privacy policy →
            </Link>
            <Link
              to="/help"
              className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-900 ink-underline hover:text-[#2a2359] transition-colors"
            >
              Help &amp; FAQ →
            </Link>
            <Link
              to="/tutorials"
              className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-900 ink-underline hover:text-[#2a2359] transition-colors"
            >
              Tutorials →
            </Link>
            <a
              href="mailto:sage@sagerock.com"
              className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-900 ink-underline hover:text-[#2a2359] transition-colors"
            >
              Email sage@sagerock.com →
            </a>
            <Link
              to="/dashboard"
              className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-500 hover:text-stone-900 transition-colors"
            >
              ← Back to dashboard
            </Link>
          </nav>
        </section>

        {/* Colophon */}
        <footer className="mt-24 pt-8 border-t border-[#e7e2d5]">
          <p className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-400">
            AI Engagement Hub · Partnership over Policing
          </p>
        </footer>
      </div>
    </div>
  );
}