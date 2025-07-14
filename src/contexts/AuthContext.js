import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { supabase } from '../config/supabase';
import { courseApi } from '../services/supabaseApi';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Get user role from Supabase (prioritize highest role)
async function getUserRole(userId) {
  try {
    // First check global role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError);
      return 'student';
    }

    const globalRole = userData?.role || 'student';
    
    // If they're a global admin, that takes priority
    if (globalRole === 'admin') {
      return 'admin';
    }
    
    // Check if they're an instructor in any course
    const { data: instructorMemberships, error: memberError } = await supabase
      .from('course_memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'instructor')
      .eq('status', 'approved')
      .limit(1);

    if (!memberError && instructorMemberships && instructorMemberships.length > 0) {
      return 'instructor';
    }
    
    // Fall back to global role or student
    return globalRole;
  } catch (error) {
    console.error('Failed to get user role:', error);
    return 'student';
  }
}

// Check if user is an instructor in any course
async function checkInstructorStatus(userId) {
  try {
    console.log('🔍 AuthContext: Checking instructor status for user:', userId);
    
    const { data, error } = await supabase
      .from('course_memberships')
      .select('role, status, course_id')
      .eq('user_id', userId)
      .eq('role', 'instructor')
      .eq('status', 'approved');

    if (error) {
      console.error('❌ Error checking instructor status:', error);
      return false;
    }

    console.log('📊 AuthContext: Found instructor memberships:', data);
    return data && data.length > 0;
  } catch (error) {
    console.error('❌ Failed to check instructor status:', error);
    return false;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isInstructorAnywhere, setIsInstructorAnywhere] = useState(false);
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

  // Reset password
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
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

      // Set Supabase auth to match Firebase UID
      await setSupabaseAuth(user.uid);

      setUserRole(role);
    } catch (error) {
      console.error('Failed to sync user to Supabase:', error);
      throw error;
    }
  }

  // Set Supabase authentication using Firebase UID
  async function setSupabaseAuth(firebaseUid) {
    try {
      // Get Firebase ID token
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        
        // Use Firebase token to authenticate with Supabase
        // Note: This requires custom JWT verification in Supabase
        // For now, we'll use a simpler approach
        
        // Set a custom session that includes the Firebase UID
        await supabase.auth.signInAnonymously();
        
        // Store Firebase UID in local storage for API calls
        localStorage.setItem('firebase_uid', firebaseUid);
      }
    } catch (error) {
      console.error('Failed to set Supabase auth:', error);
    }
  }

  // Update user role (admin function)
  async function updateUserRole(userId, newRole) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }

      // If updating current user's role, refresh it
      if (userId === currentUser?.uid) {
        setUserRole(newRole);
      }

      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
      throw error;
    }
  }

  // Refresh user role and instructor status
  async function refreshUserStatus() {
    if (currentUser) {
      console.log('🔄 AuthContext: Refreshing user status for:', currentUser.uid);
      
      const role = await getUserRole(currentUser.uid);
      console.log('📊 AuthContext: User role:', role);
      setUserRole(role);
      
      const instructorStatus = await checkInstructorStatus(currentUser.uid);
      console.log('👨‍🏫 AuthContext: Instructor status:', instructorStatus);
      setIsInstructorAnywhere(instructorStatus);
      
      console.log('✅ AuthContext: User status refresh complete');
    }
  }


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Set Supabase auth to match Firebase UID
        await setSupabaseAuth(user.uid);
        
        // Get user role from Supabase
        const role = await getUserRole(user.uid);
        setUserRole(role);
        
        // Check if user is an instructor in any course
        const instructorStatus = await checkInstructorStatus(user.uid);
        setIsInstructorAnywhere(instructorStatus);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setIsInstructorAnywhere(false);
        
        // Clear Supabase auth when Firebase user logs out
        await supabase.auth.signOut();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    isInstructorAnywhere,
    signup,
    login,
    loginWithGoogle,
    resetPassword,
    logout,
    syncUserToSupabase,
    updateUserRole,
    refreshUserStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}