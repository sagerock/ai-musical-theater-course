# 🧠 AI Engagement Hub

A powerful analytics platform that helps educators understand how students interact with AI in real time. Designed for classrooms at any level—from high school to higher ed—it provides a smarter lens on AI usage, offering teachers clear visibility into prompt activity, model selection, and engagement patterns across leading AI tools.

## 🌟 Features

### For Students
- **AI Chat Interface**: Interact with 4 streamlined AI models across OpenAI, Anthropic, Google, and Perplexity
- **Project Organization**: Create and manage projects to organize AI interactions
- **Smart Tagging**: Apply instructor-curated tags to categorize interactions
- **Reflection System**: Guided reflection prompts to encourage thoughtful AI usage
- **Personal Dashboard**: View activity, stats, and interaction history
- **PDF Upload System**: Upload PDFs, documents, and text files for AI analysis with intelligent large file handling
- **Trial Access**: Join trial course (TR-SP25) for immediate platform exploration

### For Instructors
- **Analytics Dashboard**: Monitor student AI usage across all projects with real-time updates
- **Advanced Filtering**: Filter by student, project, AI tool, tags, dates, and reflection status
- **Data Export**: Export interaction data as CSV for external analysis
- **Usage Statistics**: Track reflection completion rates and tool usage patterns
- **Student Oversight**: View all student interactions while maintaining educational value
- **Course Management**: Create courses, manage enrollment, and approve student requests
- **Tag Governance**: Create and manage course-specific tags for consistent categorization
- **PDF Attachment Monitoring**: View and download all student PDF uploads with full context
- **Trial Course Access**: Immediate instructor access for platform evaluation

### System Features
- **Real-time Logging**: Automatic capture of all AI interactions with instant instructor visibility
- **Dual Database**: Firebase for real-time operations, Supabase for analytics
- **Role-based Access**: Secure authentication with student/instructor/admin roles
- **Trial Course System**: TR-SP25 provides immediate access for platform evaluation
- **Forgot Password**: Self-service password reset via email
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Ethics Focus**: Built-in prompts encouraging ethical AI usage
- **Data Cleanup Tools**: Admin tools for maintaining data integrity

## 🛠️ Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Authentication**: Firebase Authentication with forgot password
- **Real-time Database**: Firebase Firestore
- **Analytics Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI API, Anthropic Claude API, Google Gemini API, Perplexity API
- **Supported Models**: 4 streamlined models - GPT-4o, Claude Sonnet 4, Gemini Flash, Sonar Pro
- **File Processing**: PDF.js for document text extraction with intelligent large file handling
- **Hosting**: Vercel (frontend), Supabase Cloud, Firebase
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📁 Project Structure

```
src/
├── components/
│   ├── Admin/
│   │   └── AdminPanel.js            # Admin dashboard and controls
│   ├── Auth/
│   │   └── Login.js                 # Authentication component
│   ├── Chat/
│   │   ├── Chat.js                  # Main chat interface
│   │   ├── ChatMessage.js           # Individual message component
│   │   ├── TaggingModal.js          # Tag management modal
│   │   └── ReflectionModal.js       # Reflection input modal
│   ├── Dashboard/
│   │   └── Dashboard.js             # Student dashboard
│   ├── Instructor/
│   │   └── InstructorDashboard.js   # Instructor analytics
│   ├── Layout/
│   │   ├── Layout.js                # Main app layout
│   │   └── Footer.js                # Footer with privacy links
│   ├── Messaging/
│   │   ├── AdminMessaging.js        # Admin messaging interface
│   │   └── InstructorMessaging.js   # Instructor messaging interface
│   ├── Privacy/
│   │   └── PrivacyPolicy.js         # Privacy policy page
│   ├── Projects/
│   │   └── Projects.js              # Project management
│   └── Settings/
│       ├── ProfileSettings.js       # User profile management
│       └── EmailSettings.js         # Email notification preferences
├── config/
│   ├── firebase.js                  # Firebase configuration
│   └── supabase.js                  # Supabase configuration
├── contexts/
│   └── AuthContext.js               # Authentication context
├── services/
│   ├── aiApi.js                     # Unified AI service router
│   ├── openaiApi.js                 # OpenAI API service
│   ├── anthropicApi.js              # Anthropic API service
│   ├── googleApi.js                 # Google Gemini API service
│   ├── perplexityApi.js             # Perplexity API service
│   ├── emailService.js              # Email notification service
│   └── supabaseApi.js               # Supabase API functions
├── App.js                           # Main app component
├── index.js                         # React entry point
└── index.css                        # Global styles

api/                                 # Vercel serverless functions
├── send-email.js                    # Email sending endpoint
└── health.js                        # Health check endpoint

server.js                            # Express server for local development
vercel.json                          # Vercel deployment configuration
```

## 🚀 Getting Started

### Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Create a `.env.local` file in the project root:
   ```env
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id

   # Supabase Configuration
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenAI Configuration
   REACT_APP_OPENAI_API_KEY=your_openai_api_key

   # Anthropic Configuration
   REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key

   # Google Configuration
   REACT_APP_GOOGLE_API_KEY=your_google_api_key
   
   # Perplexity Configuration
   REACT_APP_PERPLEXITY_API_KEY=your_perplexity_api_key
   
   # Supabase Service Key (for PDF uploads)
   REACT_APP_SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # SendGrid Email Configuration
   REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
   REACT_APP_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   REACT_APP_URL=https://yourdomain.com
   ```

3. **Start the Development Server**
   ```bash
   npm start
   ```

   The app will open at **http://localhost:3000**

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Supabase account
- OpenAI API key

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-engagement-hub
npm install
```

### 2. Database Setup

#### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the schema from `supabase-schema.sql`
3. Copy your project URL and anon key



### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env


# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SUPABASE_SERVICE_KEY=your_supabase_service_key

# OpenAI Configuration
REACT_APP_OPENAI_API_KEY=your_openai_api_key

# Anthropic Configuration
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Configuration
REACT_APP_GOOGLE_API_KEY=your_google_api_key

# Perplexity Configuration
REACT_APP_PERPLEXITY_API_KEY=your_perplexity_api_key

# SendGrid Email Configuration
REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
REACT_APP_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
REACT_APP_URL=https://yourdomain.com
```

### 4. Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`.

## 📊 Database Schema

### Supabase Tables

- **users**: User profiles and roles
- **projects**: Project organization
- **project_members**: Many-to-many project membership
- **chats**: AI interaction logs
- **tags**: Categorization tags
- **chat_tags**: Many-to-many chat-tag relationships
- **reflections**: Student reflections on interactions
- **pdf_attachments**: Document uploads with extracted text and metadata
- **courses**: Course management and organization
- **course_memberships**: Student-course relationships with approval workflow

### Firebase Collections

- **users/{userId}**: User profiles
- **projects/{projectId}**: Project data
- **projects/{projectId}/chats/{chatId}**: Real-time chat data

## 🔐 Privacy & Security

### Enterprise-Grade Student Data Protection
AI Engagement Hub implements **comprehensive privacy protection** designed specifically for educational institutions:

- **Row Level Security (RLS)**: Database-enforced privacy with 19 active policies protecting all sensitive data
- **Student Data Isolation**: Students can only access their own AI interactions, documents, and personal information
- **Course-Based Access Control**: Instructors see only data from their enrolled students
- **Cross-Course Privacy**: Complete isolation between different courses and instructors  
- **Document Security**: Student PDF uploads secured with instructor oversight capabilities

### Privacy Protection Statistics
- 🔒 **7 database tables** with active Row Level Security policies
- 🔒 **53+ AI interactions** protected with student-only access
- 🔒 **16+ user profiles** with role-based information sharing
- 🔒 **10+ PDF documents** with secure storage and controlled access
- 🔒 **37+ student projects** with ownership-based privacy controls
- 🔒 **Complete course isolation** preventing cross-instructor data access

### Authentication & Authorization
- **Firebase Authentication** with forgot password functionality
- **Role-based access control** (student/instructor/admin)
- **Automatic privacy enforcement** that cannot be bypassed by application errors
- **FERPA-compliant** data handling for educational institutions
- **Comprehensive audit logging** for institutional compliance

For detailed privacy information for schools, see [STUDENT_DATA_PRIVACY.md](STUDENT_DATA_PRIVACY.md).

## 📎 PDF Upload & Document Analysis System

### Overview
The AI Engagement Hub features a sophisticated document upload system that allows students to share PDFs, text files, and other documents with AI models for analysis, discussion, and learning support.

### Supported File Types
- **PDF files** (.pdf) - Full text extraction and analysis
- **Text files** (.txt) - Direct text processing
- **Word documents** (.doc, .docx) - Basic support with guidance for text extraction

### Smart Large File Handling
The system intelligently handles files of all sizes:

#### Small to Medium Files (< 2MB)
- **Direct processing** - Full content sent to AI model
- **Immediate analysis** - Complete document context available
- **Fast response** - Minimal processing delay

#### Large Files (2MB - 5MB)
- **Standard processing** with user notification
- **Progress indicators** - Users informed of processing status
- **Full content** - Complete document analysis when possible

#### Very Large Files (> 5MB)
- **Automatic summarization** - Prevents token limit errors
- **Smart content extraction**:
  - Document metadata (pages, word count, file size)
  - First 3 pages preview (8,000 characters)
  - Key section identification
  - Structural analysis
- **Guided interaction** - Instructions for follow-up questions
- **Error prevention** - Avoids 128k token limit failures

### How It Works

1. **Upload Process**
   ```
   Student uploads PDF → File validation → Text extraction → 
   Size check → Summary (if large) → AI processing → Response
   ```

2. **Text Extraction**
   - **PDF.js integration** - Browser-based PDF text extraction
   - **Page-by-page processing** - Maintains document structure
   - **Fallback handling** - Graceful degradation for extraction failures

3. **Intelligent Summarization**
   - **Automatic trigger** - Files > 50,000 characters (~12.5k tokens)
   - **Context preservation** - Key sections and structure maintained
   - **User guidance** - Clear instructions for further interaction

4. **Storage & Security**
   - **Supabase Storage** - Secure cloud file storage
   - **Access control** - User-specific file access
   - **Instructor oversight** - Full visibility of student uploads

### User Experience

#### For Students
- **Drag & drop upload** - Simple file selection
- **Progress feedback** - Real-time upload status
- **Size warnings** - Proactive notifications about large files
- **Smart responses** - AI acknowledges upload and provides guidance
- **Follow-up support** - Encouraged to ask specific questions

#### For Instructors  
- **Complete oversight** - View all student PDF uploads
- **Download access** - Full access to student documents
- **Context awareness** - See what students are working with
- **Educational insight** - Understand student research and interests

### Example Workflow

1. **Student uploads 50-page research paper** (large file)
2. **System automatically summarizes** with:
   - "Research Paper: climate-change-study.pdf"
   - "50 pages, ~15,000 words"
   - "First 3 pages: [content preview]"
   - "Key sections: Introduction, Methodology, Results..."
3. **AI response**: "I can see you've uploaded a comprehensive climate change study. I've reviewed the introduction and can help you analyze specific sections. What aspect would you like to explore?"
4. **Student asks**: "Can you help me understand the methodology section?"
5. **Student copies/pastes** relevant methodology text for detailed analysis

### Error Handling & Fallbacks

- **Token limit prevention** - Automatic summarization before hitting limits
- **Extraction failures** - Graceful fallback with user guidance
- **File corruption** - Clear error messages and retry options
- **Network issues** - Robust upload retry mechanisms

### Privacy & Security

- **No training data** - Files never used for AI model training
- **Secure storage** - Enterprise-grade Supabase security
- **Access control** - Files only accessible to uploading user and instructors
- **Automatic cleanup** - Configurable retention policies

This system ensures students can work with documents of any size while maintaining optimal AI interaction quality and preventing technical limitations from disrupting the learning experience.

## 📧 Email Notification System

### Overview
AI Engagement Hub features a comprehensive email notification system that keeps students and instructors informed about important platform activities, built on SendGrid for reliable delivery.

### Notification Types

#### For Students
- **Instructor Note Notifications**: Receive emails when instructors add notes to your projects
- **Weekly Summary**: Optional weekly digest of your AI usage and activity
- **System Updates**: Important platform updates and maintenance notifications

#### For Instructors  
- **New Project Notifications**: Get notified when students create new projects in your courses
- **Weekly Summary**: Optional weekly digest of course activity and student engagement
- **System Updates**: Important platform updates and maintenance notifications

### Email Templates

#### Instructor Note Email (to Students)
- **Subject**: "New instructor note on your project"
- **Content**: Project details, instructor message, direct link to project
- **Design**: Professional, branded template with clear call-to-action

#### New Project Email (to Instructors)
- **Subject**: "Student started a new project"
- **Content**: Student info, project details, course statistics, dashboard link
- **Design**: Clean, informative layout with project metrics

### User Control & Privacy

#### Email Preferences
- **Master Toggle**: Users can disable all email notifications
- **Granular Control**: Individual notification types can be enabled/disabled
- **Role-Based Options**: Different settings available for students vs instructors
- **Instant Updates**: Changes take effect immediately

#### Privacy Features
- **Preference Checking**: System checks user preferences before sending emails
- **Graceful Degradation**: Failed email deliveries don't affect core functionality
- **Secure Processing**: All emails processed through enterprise-grade SendGrid
- **Data Protection**: Email content follows same privacy standards as platform data

### Technical Implementation

#### SendGrid Integration
- **API-Based**: Direct SendGrid API integration for reliable delivery
- **Template System**: Reusable HTML/text templates for consistent branding
- **Error Handling**: Comprehensive error handling and fallback mechanisms
- **Logging**: Detailed logging for debugging and monitoring

#### User Settings Storage
- **Database Fields**: Email preferences stored in user profile
- **Default Settings**: Sensible defaults with notifications enabled
- **Validation**: Server-side validation of email preference updates
- **Backup**: Settings persist across user sessions

### Configuration

#### Required Environment Variables
```env
REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
REACT_APP_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
REACT_APP_URL=https://yourdomain.com
```

#### SendGrid Setup Steps
1. Create SendGrid account and verify domain
2. Generate API key with mail send permissions
3. Configure SPF/DKIM records for email authentication
4. Set up sender identity and verification
5. Test email delivery with staging environment

### User Experience

#### Settings Interface
- **Accessible Settings**: Easy-to-find settings page in main navigation
- **Clear Controls**: Toggle switches for each notification type
- **Dependency Management**: Master toggle controls all notifications
- **Immediate Feedback**: Success/error messages for setting changes

#### Email Design
- **Mobile Responsive**: Templates work on all devices
- **Professional Branding**: Consistent with platform design
- **Clear CTAs**: Direct links to relevant platform sections
- **Accessibility**: High contrast, readable fonts, proper markup

### Error Handling & Reliability

#### Failure Scenarios
- **API Failures**: SendGrid API errors handled gracefully
- **User Preference Errors**: Database failures don't prevent email sending
- **Network Issues**: Retry mechanisms and timeout handling
- **Invalid Recipients**: Validation and error logging

#### Monitoring & Debugging
- **Console Logging**: Detailed logs for development and debugging
- **Success Tracking**: Confirmation of successful email deliveries
- **Error Reporting**: Comprehensive error reporting for failures
- **Performance Monitoring**: Track email delivery times and success rates

### Security Considerations

#### Data Protection
- **API Key Security**: SendGrid API keys stored securely as environment variables
- **Content Filtering**: Email content sanitized to prevent XSS attacks
- **User Consent**: All emails respect user notification preferences
- **Unsubscribe Options**: Clear mechanisms for users to disable notifications

#### Compliance
- **GDPR Compliance**: User control over email preferences and data
- **CAN-SPAM Compliance**: Proper sender identification and unsubscribe options
- **Educational Privacy**: Compliant with educational privacy standards
- **Data Retention**: Email sending logs managed according to retention policies

This email system enhances the educational experience by keeping all stakeholders informed while respecting privacy and user preferences.

## 📬 Messaging System Architecture

### Overview
The AI Engagement Hub features a comprehensive messaging system that enables communication between administrators, instructors, and students. The system uses a modern full-stack architecture with different implementations for local development and production deployment.

### System Components

#### Frontend (React App)
- **Location**: `src/components/Messaging/`
- **Components**:
  - `AdminMessaging.js` - Admin interface for messaging instructors or all users
  - `InstructorMessaging.js` - Instructor interface for messaging students in their courses
- **Integration**: Embedded in Admin Panel and Instructor Dashboard
- **Features**: Role-based messaging, recipient selection, bulk sending, result tracking

#### Backend Architecture

The messaging system uses a **dual-server architecture** that adapts to the deployment environment:

##### Local Development (Two-Server Setup)
```
Frontend (Port 3000) → Backend (Port 3001) → SendGrid API → Email Delivered
```

**Frontend Server** (`npm start`):
- React development server
- Runs on `http://localhost:3000`
- Serves the web application
- Makes API calls to backend server

**Backend Server** (`node server.js`):
- Express.js API server
- Runs on `http://localhost:3001`
- Handles email sending through SendGrid
- Bypasses CORS restrictions

##### Production (Vercel Serverless)
```
Frontend (Vercel) → Serverless Function (/api/send-email) → SendGrid API → Email Delivered
```

**Unified Deployment**:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.vercel.app/api/send-email`
- Single deployment with serverless functions

### Technical Implementation

#### Local Development Setup

1. **Start Backend Server**:
   ```bash
   node server.js
   ```
   - Loads environment variables from `.env.local`
   - Starts Express server on port 3001
   - Provides endpoints:
     - `/api/send-email` - Email sending
     - `/api/health` - Health check
     - `/api/test-config` - Configuration verification

2. **Start Frontend Server**:
   ```bash
   npm start
   ```
   - React development server on port 3000
   - Automatically routes email requests to `http://localhost:3001/api/send-email`

3. **Combined Development**:
   ```bash
   npm run dev
   ```
   - Uses `concurrently` to run both servers simultaneously
   - Recommended for development workflow

#### Production Deployment (Vercel)

1. **Serverless Functions**:
   - `api/send-email.js` - Handles email sending
   - `api/health.js` - Health check endpoint
   - Automatically deployed with frontend

2. **Environment Variables** (Vercel Dashboard):
   ```env
   REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
   REACT_APP_SENDGRID_FROM_EMAIL=your_email@domain.com
   REACT_APP_URL=https://your-app.vercel.app
   ```

3. **Automatic Routing**:
   - Frontend automatically detects production environment
   - Routes requests to `/api/send-email` (same domain)
   - No CORS issues in production

### Email Service Logic

The email service (`src/services/emailService.js`) intelligently adapts to the environment:

```javascript
// Automatic environment detection
const EMAIL_API_URL = process.env.REACT_APP_EMAIL_API_URL || 
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

// Smart API routing
const apiUrl = EMAIL_API_URL ? `${EMAIL_API_URL}/api/send-email` : '/api/send-email';
```

**Development Mode**:
- `EMAIL_API_URL` = `http://localhost:3001`
- Routes to Express server
- Full debugging and logging

**Production Mode**:
- `EMAIL_API_URL` = `` (empty)
- Routes to `/api/send-email` (same domain)
- Uses Vercel serverless functions

### CORS Solution

#### The Problem
Browsers block direct API calls from `localhost:3000` to `api.sendgrid.com` due to CORS (Cross-Origin Resource Sharing) restrictions.

#### The Solution
**Local Development**:
- Frontend calls backend server (same-origin allowed)
- Backend server calls SendGrid (server-to-server, no CORS)

**Production**:
- Frontend calls serverless function (same-origin)
- Serverless function calls SendGrid (server-to-server, no CORS)

### Message Types & Templates

#### Admin Messages
- **Recipients**: Instructors or all platform users
- **Features**: Priority levels (Normal, High, Urgent)
- **Template**: Professional admin communication template
- **Access**: Admin Panel → Admin Messaging

#### Instructor Messages
- **Recipients**: Students in instructor's courses
- **Features**: Course selection, student count display
- **Template**: Course-contextualized messaging template
- **Access**: Instructor Dashboard → Instructor Messaging

#### Email Templates
All emails include:
- **HTML Version**: Professional styling with branding
- **Text Version**: Plain text fallback
- **Course Context**: Course name, code, and links
- **Sender Information**: Name, role, and contact details
- **Branding**: Consistent AI Engagement Hub design

### Development Workflow

#### Setting Up Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   # Add to .env.local
   REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key
   REACT_APP_SENDGRID_FROM_EMAIL=your_email@domain.com
   REACT_APP_EMAIL_API_URL=http://localhost:3001
   ```

3. **Start Development Servers**:
   ```bash
   # Option 1: Combined (recommended)
   npm run dev
   
   # Option 2: Separate terminals
   # Terminal 1:
   node server.js
   
   # Terminal 2:
   npm start
   ```

4. **Test Email Functionality**:
   - Frontend: `http://localhost:3000`
   - Backend health: `http://localhost:3001/api/health`
   - Use messaging interfaces in Admin Panel or Instructor Dashboard

#### Deploying to Production

1. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Add messaging system"
   git push
   ```

2. **Configure Vercel**:
   - Add environment variables in Vercel dashboard
   - Vercel automatically detects `/api` folder
   - Serverless functions deploy automatically

3. **Verify Deployment**:
   - Frontend: `https://your-app.vercel.app`
   - Health check: `https://your-app.vercel.app/api/health`
   - Test messaging functionality

### Error Handling & Fallbacks

#### Development Mode Fallbacks
- If backend server is unavailable, falls back to email simulation
- Logs emails to console for testing
- Provides detailed error messages

#### Production Reliability
- Vercel serverless functions auto-scale
- SendGrid provides enterprise-grade email delivery
- Comprehensive error logging and monitoring

#### User Experience
- Loading states during email sending
- Success/failure notifications
- Retry mechanisms for failed sends
- Detailed result tracking for bulk sends

### Monitoring & Debugging

#### Development Debugging
- Console logs for email sending attempts
- Backend server logs for API calls
- Health check endpoint for configuration verification

#### Production Monitoring
- Vercel function logs in dashboard
- SendGrid delivery analytics
- Email success/failure tracking
- Performance monitoring

### Security Considerations

#### API Key Management
- **Development**: Stored in `.env.local` (not committed)
- **Production**: Stored in Vercel environment variables
- **Access**: Server-side only, never exposed to browser

#### Email Security
- **Authentication**: SendGrid API key authentication
- **Validation**: Input validation on all email data
- **Rate Limiting**: Built-in SendGrid rate limiting
- **Privacy**: User email preferences respected

### Scalability

#### Local Development
- Single developer workflow
- Instant feedback and debugging
- Hot reloading for rapid development

#### Production Scaling
- **Serverless Functions**: Auto-scale with traffic
- **SendGrid**: Enterprise email infrastructure
- **Vercel**: Global CDN and edge computing
- **Database**: Supabase auto-scaling

This messaging system architecture provides a seamless experience from development to production while maintaining security, scalability, and reliability throughout the deployment lifecycle.

## 🎯 Usage Guide

### Getting Started - Trial Course

**Want to try AI Engagement Hub without setup?** Join our trial course for immediate access!

- **Course Code**: `TR-SP25`
- **Automatic Approval**: No waiting for instructor approval
- **Choose Your Role**: Join as either a student or instructor to explore different perspectives
- **Full Feature Access**: Experience all platform capabilities instantly
- **No Commitment**: Perfect for evaluating the platform before setting up your own courses

Simply visit the home page and click "Join Trial Course" to get started immediately!

### For Students

1. **Sign Up/Login**: Create account or login with email or Google
2. **Join Course**: Enter a course code or join the trial course (TR-SP25)
3. **Create Project**: Organize your work into projects within your course
4. **Start Chatting**: Select an AI tool and begin your conversation
5. **Add Tags**: Apply instructor-created tags to categorize your interactions
6. **Reflect**: Use guided prompts to reflect on your AI usage
7. **Review**: Check your dashboard for activity and insights

### For Instructors

1. **Login**: Use instructor credentials to access advanced features
2. **Course Management**: Create courses and manage student enrollment
3. **Approval Workflow**: Review and approve student course join requests
4. **Tag Management**: Create and organize tags for student use
5. **View Analytics**: Monitor student usage patterns and statistics
6. **Filter Data**: Use advanced filters to analyze specific interactions
7. **Export Data**: Download CSV files for external analysis
8. **Track Progress**: Monitor reflection completion rates

### Course Join Process

**Trial Course (TR-SP25)**:
- ✅ **Automatic approval** - immediate access
- ✅ **No instructor required** - perfect for exploration
- ✅ **Full platform features** - complete experience

**Regular Courses**:
- ⏳ **Instructor approval required** - maintains classroom control
- 📧 **Email notifications** - instructors notified of requests
- 🔒 **Secure enrollment** - ensures only authorized students join

## 🔧 Configuration

### AI Tools

The application supports multiple OpenAI models:
- GPT-3.5 Turbo (default)
- GPT-4
- GPT-4 Turbo

### Default Tags

Pre-configured tags include:
- Lyrics
- Character Development
- Plot Development
- Research
- Creative Writing
- Ethical Use
- Brainstorming
- Editing
- Technical Help
- Inspiration

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend Services

- **Firebase**: Automatically scales, no additional setup needed
- **Supabase**: Cloud-hosted, auto-manages scaling

## 🔒 Security Considerations

- **API Keys**: OpenAI API calls are made from the frontend (use backend proxy in production)
- **RLS Policies**: Implement Row Level Security in Supabase
- **Data Privacy**: Students can only access their own data
- **Audit Trail**: All interactions are logged with metadata

## 📈 Analytics & Insights

The instructor dashboard provides:
- Total interaction counts
- User activity levels
- Tool usage patterns
- Reflection completion rates
- Tag usage statistics
- Temporal usage patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing powerful AI models

- Supabase for analytics database and API
- Tailwind CSS for beautiful styling
- Heroicons for consistent iconography

## 📞 Support

For support, email [your-email] or create an issue in the GitHub repository.

## 🎓 Educational Use

This application is designed specifically for educational environments to:
- Encourage thoughtful AI usage
- Provide transparency in AI interactions
- Enable reflection on learning processes
- Support pedagogical research on AI in education

---

**Built with ❤️ for educators and students exploring AI-enhanced learning.** 