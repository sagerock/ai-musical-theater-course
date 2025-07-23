import React, { createContext, useContext, useState, useEffect } from 'react';
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
    console.log('🔍 getUserRole: Querying for userId:', userId);
    // First check global role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    console.log('🔍 getUserRole: Database response:', { userData, userError });

    if (userError) {
      console.error('❌ Error fetching user role:', userError);
      return 'student';
    }

    const globalRole = userData?.role || 'student';
    console.log('🔍 getUserRole: Extracted role:', globalRole);
    
    // If they're a global admin, that takes priority
    if (globalRole === 'admin') {
      console.log('✅ getUserRole: Returning admin role');
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

// Sync user data to users table after authentication
async function syncUserToSupabase(user, role = 'student', displayName = null) {
  try {
    console.log('🔄 Syncing user to Supabase:', user.id, user.email);
    const name = displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
    
    // First check if user already exists and has a role
    const { data: existingUser } = await supabase
      .from('users')
      .select('role, is_global_admin')
      .eq('id', user.id)
      .single();
    
    // Role assignment logic:
    // 1. If user is already admin, keep admin role
    // 2. If new role is admin or instructor, use it (allows elevation)
    // 3. Otherwise use existing role, or default to student
    let finalRole = role; // Start with requested role
    
    if (existingUser?.role === 'admin') {
      // Always preserve admin role
      finalRole = 'admin';
    } else if (existingUser && role === 'student' && existingUser.role !== 'student') {
      // Don't downgrade existing instructor/admin to student unless explicitly requested
      finalRole = existingUser.role;
    }
    
    const isAdmin = existingUser?.is_global_admin || finalRole === 'admin';
    
    console.log('🔍 Existing user role:', existingUser?.role, '-> Final role:', finalRole);
    
    const userData = {
      id: user.id, // Supabase auth UID
      name: name,
      email: user.email,
      role: finalRole,
      is_global_admin: isAdmin,
    };
    
    console.log('📝 User data to upsert:', userData);
    
    try {
      // Try to insert the user first
      console.log('🔄 Attempting to insert user...');
      const { error: insertError } = await supabase
        .from('users')
        .insert(userData);
      
      if (!insertError) {
        console.log('✅ User inserted successfully');
        return;
      }
      
      // If we get a duplicate key error, try to update instead
      if (insertError.code === '23505') {
        console.log('🔄 User exists, attempting update...');
        
        // Try updating by ID first
        const { error: updateByIdError } = await supabase
          .from('users')
          .update({
            name: userData.name,
            role: userData.role,
            is_global_admin: userData.is_global_admin
          })
          .eq('id', userData.id);
        
        if (!updateByIdError) {
          console.log('✅ User updated by ID successfully');
          return;
        }
        
        // If that fails, try updating by email
        console.log('🔄 Update by ID failed, trying update by email...');
        const { error: updateByEmailError } = await supabase
          .from('users')
          .update({
            id: userData.id,  // Update the ID to match auth user
            name: userData.name,
            role: userData.role,
            is_global_admin: userData.is_global_admin
          })
          .eq('email', userData.email);
        
        if (!updateByEmailError) {
          console.log('✅ User updated by email successfully');
          return;
        }
        
        console.warn('⚠️ Both update methods failed, but user likely exists');
      } else {
        console.error('❌ Unexpected error during user insert:', insertError);
        throw insertError;
      }
    } catch (error) {
      console.error('❌ User sync operation failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('❌ Failed to sync user to Supabase:', error);
    // Don't re-throw - we want auth to continue even if sync fails
    console.warn('⚠️ Continuing auth initialization despite sync failure');
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
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            display_name: displayName,
            role: role
          }
        }
      });

      if (error) throw error;

      // Sync user to users table
      if (data.user) {
        await syncUserToSupabase(data.user, role, displayName);
      }
      
      toast.success('Account created successfully! Please check your email to verify your account.');
      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Login with email and password
  async function login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      toast.success('Logged in successfully!');
      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Logout
  async function logout() {
    try {
      console.log('🚪 Starting logout process...');
      
      // Try normal logout first
      const { error } = await supabase.auth.signOut();
      
      // If we get AuthSessionMissingError, clear everything manually
      if (error && error.message.includes('Auth session missing')) {
        console.warn('⚠️ Auth session missing during logout, clearing manually');
        
        // Clear all auth-related storage
        localStorage.removeItem('sb-qbkpxtrnseghzsrvqhih-auth-token');
        sessionStorage.clear();
        
        // Clear auth state manually
        setCurrentUser(null);
        setUserRole(null);
        setIsInstructorAnywhere(false);
        
        toast.success('Logged out successfully!');
        
        // Force page reload to ensure clean state
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
        
        return;
      }
      
      if (error) throw error;
      
      setCurrentUser(null);
      setUserRole(null);
      setIsInstructorAnywhere(false);
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Fallback: force logout even if there's an error
      localStorage.removeItem('sb-qbkpxtrnseghzsrvqhih-auth-token');
      sessionStorage.clear();
      setCurrentUser(null);
      setUserRole(null);
      setIsInstructorAnywhere(false);
      
      toast.success('Logged out successfully!');
      
      // Force navigation to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      console.log('Reset password redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) throw error;
      
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Resend email verification
  async function resendVerificationEmail() {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: currentUser.email
      });

      if (error) throw error;
      
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Update password
  async function updatePassword(password) {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success('Password updated successfully!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Update profile
  async function updateProfile(updates) {
    try {
      console.log('🔄 Updating profile with:', updates);
      
      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;

      // Also update the users table
      if (currentUser) {
        const dbUpdates = {};
        
        // Map display_name to name field in database
        if (updates.display_name) {
          dbUpdates.name = updates.display_name;
        }
        
        // Map other fields
        if (updates.email) {
          dbUpdates.email = updates.email;  
        }
        
        console.log('📝 Database updates:', dbUpdates);
        
        const { error: dbError } = await supabase
          .from('users')
          .update(dbUpdates)
          .eq('id', currentUser.id);

        if (dbError) {
          console.error('Error updating user profile in database:', dbError);
          throw dbError;
        } else {
          console.log('✅ Database profile updated successfully');
          
          // Refresh the current user data from both auth and database
          const { data: { user }, error: refreshError } = await supabase.auth.getUser();
          if (!refreshError && user) {
            console.log('🔄 Refreshing current user data');
            
            // Get updated user data from database
            const { data: dbUser, error: dbUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (!dbUserError && dbUser) {
              // Merge auth user with database user data
              const updatedUser = {
                ...user,
                name: dbUser.name,
                role: dbUser.role,
                is_global_admin: dbUser.is_global_admin
              };
              console.log('🔄 Updated user with database data:', updatedUser.name);
              setCurrentUser(updatedUser);
            } else {
              setCurrentUser(user);
            }
          }
        }
      }
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log('🔄 AuthContext: Initializing auth...');
        
        // Check for existing session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setCurrentUser(null);
            setUserRole(null);
            setIsInstructorAnywhere(false);
            setLoading(false);
          }
          return;
        }

        console.log('📋 Initial session check:', session?.user?.id ? 'User found' : 'No user');
        
        if (session?.user && mounted) {
          const user = session.user;
          setCurrentUser(user);
          
          // Sync user to public.users table if needed (non-blocking)
          console.log('🔄 Starting user sync (non-blocking)...');
          syncUserToSupabase(user, 'student')
            .then(() => console.log('✅ User sync completed'))
            .catch(error => console.warn('⚠️ User sync failed:', error.message));
          
          // Fetch user role from database (non-blocking)
          console.log('🔍 AuthContext: Fetching user role from database...');
          getUserRole(user.id)
            .then(role => {
              console.log('✅ AuthContext: Role fetched successfully:', role);
              setUserRole(role);
              return checkInstructorStatus(user.id);
            })
            .then(isInstructor => {
              console.log('✅ AuthContext: Instructor status fetched:', isInstructor);
              setIsInstructorAnywhere(isInstructor);
            })
            .catch(error => {
              console.warn('⚠️ Role fetch failed, using default:', error.message);
              setUserRole('student');
              setIsInstructorAnywhere(false);
            });
          
          console.log('✅ User restored from session:', user.email, 'Role will be fetched...');
        }
        
        if (mounted) {
          setLoading(false);
          console.log('✅ Auth initialization complete - setting loading to false');
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        if (mounted) {
          setCurrentUser(null);
          setUserRole(null);
          setIsInstructorAnywhere(false);
          setLoading(false);
          console.log('❌ Auth initialization failed - setting loading to false', 'Current User ID:', currentUser?.id);
        }
      }
    }

    // Initialize auth immediately
    initializeAuth();

    // Listen for ongoing auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔐 Auth state changed:', event, session?.user?.id);
        
        try {
          if (session?.user) {
            const user = session.user;
            setCurrentUser(user);
            
            // Sync user to public.users table if needed (non-blocking)
            console.log('🔄 Starting user sync via state change (non-blocking)...');
            syncUserToSupabase(user, 'student')
              .then(() => console.log('✅ User sync completed via state change'))
              .catch(error => console.warn('⚠️ User sync failed via state change:', error.message));
            
            // Fetch user role from database (non-blocking)
            console.log('🔍 AuthContext: Fetching user role from database (state change)...');
            getUserRole(user.id)
              .then(role => {
                console.log('✅ AuthContext: Role fetched successfully (state change):', role);
                setUserRole(role);
                return checkInstructorStatus(user.id);
              })
              .then(isInstructor => {
                console.log('✅ AuthContext: Instructor status fetched (state change):', isInstructor);
                setIsInstructorAnywhere(isInstructor);
              })
              .catch(error => {
                console.warn('⚠️ Role fetch failed (state change), using default:', error.message);
                setUserRole('student');
                setIsInstructorAnywhere(false);
              });
            
            console.log('✅ User authenticated via state change:', user.email, 'Role will be fetched...');
          } else {
            setCurrentUser(null);
            setUserRole(null);
            setIsInstructorAnywhere(false);
            console.log('🚪 User signed out via state change');
          }
        } catch (error) {
          console.error('❌ Error in auth state change handler:', error);
          // Still set loading to false even if there's an error
        } finally {
          // Always set loading to false, regardless of success or error
          setLoading(false);
          console.log('🔐 Auth state change processed - setting loading to false', 'Session User ID:', session?.user?.id);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    isInstructorAnywhere,
    signup,
    login,
    logout,
    resetPassword,
    resendVerificationEmail,
    updatePassword,
    updateProfile
  };

  // Debug AuthProvider render
  console.log('🔍 AuthProvider render:', {
    loading,
    currentUser: currentUser?.id,
    userRole,
    isInstructorAnywhere,
    renderingChildren: !loading
  });

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
