# React Architecture Guide

## Overview
This project uses React 18 with modern patterns including hooks, context, and functional components throughout.

## Project Structure

### Component Organization
```
src/components/
├── Admin/           # Admin-specific components
├── Auth/           # Authentication forms
├── Chat/           # AI chat interface
├── Course/         # Course management
├── Dashboard/      # User dashboards
├── Help/           # Help and support
├── Home/           # Landing and public pages
├── Instructor/     # Instructor tools
├── Layout/         # Layout components
├── Messaging/      # Communication features
├── Privacy/        # Privacy policy and settings
├── Projects/       # Project management
├── Settings/       # User settings
└── Testing/        # Development testing components
```

## Key Architectural Patterns

### Context API Usage
**File**: `src/contexts/AuthContext.js`

#### Authentication Context
```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### React Router Implementation
**File**: `src/App.js`

#### Route Structure
```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/instructor" element={<InstructorRoute><InstructorDashboard /></InstructorRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Protected Route Pattern
```javascript
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}
```

## State Management Patterns

### Local State with useState
```javascript
import { useState, useEffect } from 'react';

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  
  // Component logic
}
```

### Effect Cleanup Pattern
```javascript
useEffect(() => {
  let mounted = true;
  
  const fetchData = async () => {
    try {
      const data = await apiCall();
      if (mounted) {
        setData(data);
      }
    } catch (error) {
      if (mounted) {
        setError(error);
      }
    }
  };
  
  fetchData();
  
  return () => {
    mounted = false;
  };
}, [dependency]);
```

### Firestore Real-time Listeners
```javascript
useEffect(() => {
  if (!courseId) return;
  
  const unsubscribe = firebaseApi.listenToChats(courseId, (chats) => {
    setChats(chats);
    setLoading(false);
  });
  
  return () => unsubscribe();
}, [courseId]);
```

## Component Patterns

### Functional Components with Hooks
```javascript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function ComponentName({ prop1, prop2 }) {
  const { user } = useAuth();
  const [localState, setLocalState] = useState('');
  
  const handleAction = useCallback(async () => {
    // Action logic
  }, [dependency]);
  
  useEffect(() => {
    // Side effects
  }, []);
  
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  );
}

export default ComponentName;
```

### Error Boundary Implementation
**File**: `src/ErrorBoundary.js`

```javascript
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    
    return this.props.children;
  }
}
```

## UI Component Patterns

### Modal Pattern with Headless UI
```javascript
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

function Modal({ isOpen, onClose, title, children }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>
        
        <div className="fixed inset-0 overflow-y-auto">
          <Dialog.Panel className="modal-content">
            <Dialog.Title>{title}</Dialog.Title>
            {children}
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### Form Handling Pattern
```javascript
function FormComponent() {
  const [formData, setFormData] = useState({
    field1: '',
    field2: ''
  });
  
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall(formData);
      // Success handling
    } catch (error) {
      // Error handling
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="field1"
        value={formData.field1}
        onChange={handleChange}
      />
    </form>
  );
}
```

## Performance Optimizations

### React.memo for Component Memoization
```javascript
import { memo } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Component logic
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});
```

### useCallback and useMemo
```javascript
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  handleAction(data);
}, [data]);
```

## Testing Considerations

### Component Testing Setup
- Uses React Testing Library patterns
- Test files co-located with components
- Focus on user interactions over implementation details

### Example Test Pattern
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Component from './Component';

test('renders component correctly', () => {
  render(<Component prop="value" />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

This React architecture provides a solid foundation for educational applications with clear separation of concerns, reusable patterns, and maintainable code structure.