# Claude Memory File - AI Musical Theater Course

## Project Overview
AI Interaction Logger - An educational web application that allows students and instructors to interact with multiple AI models while automatically logging interactions, enabling structured reflection, and providing analytics.

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
January 12, 2025 - Fixed Gemini model integration and response display issues