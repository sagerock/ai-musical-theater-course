/**
 * Tutorial data for the Tutorials section.
 *
 * To add a new tutorial:
 * 1. Add an entry to the appropriate category below
 * 2. Set the videoUrl to a YouTube/Loom embed URL (use embed format)
 * 3. Add the transcript text (can be copied from YouTube auto-captions)
 *
 * videoUrl format:
 *   YouTube: https://www.youtube.com/embed/VIDEO_ID
 *   Loom:    https://www.loom.com/embed/VIDEO_ID
 */

const tutorials = [
  // ── Getting Started ──────────────────────────────────────────
  {
    slug: 'creating-an-account',
    title: 'Creating Your Account',
    description: 'Sign up and get your account set up in under a minute.',
    category: 'Getting Started',
    audience: ['student', 'instructor'],
    videoUrl: '', // Add YouTube/Loom embed URL
    duration: '1:30',
    order: 1,
    transcript: `Welcome to AI Engagement Hub! In this quick tutorial, we'll walk you through creating your account. Head to the login page and click "Sign Up." Enter your name, email, and a password. You'll receive a confirmation email — click the link to verify your account, and you're all set to start exploring.`,
  },
  {
    slug: 'joining-a-course',
    title: 'Joining a Course',
    description: 'Use a course code from your instructor to enroll in a course.',
    category: 'Getting Started',
    audience: ['student'],
    videoUrl: '',
    duration: '1:15',
    order: 2,
    transcript: `Once you're logged in, click "Join Course" from the sidebar or dashboard. Enter the course code your instructor gave you and hit submit. Your enrollment request will be sent to your instructor for approval. Once approved, the course will appear in your sidebar and you can start working.`,
  },
  {
    slug: 'navigating-the-dashboard',
    title: 'Navigating Your Dashboard',
    description: 'A quick tour of your dashboard and how to find everything.',
    category: 'Getting Started',
    audience: ['student', 'instructor'],
    videoUrl: '',
    duration: '2:00',
    order: 3,
    transcript: `Your dashboard is your home base. On the left sidebar you'll see your courses, and each course expands to show Projects, Discussions, and Library links. The main area shows your recent activity, pending approvals if you're an instructor, and quick stats about your AI usage. Let's click through each section so you know where everything lives.`,
  },

  // ── Using AI Chat ────────────────────────────────────────────
  {
    slug: 'starting-a-conversation',
    title: 'Starting an AI Conversation',
    description: 'Create a project and start chatting with an AI model.',
    category: 'Using AI Chat',
    audience: ['student'],
    videoUrl: '',
    duration: '1:45',
    order: 4,
    transcript: `To start a conversation, go to your course and click "Projects," then "New Project." Give it a name and description, then open the project to start chatting. Type your message in the input box and hit send. The AI will respond in seconds. You can continue the conversation just like a regular chat.`,
  },
  {
    slug: 'choosing-ai-models',
    title: 'Choosing the Right AI Model',
    description: 'Learn when to use GPT, Claude, Gemini, or Perplexity for different tasks.',
    category: 'Using AI Chat',
    audience: ['student'],
    videoUrl: '',
    duration: '2:30',
    order: 5,
    transcript: `AI Engagement Hub gives you access to models from OpenAI, Anthropic, Google, and Perplexity. Use the model selector dropdown above your chat to switch between them. GPT-5 is great for coding and reasoning. Claude Sonnet excels at analysis and nuanced writing. Gemini Pro provides strong citations for research. And Sonar Pro pulls in real-time web results. Click the info icon next to the selector to see our full model comparison guide.`,
  },
  {
    slug: 'uploading-documents',
    title: 'Uploading Documents to Chat',
    description: 'Attach PDFs and let the AI analyze your course materials.',
    category: 'Using AI Chat',
    audience: ['student'],
    videoUrl: '',
    duration: '1:30',
    order: 6,
    transcript: `You can upload PDF documents directly in chat. Click the attachment icon next to the message input, select your file, and it will be processed and attached to your message. Then ask the AI about the content — it can summarize, analyze, answer questions about, or help you work with the material in your document.`,
  },

  // ── Organization & Reflection ────────────────────────────────
  {
    slug: 'tagging-conversations',
    title: 'Tagging Your Conversations',
    description: 'Organize your work with tags for easy filtering and review.',
    category: 'Organization & Reflection',
    audience: ['student'],
    videoUrl: '',
    duration: '1:15',
    order: 7,
    transcript: `Tags help you organize your AI conversations by topic, assignment, or purpose. In any chat, click the tag icon to add tags. You can create new tags or choose existing ones. Later, use the filter options in your project list to find conversations by tag. Your instructor can also see tags, which helps them understand how you're using AI across different assignments.`,
  },
  {
    slug: 'writing-reflections',
    title: 'Writing Reflections',
    description: 'Add thoughtful reflections to your AI conversations for deeper learning.',
    category: 'Organization & Reflection',
    audience: ['student'],
    videoUrl: '',
    duration: '1:45',
    order: 8,
    transcript: `Reflections let you pause and think critically about your AI interactions. After an important conversation, click "Add Reflection" to write about what you learned, what surprised you, or how you plan to apply the insights. Reflections are visible to your instructor and show that you're engaging thoughtfully with AI — not just copying answers.`,
  },

  // ── For Instructors ──────────────────────────────────────────
  {
    slug: 'creating-a-course',
    title: 'Creating a Course',
    description: 'Set up a new course and generate a join code for students.',
    category: 'For Instructors',
    audience: ['instructor'],
    videoUrl: '',
    duration: '2:00',
    order: 9,
    transcript: `From the Instructor Dashboard, click "Create Course." Fill in the course title, code, and description. Once created, you'll get a unique join code to share with your students. You can also customize course settings, manage the library, and set up announcements before students start joining.`,
  },
  {
    slug: 'reviewing-student-activity',
    title: 'Reviewing Student Activity',
    description: 'Monitor AI usage patterns and review student conversations.',
    category: 'For Instructors',
    audience: ['instructor'],
    videoUrl: '',
    duration: '2:15',
    order: 10,
    transcript: `The course overview gives you a snapshot of student engagement — how many conversations, which models they're using, and recent activity. Click into any student to see their projects and conversations. You can read their AI interactions, check their reflections, and add private instructor notes. The analytics dashboard provides deeper insights with charts showing usage trends over time.`,
  },
  {
    slug: 'managing-enrollments',
    title: 'Managing Enrollments & Roles',
    description: 'Approve students, assign roles, and manage your course roster.',
    category: 'For Instructors',
    audience: ['instructor'],
    videoUrl: '',
    duration: '1:45',
    order: 11,
    transcript: `When students request to join your course, you'll see pending approvals on your dashboard. Review each request and approve or deny. You can also change student roles — promote a student to Student Assistant or Teaching Assistant to give them additional permissions like viewing peer projects or accessing instructor tools.`,
  },
  {
    slug: 'using-the-library',
    title: 'Managing the Course Library',
    description: 'Upload resources and materials for your students to access.',
    category: 'For Instructors',
    audience: ['instructor'],
    videoUrl: '',
    duration: '1:30',
    order: 12,
    transcript: `The Library is where you share course materials with students. Go to Library Management in your course sidebar. You can upload documents, add links, and organize resources by topic. Students see these in their Library view and can reference them during AI conversations. It's a great way to ensure students have access to approved course materials.`,
  },
];

// Derive categories from the data
export const categories = [...new Set(tutorials.map(t => t.category))];

// Derive audience labels
export const audienceLabels = {
  student: 'Students',
  instructor: 'Instructors',
  admin: 'Admins',
};

export default tutorials;
