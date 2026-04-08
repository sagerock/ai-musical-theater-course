import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectApi, chatApi, courseApi } from '../../services/firebaseApi';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalChats: 0,
    recentChats: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole, loading: authLoading } = useAuth();

  // First approved course for linking "View all" / "New Project"
  const firstCourseId = userCourses[0]?.courses?.id;
  
  // Removed excessive debug logging

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      console.log('📊 Dashboard: Starting data load for', currentUser.id);

      // Get user's approved and pending courses in parallel
      const [fetchedCourses, pendingFetched] = await Promise.all([
        courseApi.getUserCourses(currentUser.id),
        courseApi.getUserPendingCourses(currentUser.id).catch(() => []),
      ]);
      const approvedCourses = fetchedCourses.filter(m => m.status === 'approved');
      setUserCourses(approvedCourses);
      setPendingCourses(pendingFetched);

      if (approvedCourses.length === 0) {
        // No courses — try legacy data
        const [legacyProjects, legacyChats] = await Promise.all([
          projectApi.getUserProjects(currentUser.id).catch(() => []),
          (userRole !== 'instructor' && userRole !== 'admin')
            ? chatApi.getUserChats(currentUser.id, null, 5).catch(() => [])
            : Promise.resolve([])
        ]);

        // Get project count server-side
        const projectCountSnap = await getCountFromServer(
          query(collection(db, 'projects'), where('createdBy', '==', currentUser.id))
        ).catch(() => ({ data: () => ({ count: legacyProjects.length }) }));

        setRecentProjects(legacyProjects.slice(0, 3));
        setRecentChats(legacyChats.slice(0, 5));
        setStats({
          totalProjects: projectCountSnap.data().count,
          totalChats: legacyChats.length,
          recentChats: 0
        });
        setLoading(false);
        return;
      }

      const courseIds = approvedCourses.map(m => m.courses.id);
      const isInstructor = userRole === 'instructor' || userRole === 'admin';
      const instructorCourseIds = isInstructor
        ? approvedCourses.filter(m => m.role === 'instructor').map(m => m.courses.id)
        : [];

      // Fire all queries in parallel:
      // 1. Server-side project count (no document downloads)
      // 2. Server-side chat count (no document downloads)
      // 3. Recent 3 projects (small payload)
      // 4. Recent 5 chats (small payload, optimized fetch)
      const projectCountPromise = getCountFromServer(
        query(collection(db, 'projects'), where('createdBy', '==', currentUser.id))
      ).catch(() => ({ data: () => ({ count: 0 }) }));

      // Chat count: students = own chats, instructors = course chats
      let chatCountPromise;
      if (isInstructor && instructorCourseIds.length > 0) {
        // Sum counts across instructor courses (batched in groups of 10)
        chatCountPromise = (async () => {
          let total = 0;
          for (let i = 0; i < instructorCourseIds.length; i += 10) {
            const batch = instructorCourseIds.slice(i, i + 10);
            const counts = await Promise.all(
              batch.map(cId =>
                getCountFromServer(
                  query(collection(db, 'chats'), where('courseId', '==', cId))
                ).then(snap => snap.data().count).catch(() => 0)
              )
            );
            total += counts.reduce((a, b) => a + b, 0);
          }
          return total;
        })();
      } else {
        chatCountPromise = getCountFromServer(
          query(collection(db, 'chats'), where('userId', '==', currentUser.id))
        ).then(snap => snap.data().count).catch(() => 0);
      }

      // Recent projects: just need 3, fetched from first course (already sorted by createdAt desc)
      const recentProjectsPromise = projectApi.getUserProjects(currentUser.id, courseIds[0])
        .catch(() => []);

      // Recent chats: just need 5
      let recentChatsPromise;
      if (isInstructor && instructorCourseIds.length > 0) {
        // Use optimized batch-fetch for first instructor course, limit 5
        recentChatsPromise = chatApi.getChatsWithFiltersOptimized({
          courseId: instructorCourseIds[0],
          limit: 5
        }).catch(() => []);
      } else {
        recentChatsPromise = chatApi.getUserChats(currentUser.id, courseIds[0], 5)
          .catch(() => []);
      }

      const [projectCountSnap, chatCount, projects, chats] = await Promise.all([
        projectCountPromise,
        chatCountPromise,
        recentProjectsPromise,
        recentChatsPromise
      ]);

      setRecentProjects(projects.slice(0, 3));
      setRecentChats(chats.slice(0, 5));
      setStats({
        totalProjects: projectCountSnap.data().count,
        totalChats: chatCount,
        recentChats: 0
      });

      console.log('📊 Dashboard loaded:', {
        projects: projectCountSnap.data().count,
        chats: chatCount,
        recentProjects: projects.length,
        recentChats: chats.length
      });

    } catch (error) {
      console.error('❌ Dashboard: Error loading data:', error);
      setRecentProjects([]);
      setRecentChats([]);
      setStats({ totalProjects: 0, totalChats: 0, recentChats: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentUser, userRole]);

  useEffect(() => {
    if (currentUser && userRole !== null) {
      console.log('🔄 Dashboard: useEffect triggered, calling loadDashboardData');
      loadDashboardData();
    } else {
      console.log('⚠️ Dashboard: useEffect triggered but missing requirements:', {
        hasCurrentUser: !!currentUser,
        userRole: userRole
      });
      setLoading(false);
    }
  }, [currentUser?.id, userRole, loadDashboardData]);

  // Removed excessive debug logging

  if (loading || authLoading) {
    return (
      <div className="dashboard-paper">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-14">
          <div className="animate-pulse">
            <div className="h-3 w-48 bg-stone-200 mb-8" />
            <div className="h-16 md:h-24 w-2/3 bg-stone-200 mb-4" />
            <div className="h-16 md:h-24 w-1/3 bg-stone-200 mb-10" />
            <div className="h-px bg-stone-200 mb-10" />
            <div className="grid grid-cols-3 gap-10">
              <div className="h-20 bg-stone-200" />
              <div className="h-20 bg-stone-200" />
              <div className="h-20 bg-stone-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="dashboard-paper">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-14">
          <p className="dashboard-mono text-[11px] tracking-[0.22em] uppercase text-[#b8440d]">Error</p>
          <p className="dashboard-display text-3xl mt-4">Authentication lost. Refresh to continue.</p>
        </div>
      </div>
    );
  }

  const isNewUser = stats.totalProjects === 0 && stats.totalChats === 0;
  const firstName = (currentUser?.displayName || currentUser?.email?.split('@')[0] || 'friend').split(' ')[0];
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Still up';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Working late';
  })();
  const todayLabel = format(new Date(), "EEEE · MMMM d · yyyy").toUpperCase();

  return (
    <div className="dashboard-paper">
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-10 md:py-14">

        {/* ──────────── MASTHEAD ──────────── */}
        <header className="animate-fade-up">
          <div className="flex items-baseline justify-between flex-wrap gap-4 mb-6">
            <p className="dashboard-mono text-[11px] tracking-[0.22em] uppercase text-stone-500">
              {todayLabel}
            </p>
            <p className="dashboard-mono text-[11px] tracking-[0.18em] uppercase text-stone-500">
              {isNewUser
                ? 'New arrival'
                : <>
                    <span className="text-stone-900">{stats.totalProjects}</span>
                    <span className="mx-2">·</span>
                    <span className="text-stone-900">{stats.totalChats}</span>
                    <span className="ml-2 text-stone-400">projects · exchanges</span>
                  </>
              }
            </p>
          </div>

          <h1 className="dashboard-display text-[2.75rem] sm:text-6xl md:text-7xl leading-[0.95] text-stone-900">
            {isNewUser && pendingCourses.length === 0 ? (
              <>Welcome<span className="text-[#2a2359]">.</span></>
            ) : (
              <>
                {greeting},
                <br />
                <span className="text-[#2a2359]">{firstName}</span>
                <span className="text-stone-400">.</span>
              </>
            )}
          </h1>

          <div className="mt-10 border-t border-[#e7e2d5]" />
        </header>

        {/* ──────────── PENDING STRIP ──────────── */}
        {pendingCourses.length > 0 && (
          <section className="animate-fade-up animate-delay-1 mt-2">
            {pendingCourses.map(pending => (
              <article
                key={pending.id}
                className="flex items-start gap-5 py-6 border-b border-[#e7e2d5]"
              >
                <div className="flex-shrink-0 mt-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#b8440d] opacity-60 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#b8440d]" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <p className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-[#b8440d]">
                      Awaiting approval
                    </p>
                    {pending.courses?.course_code && (
                      <p className="dashboard-mono text-[10px] tracking-[0.15em] uppercase text-stone-500">
                        {pending.courses.course_code}
                      </p>
                    )}
                  </div>
                  <h2 className="dashboard-display text-2xl md:text-3xl mt-2 text-stone-900">
                    {pending.courses?.title || 'Course'}
                  </h2>
                  <p className="mt-3 dashboard-serif-italic text-stone-600 leading-relaxed max-w-2xl">
                    Your request has been sent to the instructor. You'll receive an email and this will move into your active courses the moment they approve it.
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}

        {isNewUser ? (
          /* ──────────── NEW USER EXPERIENCE ──────────── */
          <>
            {pendingCourses.length === 0 && (
              <section className="mt-12 animate-fade-up animate-delay-1">
                <p className="dashboard-serif-italic text-lg md:text-xl text-stone-600 leading-relaxed max-w-2xl">
                  An editorial notebook for thinking with AI — not just asking it. Enroll in a course, start a project, and keep a thoughtful record of how your conversations evolve.
                </p>
                <div className="mt-10 flex items-center gap-8 flex-wrap">
                  <Link
                    to="/join"
                    className="group inline-flex items-center dashboard-mono text-[11px] tracking-[0.22em] uppercase text-stone-900 border-b border-stone-900 pb-1 hover:text-[#2a2359] hover:border-[#2a2359] transition-colors"
                  >
                    Join a course
                    <ArrowRightIcon className="ml-3 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/tutorials"
                    className="dashboard-mono text-[11px] tracking-[0.22em] uppercase text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    Watch the tutorials →
                  </Link>
                </div>
              </section>
            )}

            {/* Three editorial features, numbered */}
            <section className="mt-20 md:mt-24 animate-fade-up animate-delay-2">
              <p className="dashboard-mono text-[10px] tracking-[0.24em] uppercase text-stone-500 mb-10">
                A different kind of AI classroom
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
                {[
                  {
                    n: '01',
                    title: 'Observe',
                    body: 'Real-time visibility into how you work with AI models — which prompts, which tools, which turns you take.',
                  },
                  {
                    n: '02',
                    title: 'Reflect',
                    body: 'Conversations become material for thought, with structured prompts that turn raw interaction into learning.',
                  },
                  {
                    n: '03',
                    title: 'Learn',
                    body: 'Instructors see the shape of engagement across a class; students build a record of how their thinking evolves.',
                  },
                ].map(f => (
                  <article key={f.n}>
                    <p className="dashboard-display text-5xl md:text-6xl text-[#2a2359] leading-none">
                      {f.n}
                    </p>
                    <div className="mt-5 border-t border-[#e7e2d5]" />
                    <h3 className="mt-5 dashboard-display text-2xl md:text-[1.7rem] text-stone-900">
                      {f.title}
                    </h3>
                    <p className="mt-3 text-sm md:text-[0.95rem] leading-relaxed text-stone-600">
                      {f.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* ──────────── RETURNING USER EXPERIENCE ──────────── */
          <>
            {/* Figures: oversized serif numerals */}
            <section className="mt-12 animate-fade-up animate-delay-1">
              <p className="dashboard-mono text-[10px] tracking-[0.24em] uppercase text-stone-500 mb-8">
                By the numbers
              </p>
              <div className="grid grid-cols-3 gap-4 md:gap-8">
                {[
                  { fig: stats.totalProjects, label: stats.totalProjects === 1 ? 'Project' : 'Projects' },
                  { fig: stats.totalChats, label: stats.totalChats === 1 ? 'Exchange' : 'Exchanges' },
                  { fig: userCourses.length, label: userCourses.length === 1 ? 'Course' : 'Courses' },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className={i > 0 ? 'pl-4 md:pl-8 border-l border-[#e7e2d5]' : ''}
                  >
                    <p className="dashboard-display text-[3.5rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] text-stone-900 leading-none tabular-nums">
                      {s.fig}
                    </p>
                    <p className="mt-4 dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-500">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Two-column editorial: Recent Projects · Recent Exchanges */}
            <section className="mt-20 md:mt-24 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 animate-fade-up animate-delay-2">
              {/* Recent Projects */}
              <div>
                <div className="flex items-baseline justify-between mb-6">
                  <p className="dashboard-mono text-[10px] tracking-[0.24em] uppercase text-stone-500">
                    Recent projects
                  </p>
                  {firstCourseId ? (
                    <Link
                      to={`/course/${firstCourseId}/projects`}
                      className="dashboard-mono text-[10px] tracking-[0.18em] uppercase text-stone-900 ink-underline hover:text-[#2a2359] transition-colors"
                    >
                      View all →
                    </Link>
                  ) : (
                    <Link
                      to="/join"
                      className="dashboard-mono text-[10px] tracking-[0.18em] uppercase text-stone-900 ink-underline hover:text-[#2a2359] transition-colors"
                    >
                      Join a course →
                    </Link>
                  )}
                </div>

                {recentProjects.length > 0 ? (
                  <ol className="border-t border-[#e7e2d5]">
                    {recentProjects.map((project, idx) => (
                      <li key={project.id} className="border-b border-[#e7e2d5]">
                        <Link
                          to={`/chat/${project.id}`}
                          className="group flex items-baseline gap-5 py-6 -mx-4 px-4 hover:bg-[#f4ede0]/50 transition-colors"
                        >
                          <span className="dashboard-mono text-[11px] text-stone-400 tabular-nums w-7 flex-shrink-0">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="dashboard-display text-xl md:text-[1.4rem] text-stone-900 group-hover:text-[#2a2359] transition-colors truncate">
                              {project.title}
                            </p>
                            <p className="mt-1.5 dashboard-mono text-[10px] tracking-[0.14em] uppercase text-stone-500">
                              {format(new Date(project.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <ArrowRightIcon className="h-4 w-4 text-stone-300 group-hover:text-[#2a2359] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="border-t border-[#e7e2d5] py-10">
                    <p className="dashboard-serif-italic text-stone-600 text-lg">
                      Your workspace is still blank.
                    </p>
                    <div className="mt-5">
                      {firstCourseId ? (
                        <Link
                          to={`/course/${firstCourseId}/projects`}
                          className="inline-flex items-center dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-900 border-b border-stone-900 pb-1 hover:text-[#2a2359] hover:border-[#2a2359] transition-colors"
                        >
                          <PlusIcon className="h-3 w-3 mr-2" />
                          Start your first project
                        </Link>
                      ) : (
                        <Link
                          to="/join"
                          className="inline-flex items-center dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-900 border-b border-stone-900 pb-1 hover:text-[#2a2359] hover:border-[#2a2359] transition-colors"
                        >
                          Join a course to begin →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Exchanges */}
              <div>
                <p className="dashboard-mono text-[10px] tracking-[0.24em] uppercase text-stone-500 mb-6">
                  Recent exchanges
                </p>
                {recentChats.length > 0 ? (
                  <ul className="border-t border-[#e7e2d5]">
                    {recentChats.map(chat => (
                      <li key={chat.id} className="border-b border-[#e7e2d5] py-6">
                        <div className="flex items-baseline justify-between gap-3 mb-3">
                          <p className="dashboard-mono text-[10px] tracking-[0.18em] uppercase text-[#2a2359]">
                            {chat.tool_used || 'AI'}
                          </p>
                          <p className="dashboard-mono text-[10px] tracking-[0.12em] uppercase text-stone-400 tabular-nums">
                            {chat.created_at && !isNaN(new Date(chat.created_at))
                              ? format(new Date(chat.created_at), 'MMM d · HH:mm')
                              : '—'}
                          </p>
                        </div>
                        <p className="dashboard-serif-italic text-stone-700 leading-relaxed text-[0.98rem]">
                          &ldquo;{chat.prompt.length > 140 ? `${chat.prompt.substring(0, 140)}…` : chat.prompt}&rdquo;
                        </p>
                        {(chat.projects || (chat.chat_tags && chat.chat_tags.length > 0)) && (
                          <div className="mt-3 flex items-baseline flex-wrap gap-x-4 gap-y-1">
                            {chat.projects && (
                              <p className="dashboard-mono text-[10px] tracking-[0.14em] uppercase text-stone-500">
                                <span className="text-stone-400">in ·</span> {chat.projects.title}
                              </p>
                            )}
                            {chat.chat_tags && chat.chat_tags.length > 0 && (
                              <div className="flex flex-wrap gap-3">
                                {chat.chat_tags.slice(0, 3).map((chatTag, index) => (
                                  <span
                                    key={index}
                                    className="dashboard-mono text-[9px] tracking-[0.14em] uppercase text-stone-600 border-b border-stone-300"
                                  >
                                    {chatTag.tags.name}
                                  </span>
                                ))}
                                {chat.chat_tags.length > 3 && (
                                  <span className="dashboard-mono text-[9px] tracking-[0.14em] uppercase text-stone-400">
                                    +{chat.chat_tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="border-t border-[#e7e2d5] py-10">
                    <p className="dashboard-serif-italic text-stone-600 text-lg">
                      No exchanges on record yet.
                    </p>
                    <p className="mt-3 text-sm text-stone-500 max-w-sm leading-relaxed">
                      Start a conversation with AI and your activity will appear here as a running log — model, timestamp, prompt, and tags.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Bottom rule + colophon */}
        <footer className="mt-24 pt-8 border-t border-[#e7e2d5]">
          <p className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-400">
            AI Engagement Hub · Partnership over Policing
          </p>
        </footer>
      </div>
    </div>
  );
}