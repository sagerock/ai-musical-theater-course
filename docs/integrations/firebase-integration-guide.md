# Firebase Integration Guide

## Overview
This project uses Firebase 12 as the primary backend service, providing authentication, database, and storage capabilities.

## Current Firebase Services

### Authentication (`firebase/auth`)
- Email/password authentication
- Password reset functionality
- Role-based access control (student, instructor, admin)
- Session persistence

**Key Files:**
- `src/contexts/AuthContext.js` - Authentication context and state management
- `src/config/firebase.js` - Firebase configuration

### Firestore Database (`firebase/firestore`)
- Real-time NoSQL database
- Collections: users, chats, projects, courses, course_memberships
- Security rules defined in `firestore.rules`

**Key Files:**
- `src/services/firebaseApi.js` - Database operations API layer
- `firestore.rules` - Security rules
- `firestore.indexes.json` - Database indexes

### Firebase Storage (`firebase/storage`)
- File upload and storage for PDFs and images
- Storage rules defined in `storage.rules`

**Key Files:**
- `storage.rules` - Storage security rules

## Architecture Benefits
- **Single Provider**: Simplified from dual Firebase/Supabase to Firebase-only
- **Real-time Updates**: Firestore listeners for live data synchronization
- **Unified Authentication**: Single auth system across all services
- **Security Rules**: Declarative access control at the database level

## Environment Variables Required
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Common Patterns in This Codebase

### Authentication Context Usage
```javascript
import { useAuth } from '../contexts/AuthContext';

function Component() {
  const { user, loading, signIn, signOut } = useAuth();
  // Component logic
}
```

### Firestore Operations
```javascript
import { firebaseApi } from '../services/firebaseApi';

// Create document
await firebaseApi.createChat(chatData);

// Read with real-time listener
const unsubscribe = firebaseApi.listenToChats(courseId, (chats) => {
  setChats(chats);
});
```

### Error Handling
- All Firebase operations include try/catch blocks
- User-friendly error messages via react-hot-toast
- Proper cleanup of Firestore listeners

## Migration Notes
- **Completed**: January 24, 2025 migration from dual Firebase/Supabase to Firebase-only
- **Removed**: All Supabase dependencies and dual API routing
- **Result**: Simplified codebase with single source of truth