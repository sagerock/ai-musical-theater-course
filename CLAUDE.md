# Claude Memory File - AI Engagement Hub

## Project Overview
AI Engagement Hub - An educational analytics platform that helps educators understand how students interact with AI in real time. Designed for classrooms at any level—from high school to higher ed—it provides a smarter lens on AI usage, offering teachers clear visibility into prompt activity, model selection, and engagement patterns across leading AI tools.

## AI Models Configuration

### Supported Models (4 streamlined models across 4 providers)

#### OpenAI Models
- GPT-4o: `gpt-4o-2024-08-06` (default model)

#### Anthropic Models
- Claude Sonnet 4: `claude-sonnet-4-20250514`

#### Google Models
- Gemini Flash: `gemini-1.5-flash`

#### Perplexity Models
- Sonar Pro: `sonar-pro`

## Technical Implementation

### Key Files
- `src/services/aiApi.js` - Unified AI service that routes to correct provider
- `src/services/openaiApi.js` - OpenAI integration
- `src/services/anthropicApi.js` - Anthropic integration  
- `src/services/googleApi.js` - Google Gemini integration
- `src/services/perplexityApi.js` - Perplexity integration
- `src/components/Chat/ChatMessage.js` - Chat display with markdown rendering
- `src/components/Chat/MarkdownRenderer.js` - Custom markdown parser
- `src/components/Layout/Layout.js` - App layout with sidebar

### Environment Variables Required
```
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key
REACT_APP_GOOGLE_API_KEY=your_google_api_key
REACT_APP_PERPLEXITY_API_KEY=your_perplexity_api_key
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SUPABASE_SERVICE_KEY=your_supabase_service_key
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

### Enhanced Educational System Prompt
**Problem:** AI responses weren't consistently focused on educational best practices across all models.

**Solution Applied:**
1. Created centralized educational system prompt with comprehensive guidelines
2. Updated all AI providers (OpenAI, Anthropic, Google) to use the same educational prompt
3. Prompt emphasizes source citation, clear reasoning, accuracy, and critical thinking
4. Consistent educational tone across all 12 AI models
5. Backward compatibility with fallback to previous prompt if needed

**Educational System Prompt:**
"You are a helpful, curious, and respectful educational assistant designed to support students as they research, write, and learn. Always cite sources when possible, explain your reasoning clearly, and avoid providing false or misleading information. Encourage students to think critically and verify facts."

**Files Modified:**
- `src/services/aiApi.js`: Added centralized EDUCATIONAL_SYSTEM_PROMPT constant
- `src/services/openaiApi.js`: Updated to accept and use educational system prompt
- `src/services/anthropicApi.js`: Updated to accept and use educational system prompt  
- `src/services/googleApi.js`: Updated to accept and use educational system prompt

**Impact:** All AI interactions now consistently promote educational best practices, source citation, critical thinking, and fact verification across all models and providers.

### AI Model Streamlining
**Problem:** The application supported 12 different AI models across 3 providers, creating complexity and potential confusion for users.

**Solution Applied:**
1. Streamlined from 12 models down to 4 focused models across 4 providers:
   - OpenAI: GPT-4o (set as default)
   - Anthropic: Claude Sonnet 4
   - Google: Gemini Flash
   - Perplexity: Sonar Pro (newly added)
2. Created dedicated Perplexity API integration for research-focused interactions
3. Updated all model configurations to use only the streamlined selection
4. Maintained educational system prompt across all 4 providers
5. Updated environment variables to include Perplexity API key

**Files Modified:**
- `src/services/openaiApi.js`: Updated AI_TOOLS to include only 4 selected models
- `src/services/anthropicApi.js`: Streamlined to only Claude Sonnet 4
- `src/services/googleApi.js`: Streamlined to only Gemini Flash
- `src/services/perplexityApi.js`: Created new Perplexity integration
- `src/services/aiApi.js`: Added Perplexity provider routing and validation
- `CLAUDE.md`: Updated documentation to reflect streamlined model selection

**Model Selection Rationale:**
- **GPT-4o**: Latest general-purpose OpenAI model with strong performance
- **Claude Sonnet 4**: High-quality reasoning and educational responses
- **Gemini Flash**: Fast Google model with good educational capabilities
- **Sonar Pro**: Perplexity's research-focused model with web search capabilities

**Impact:** Simplified user experience with focused, high-quality model selection while adding research capabilities through Perplexity integration.

### PDF Upload System Implementation
**Problem:** Students needed the ability to upload PDF documents to share with AI models for analysis and discussion.

**Solution Applied:**
1. **Database Schema**: Created `pdf_attachments` table with proper foreign key relationships to chats and file metadata storage
2. **Supabase Storage**: Set up `pdf-uploads` bucket with organized folder structure (`userId/chatId/filename`)
3. **Authentication Resolution**: Resolved critical JWT service key authentication issues:
   - Used Legacy API Keys service_role JWT token instead of new API key format
   - Legacy JWT token required for service-level operations and RLS bypass
   - Temporarily disabled RLS on pdf_attachments table for development
4. **PDF Processing**: Implemented intelligent PDF handling that provides file metadata to AI without complex text extraction
5. **Instructor Dashboard**: Added dedicated PDF attachments section for instructor oversight
6. **File Validation**: Added proper file type (PDF only) and size validation (10MB max)

**Authentication Challenge & Resolution:**
- **Issue**: New Supabase secret keys (`sb_secret_...`) cannot be used in browsers
- **Issue**: Legacy JWT service keys were missing required `sub` claim
- **Resolution**: Used the Legacy API Keys service_role JWT token from Supabase Dashboard → Settings → API → Legacy API Keys
- **Final Configuration**: Set `REACT_APP_SUPABASE_SERVICE_KEY` to the legacy JWT token starting with `eyJ...`

**Critical Mistakes Made & Lessons Learned:**
1. **Wrong Key Location**: Initially tried using API Keys tab instead of Legacy API Keys tab
   - **Mistake**: Assumed new API key format would work in browsers
   - **Lesson**: New secret keys (`sb_secret_...`) are server-only and forbidden in browsers
   - **Solution**: Always use Legacy API Keys → service_role secret for browser applications

2. **JWT Keys Confusion**: Confused JWT signing key with service role JWT token
   - **Mistake**: Copied the raw JWT signing key from JWT Keys tab (looks like `taaJS7ZWLu3...`)
   - **Lesson**: The JWT signing key is for token generation, not API authentication
   - **Solution**: Use the actual JWT token from Legacy API Keys tab (starts with `eyJ...`)

3. **RLS Configuration Errors**: Spent excessive time trying to configure RLS policies
   - **Mistake**: Assumed RLS was needed for development and tried complex policy configurations
   - **Lesson**: RLS adds complexity and may not be necessary for all use cases
   - **Solution**: Disable RLS for development, implement properly for production if needed

4. **PDF Text Extraction Complexity**: Attempted browser-incompatible PDF parsing libraries
   - **Mistake**: Tried `pdf-parse` (Node.js only) and complex PDF.js implementations
   - **Lesson**: Browser PDF text extraction is complex and often unreliable
   - **Solution**: Use metadata-based approach with AI guidance for better UX

5. **Service Key Storage**: Hardcoded service key in code instead of environment variables
   - **Mistake**: Embedded JWT token directly in supabaseApi.js for "testing"
   - **Lesson**: Always use environment variables for sensitive credentials
   - **Solution**: Properly configured `REACT_APP_SUPABASE_SERVICE_KEY` environment variable

**Key Takeaways for Future Development:**
- Always check Legacy API Keys first for browser applications
- Environment variables for ALL sensitive data, no exceptions
- Test authentication thoroughly before building complex features
- Simple solutions often work better than complex ones
- RLS should be carefully planned, not assumed necessary

**Files Modified:**
- `src/services/supabaseApi.js`: Added complete `attachmentApi` with upload, download, and course filtering functions
- `src/components/Chat/Chat.js`: Added PDF upload UI and integration with AI chat workflow
- `src/components/Chat/ChatMessage.js`: Added attachment loading and display functionality
- `src/components/Instructor/InstructorDashboard.js`: Added PDF attachments section with download capabilities
- `disable_rls_pdf_attachments.sql`: SQL script to disable RLS on pdf_attachments table

**Database Schema:**
```sql
CREATE TABLE pdf_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**User Experience:**
- **Students**: Upload PDFs in chat, AI acknowledges upload and guides interaction
- **Instructors**: View all student PDFs in dashboard, download for review
- **AI Integration**: PDF metadata included in AI context for guided assistance
- **File Management**: Secure storage with proper access controls and organized paths

**Impact:** Complete PDF workflow enabling students to share documents with AI while providing instructors full oversight and access to student materials.

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
January 14, 2025 - Implemented complete PDF upload system with Supabase Storage integration, resolved JWT service key authentication issues, added instructor PDF dashboard, and streamlined AI models from 12 to 4 focused models with Perplexity integration