// Temporary simplified AuthContext for debugging
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './config/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const [isInstructorAnywhere, setIsInstructorAnywhere] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 DEBUG AuthContext: Starting simple auth check...');
    
    async function initAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ DEBUG: Session error:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ DEBUG: Found user:', session.user.email);
          setCurrentUser(session.user);
          setUserRole('student'); // Default role
          setIsInstructorAnywhere(false); // Default
        } else {
          console.log('ℹ️ DEBUG: No user found');
          setCurrentUser(null);
        }
        
        setLoading(false);
        console.log('✅ DEBUG: Auth initialization complete');
        
      } catch (error) {
        console.error('❌ DEBUG: Auth initialization failed:', error);
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  // Simplified functions (no actual functionality for debugging)
  const signup = async () => { throw new Error('Debug mode - signup disabled'); };
  const login = async () => { throw new Error('Debug mode - login disabled'); };
  const logout = async () => { 
    await supabase.auth.signOut();
    setCurrentUser(null);
  };
  const resetPassword = async () => { throw new Error('Debug mode - reset disabled'); };
  const updatePassword = async () => { throw new Error('Debug mode - update disabled'); };
  const updateProfile = async () => { throw new Error('Debug mode - profile disabled'); };

  const value = {
    currentUser,
    userRole,
    isInstructorAnywhere,
    signup,
    login,
    logout,
    resetPassword,
    updatePassword,
    updateProfile
  };

  console.log('🔄 DEBUG: AuthProvider rendering, loading:', loading, 'user:', currentUser?.email);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}