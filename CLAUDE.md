# Claude Memory File - AI Engagement Hub

## Project Overview
AI Engagement Hub - An educational analytics platform that helps educators understand how students interact with AI in real time. Designed for classrooms at any level—from high school to higher ed—it provides a smarter lens on AI usage, offering teachers clear visibility into prompt activity, model selection, and engagement patterns across leading AI tools.

## AI Models Configuration

### Supported Models (12 total across 3 providers)

#### OpenAI Models
- GPT-4.1: `gpt-4.1-2025-04-14`
- GPT-4.1-Mini: `gpt-4.1-mini-2025-04-14`
- O4-Mini: `o4-mini-2025-04-16`
- GPT-4o: `gpt-4o-2024-08-06`
- GPT-Image-1: `gpt-image-1`

#### Anthropic Models
- Claude Opus 4: `claude-opus-4-20250514`
- Claude Sonnet 4: `claude-sonnet-4-20250514` (default model)
- Claude Sonnet 3.7: `claude-3-7-sonnet-20250219`
- Claude Sonnet 3.5: `claude-3-5-sonnet-20241022`
- Claude Haiku 3.5: `claude-3-5-haiku-20241022`

#### Google Models
- Gemini 2.5 Pro: `gemini-2.0-flash-exp`
- Gemini 2.5 Flash: `gemini-1.5-flash`

## Technical Implementation

### Key Files
- `src/services/aiApi.js` - Unified AI service that routes to correct provider
- `src/services/openaiApi.js` - OpenAI integration
- `src/services/anthropicApi.js` - Anthropic integration  
- `src/services/googleApi.js` - Google Gemini integration
- `src/components/Chat/ChatMessage.js` - Chat display with markdown rendering
- `src/components/Chat/MarkdownRenderer.js` - Custom markdown parser
- `src/components/Layout/Layout.js` - App layout with sidebar

### Environment Variables Required
```
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key
REACT_APP_GOOGLE_API_KEY=your_google_api_key
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Known Issues & Solutions

### Gemini Models Not Displaying Responses
**Problem:** Gemini models were not showing AI responses in the chat interface.

**Root Cause:** 
1. Incorrect model names (gemini-2.5-pro/flash don't exist)
2. Response extraction method may need fallback

**Solution Applied:**
1. Updated model names to currently available ones:
   - `gemini-2.5-pro` → `gemini-2.0-flash-exp`
   - `gemini-2.5-flash` → `gemini-1.5-flash`
2. Added debug logging to track response structure
3. Added fallback text extraction using `response.text()` method
4. Updated both `googleApi.js` and `openaiApi.js` AI_TOOLS mapping

**Files Modified:**
- `src/services/googleApi.js`: Updated model names and added debugging
- `src/services/openaiApi.js`: Updated AI_TOOLS mapping for Google models

### Markdown Rendering Implementation
**Problem:** AI responses showed raw markdown instead of formatted text.

**Solution:** Created custom MarkdownRenderer component without external dependencies due to npm permission issues.

**Features Supported:**
- Headers (H1, H2, H3)
- Bold (**text**) and italic (*text*)
- Inline code (`code`) and code blocks (```code```)
- Lists (- item, 1. item)
- Proper paragraph formatting

### Layout Issues
**Problem:** Main content was appearing below sidebar instead of alongside it.

**Solution:** 
- Changed main container to use `flex`
- Made desktop sidebar `fixed` positioned
- Updated main content to use `padding-left` instead of `margin-left`
- Maintains responsive design for mobile

### Package Installation Issues
**Problem:** npm permission errors when installing react-markdown.

**Solution:** Created custom markdown renderer to avoid external dependencies.

### Orphaned Data Cleanup System
**Problem:** "Unknown User" entries appearing in admin panel due to orphaned course membership records with null user_ids from early testing phase.

**Root Cause:** Course membership records were created without proper user linkage during development testing.

**Solution Applied:**
1. Created `cleanupOrphanedMemberships()` function in `courseApi` to identify and remove memberships with null `user_id`
2. Added "Cleanup Data" button to AdminPanel with proper loading states and user feedback
3. Function safely removes orphaned records and provides success feedback

**Files Modified:**
- `src/services/supabaseApi.js`: Added cleanupOrphanedMemberships function
- `src/components/Admin/AdminPanel.js`: Added cleanup button and handler function

**Usage:** Admin users can click "Cleanup Data" button in the admin panel to remove all orphaned membership records.

### Forgot Password Feature
**Problem:** Users had no way to reset their password if they forgot it.

**Solution Applied:**
1. Added `sendPasswordResetEmail` import and `resetPassword` function to AuthContext
2. Added "Forgot your password?" link to login form (only visible on sign-in mode)
3. Created modal popup for password reset with email input and proper loading states
4. Integrated with Firebase Auth password reset functionality

**Files Modified:**
- `src/contexts/AuthContext.js`: Added resetPassword function using Firebase's sendPasswordResetEmail
- `src/components/Auth/Login.js`: Added forgot password UI, modal, and handler functions

**Usage:** Users can click "Forgot your password?" link on the login page, enter their email, and receive a password reset link via email.

### AI Interaction Course Linking Fix
**Problem:** AI interactions weren't automatically appearing in instructor dashboards, requiring manual "Sync AI Data" button clicks.

**Root Cause:** When AI interactions were created in `Chat.js`, the `createChat()` function wasn't receiving the course context (`course_id`), even though it was available via `project?.course_id`. This caused interactions to be created without course linkage, making them invisible to instructors filtering by course.

**Solution Applied:**
1. Modified `createChat()` call in Chat component to pass course context: `createChat(chatData, project?.course_id)`
2. Updated instructor dashboard to de-emphasize the sync button (now "Fix Legacy Data" and gray)
3. New AI interactions now automatically appear in instructor dashboards without manual intervention

**Files Modified:**
- `src/components/Chat/Chat.js`: Fixed createChat call to include course_id parameter
- `src/components/Instructor/InstructorDashboard.js`: Updated sync button styling and title

**Impact:** Eliminates the need for manual syncing - AI interactions now appear immediately in instructor dashboards.

### Tag Creation Permissions Restriction
**Problem:** Students could create tags in the tagging modal, which could lead to tag proliferation and inconsistent tagging schemes.

**Solution Applied:**
1. Modified `TaggingModal` component to hide "Create New Tag" section for students
2. Added role-based conditional rendering: only admins and instructors see tag creation UI
3. Added server-side validation in `createTag` API function to reject student requests
4. Updated all `createTag` calls to include `userRole` parameter for validation
5. Added helpful message for students when no tags are available

**Files Modified:**
- `src/components/Chat/TaggingModal.js`: Added userRole prop and conditional UI rendering
- `src/components/Chat/Chat.js`: Pass userRole to TaggingModal component
- `src/services/supabaseApi.js`: Added userRole validation in createTag function
- `src/components/Instructor/TagManagement.js`: Updated createTag call with instructor role

**User Experience:**
- **Students**: Can select and apply existing tags but cannot create new ones
- **Instructors/Admins**: Full tag management capabilities including creation
- **System**: Maintains consistent tagging schemes controlled by educators

**Impact:** Ensures tag governance while maintaining student ability to categorize their AI interactions with instructor-approved tags.

### Collapsible Instructor Notes
**Problem:** Instructor Notes in the chat window took up too much screen real estate, making it difficult to focus on AI conversations.

**Solution Applied:**
1. Made Instructor Notes collapsible with expand/collapse toggle button
2. Notes start collapsed by default to prioritize chat visibility
3. Added smooth transition animations for better UX
4. Reduced padding and shadow when collapsed for minimal footprint
5. Moved "Add Note" button to only show when expanded
6. Added chevron icons to indicate collapse state

**Files Modified:**
- `src/components/Instructor/InstructorNotes.js`: Added collapse state and toggle functionality
- `src/components/Chat/Chat.js`: Reduced padding around InstructorNotes component

**User Experience:**
- **Collapsed**: Minimal header bar with note count and expand button
- **Expanded**: Full notes interface with create/edit capabilities
- **Smooth Transitions**: Visual feedback when toggling states
- **Better Focus**: AI conversations get maximum screen space by default

**Impact:** Improved chat interface usability while maintaining full instructor note functionality when needed.

## Development Commands
```bash
npm install          # Install dependencies
npm start           # Start development server
npm run build       # Build for production
npm run test        # Run tests
```

## Deployment Notes
- Frontend: Deploy to Vercel or similar
- Environment variables must be set in deployment platform
- Database: Firebase for real-time, Supabase for analytics
- All API keys must be properly configured

## Repository
https://github.com/sagerock/ai-musical-theater-course

## Last Updated
January 14, 2025 - Fixed AI interaction course linking, added forgot password feature, restricted tag creation to instructors/admins, and made instructor notes collapsible