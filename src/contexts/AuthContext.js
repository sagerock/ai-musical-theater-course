import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Get user role from Supabase
async function getUserRole(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return 'student'; // Default to student
    }

    return data?.role || 'student';
  } catch (error) {
    console.error('Failed to get user role:', error);
    return 'student';
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  async function signup(email, password, displayName, role = 'student') {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name in Firebase
      await updateProfile(result.user, {
        displayName: displayName
      });

      // Sync user to Supabase
      await syncUserToSupabase(result.user, role, displayName);
      
      toast.success('Account created successfully!');
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Login with email and password
  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Login with Google
  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Supabase, if not create them
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', result.user.uid)
        .single();

      if (!existingUser) {
        await syncUserToSupabase(result.user, 'student');
      }
      
      toast.success('Logged in with Google successfully!');
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Logout
  async function logout() {
    try {
      await signOut(auth);
      setUserRole(null);
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Sync user data to Supabase
  async function syncUserToSupabase(user, role = 'student', displayName = null) {
    try {
      const userData = {
        id: user.uid,
        email: user.email,
        name: displayName || user.displayName || user.email.split('@')[0],
        role: role
      };

      const { error } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'id' });

      if (error) {
        console.error('Error syncing user to Supabase:', error);
        throw error;
      }

      setUserRole(role);
    } catch (error) {
      console.error('Failed to sync user to Supabase:', error);
      throw error;
    }
  }


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Get user role from Supabase
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    loginWithGoogle,
    logout,
    syncUserToSupabase
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}