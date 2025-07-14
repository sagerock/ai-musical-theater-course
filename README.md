# 🧠 AI Engagement Hub

A powerful analytics platform that helps educators understand how students interact with AI in real time. Designed for classrooms at any level—from high school to higher ed—it provides a smarter lens on AI usage, offering teachers clear visibility into prompt activity, model selection, and engagement patterns across leading AI tools.

## 🌟 Features

### For Students
- **AI Chat Interface**: Interact with 12 AI models across OpenAI, Anthropic, and Google
- **Project Organization**: Create and manage projects to organize AI interactions
- **Smart Tagging**: Apply instructor-curated tags to categorize interactions
- **Reflection System**: Guided reflection prompts to encourage thoughtful AI usage
- **Personal Dashboard**: View activity, stats, and interaction history
- **Trial Access**: Join trial course (TR-SP25) for immediate platform exploration

### For Instructors
- **Analytics Dashboard**: Monitor student AI usage across all projects with real-time updates
- **Advanced Filtering**: Filter by student, project, AI tool, tags, dates, and reflection status
- **Data Export**: Export interaction data as CSV for external analysis
- **Usage Statistics**: Track reflection completion rates and tool usage patterns
- **Student Oversight**: View all student interactions while maintaining educational value
- **Course Management**: Create courses, manage enrollment, and approve student requests
- **Tag Governance**: Create and manage course-specific tags for consistent categorization
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
- **AI Integration**: OpenAI API, Anthropic Claude API, Google Gemini API
- **Supported Models**: 12 models across GPT-4.1, Claude Opus/Sonnet, Gemini 2.0
- **Hosting**: Vercel (frontend), Supabase Cloud, Firebase
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📁 Project Structure

```
src/
├── components/
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
│   │   └── Layout.js                # Main app layout
│   └── Projects/
│       └── Projects.js              # Project management
├── config/
│   ├── firebase.js                  # Firebase configuration
│   └── supabase.js                  # Supabase configuration
├── contexts/
│   └── AuthContext.js               # Authentication context
├── services/
│   ├── openaiApi.js                 # OpenAI API service
│   └── supabaseApi.js               # Supabase API functions
├── App.js                           # Main app component
├── index.js                         # React entry point
└── index.css                        # Global styles
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

#### Firebase Setup

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication and choose Email/Password and Google providers
3. Create a Firestore database
4. Copy your Firebase configuration

### 3. Environment Variables

Create a `.env.local` file in the root directory:

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

### Firebase Collections

- **users/{userId}**: User profiles
- **projects/{projectId}**: Project data
- **projects/{projectId}/chats/{chatId}**: Real-time chat data

## 🔐 Authentication & Authorization

- **Firebase Authentication** handles user login/signup
- **Role-based access** controlled via Supabase user roles
- **Row Level Security (RLS)** ensures data privacy
- Students can only see their own data
- Instructors can view all student interactions

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
- Firebase for authentication and real-time database
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