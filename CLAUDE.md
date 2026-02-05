# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Engagement Hub — an educational analytics platform that gives educators real-time visibility into how students interact with AI (prompt activity, model selection, engagement patterns). React 18 frontend backed by Firebase (Auth, Firestore, Storage, Cloud Functions), deployed on Vercel.

See [docs/WHY.md](docs/WHY.md) for the project's guiding principles and mission.

## Development Commands

```bash
npm install              # Install dependencies
npm start                # React dev server on :3000
node server.js           # Express backend on :3001 (email/SendGrid proxy)
npm run dev              # Run both concurrently (recommended)
npm run build            # Production build (CI=false to ignore ESLint warnings)
npm run test             # Jest tests via react-scripts
npm run test:rules       # Firebase security rules tests only
npm run features:status  # Check feature flag status
```

Deploy Firestore rules: `./deploy_firebase_rules.sh` or `./deploy-rules.sh`

## Architecture

### Request Flow for AI Chat

```
React Chat UI → aiProxyService (src/services/aiProxyService.js)
  → Vercel serverless function (api/openai.js | api/anthropic.js | api/google.js | api/perplexity.js)
  → Provider API → Response normalized to OpenAI format → Client
```

AI API keys are **server-side only** (Vercel env vars without `REACT_APP_` prefix). The client never touches provider credentials. All provider responses are normalized to OpenAI's `choices[0].message.content` shape.

### Key Service Files

- **`src/services/aiApi.js`** — AI model registry (`AI_TOOLS` map), educational system prompts, provider routing via `getProviderFromModel()`, model-specific timeouts (35-70s)
- **`src/services/aiProxyService.js`** — Client-side proxy that routes chat requests to Vercel API functions
- **`src/services/firebaseApi.js`** — Single data layer for all Firestore operations. Exports: `userApi`, `courseApi`, `projectApi`, `chatApi`, `attachmentApi`, `tagApi`, `reflectionApi`, `instructorNotesApi`, `announcementApi`, `schoolsApi`, `analyticsApi`, `realtimeApi`, `courseMembershipApi`
- **`src/contexts/AuthContext.js`** — Firebase Auth provider. Merges Firebase Auth user with Firestore user document. Exposes `currentUser`, `userRole`, `isInstructorAnywhere`, `isSchoolAdministrator`

### Role System (Dual-Layer)

**Global roles** (stored on user document): `admin`, `school_administrator`, `student`

**Course roles** (stored in `courseMemberships` collection): `instructor`, `teaching_assistant`, `student_assistant`, `student`

Permission checking combines both layers. The membership document ID format is `{userId}_{courseId}` for efficient Firestore lookups. Role utilities live in `src/utils/roleUtils.js`.

Auto-admin: the email `sage+admin@sagerock.com` is automatically promoted to admin on login.

### Route Guards (App.js)

- `ProtectedRoute` — authenticated users
- `InstructorRoute` — checks `isInstructorAnywhere`
- `AdminRoute` — checks `userRole === 'admin'`
- `SchoolAdminRoute` — checks `isSchoolAdministrator`
- `StudentAssistantRoute` — queries course membership for student assistant permissions

### Firebase Cloud Functions (functions/index.js)

Node.js 20, Firebase Functions v2. Key callable functions:

- `deleteUserCompletely` — Admin-only cascading delete (memberships, chats, projects, notes, reflections, auth account)
- `generateCourseAnalytics` — Server-side analytics computation, cached in `courseAnalytics` collection, marked stale by `updateAnalyticsOnChatChange` trigger
- `sendCourseJoinNotifications` — Emails instructors/admins when students request enrollment
- `sendApprovalConfirmationEmail` — Welcome email when enrollment is approved
- `sendRoleChangeNotificationEmail` — Notifies students of role changes
- `sendEmail` — General-purpose authenticated email sender via SendGrid

### Vercel Serverless API (api/)

Each AI provider has its own proxy route with provider-specific handling:
- `api/openai.js` — GPT-5 forced to temperature=1, 60s max duration
- `api/anthropic.js` — Converts OpenAI message format to Anthropic Messages API and back
- `api/google.js` — Uses Gemini `startChat()` with history, maps roles (`assistant`→`model`)
- `api/perplexity.js` — OpenAI-compatible endpoint, maps `sonar-pro`→`sonar`
- `api/send-email.js` — SendGrid proxy, 30s max duration
- `api/health.js` — Health check

### Firestore Security Rules (firestore.rules)

Helper functions: `isAuthenticated()`, `isOwner()`, `isGlobalAdmin()`, `hasTeachingPermissionsInCourse()`, `hasStudentAssistantPermissionsInCourse()`, `isMemberOfCourse()`, `isSchoolAdministratorForCourse()`

Key patterns:
- Teaching permissions = `teaching_assistant` OR `instructor` OR `school_administrator`
- Students create pending memberships; instructors approve
- Student assistants can view peer projects (enables peer mentoring)
- Chats are most restrictive: owner + course instructors only
- Contact requests are publicly writable (lead gen), admin-only readable

### Analytics Architecture

Heavy analytics run server-side via the `generateCourseAnalytics` Cloud Function to avoid N+1 client queries. Results are cached in `courseAnalytics/{courseId}` and automatically marked stale when chat data changes via Firestore trigger.

## Environment Variables

**Client-side** (`.env.local`, prefixed with `REACT_APP_`):
- Firebase config: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`
- Email: `SENDGRID_FROM_EMAIL`, `URL`
- Local dev: `EMAIL_API_URL=http://localhost:3001`

**Server-side** (Vercel env vars, NO `REACT_APP_` prefix):
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `PERPLEXITY_API_KEY`, `SENDGRID_API_KEY`

See `.env.local.example` for the current template.

## Tech Stack

- React 18, React Router, Tailwind CSS
- Firebase (Auth, Firestore, Storage, Cloud Functions v2)
- Vercel (hosting + serverless API proxy)
- AI: OpenAI (GPT-5/4.1 series), Anthropic (Claude Sonnet 4.5, Opus 4.1), Google (Gemini 2.5 Flash/Pro), Perplexity (Sonar Pro)
- SendGrid for transactional email
- PDF.js + Tesseract.js for document extraction with OCR fallback
