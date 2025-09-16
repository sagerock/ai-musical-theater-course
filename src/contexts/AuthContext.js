import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updateEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isInstructorAnywhere, setIsInstructorAnywhere] = useState(false);
  const [isSchoolAdministrator, setIsSchoolAdministrator] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log('🔥 AuthProvider render:', {
    currentUser: currentUser?.uid,
    email: currentUser?.email,
    userRole,
    isInstructorAnywhere,
    isSchoolAdministrator,
    loading
  });

  // Authentication functions
  const signUp = async (email, password, displayName) => {
    console.log('🔥 SignUp attempt:', email, displayName);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    if (displayName) {
      await firebaseUpdateProfile(user, { displayName });
    }
    
    // Check if this is the designated admin email
    const isDesignatedAdmin = email === 'sage+admin@sagerock.com';
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email: user.email,
      name: displayName || user.email.split('@')[0],
      role: isDesignatedAdmin ? 'admin' : 'student', // Admin role for designated email
      isGlobalAdmin: isDesignatedAdmin,
      emailNotificationsEnabled: true,
      instructorNoteEmails: true,
      newProjectEmails: true,
      weeklyReminderEmails: true,
      systemUpdateEmails: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (isDesignatedAdmin) {
      console.log('✅ Admin user created successfully:', user.uid);
    } else {
      console.log('✅ User created successfully:', user.uid);
    }
    
    return userCredential;
  };

  const signIn = async (email, password) => {
    console.log('🔥 SignIn attempt:', email);
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Backward compatibility aliases
  const login = signIn;
  const signup = signUp;

  const logout = async () => {
    console.log('🔥 Logout initiated');
    return signOut(auth);
  };

  const resetPassword = async (email) => {
    console.log('🔥 Password reset requested for:', email);
    return sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (updates) => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    console.log('🔥 Profile update requested:', updates);

    try {
      // Handle display name updates
      if (updates.display_name || updates.displayName) {
        const displayName = updates.display_name || updates.displayName;
        await firebaseUpdateProfile(auth.currentUser, { displayName });

        // Also update the Firestore user document
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          name: displayName,
          updatedAt: new Date()
        }, { merge: true });

        // Update the currentUser state with the new name
        setCurrentUser(prev => ({
          ...prev,
          name: displayName,
          displayName: displayName
        }));

        console.log('✅ Display name updated successfully');
      }

      // Handle email updates
      if (updates.email) {
        await updateEmail(auth.currentUser, updates.email);

        // Update the Firestore user document
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          email: updates.email,
          updatedAt: new Date()
        }, { merge: true });

        // Update the currentUser state with the new email
        setCurrentUser(prev => ({
          ...prev,
          email: updates.email
        }));

        console.log('✅ Email updated successfully');
      }

    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
  };

  const promoteToAdmin = async (email) => {
    try {
      console.log('🔥 Promoting user to admin:', email);
      
      if (email === 'sage+admin@sagerock.com') {
        // Update the current user to admin if it's the designated admin email
        if (auth.currentUser && auth.currentUser.email === email) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            id: auth.currentUser.uid,
            email: auth.currentUser.email,
            name: auth.currentUser.displayName || 'Admin',
            role: 'admin',
            isGlobalAdmin: true,
            emailNotificationsEnabled: true,
            instructorNoteEmails: true,
            newProjectEmails: true,
            weeklyReminderEmails: true,
            systemUpdateEmails: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log('✅ User promoted to admin successfully');
          return true;
        }
      }
      
      throw new Error('Only sage+admin@sagerock.com can be promoted to admin');
    } catch (error) {
      console.error('❌ Error promoting to admin:', error);
      throw error;
    }
  };

  // Fetch user role from Firestore with retry logic
  const fetchUserRole = async (userId, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 Fetching user role for: ${userId} (attempt ${attempt}/${retries})`);
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role || 'student';
          console.log('✅ User role fetched:', role);
          return role;
        } else {
          console.log('⚠️ User document not found, defaulting to student');
          return 'student';
        }
      } catch (error) {
        console.error(`❌ Error fetching user role (attempt ${attempt}/${retries}):`, error);
        
        // If it's a network error and we have retries left, wait and try again
        if (attempt < retries && (error.code === 'unavailable' || error.message?.includes('offline'))) {
          console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        // Final fallback
        console.log('🔄 Using fallback role: student');
        return 'student';
      }
    }
    return 'student';
  };

  // Check if user has teaching permissions in any course with retry logic
  const checkInstructorStatus = async (userId, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 Checking teaching permissions for: ${userId} (attempt ${attempt}/${retries})`);
        
        // Get all user's course memberships
        const membershipsQuery = query(
          collection(db, 'courseMemberships'),
          where('userId', '==', userId),
          where('status', '==', 'approved')
        );
        
        const membershipsSnapshot = await getDocs(membershipsQuery);
        
        // Import roleUtils to check for teaching permissions
        const { hasTeachingPermissions } = await import('../utils/roleUtils');
        
        // Check if user has teaching permissions in any course
        const hasTeachingRole = membershipsSnapshot.docs.some(doc => {
          const membership = doc.data();
          return hasTeachingPermissions(membership.role);
        });
        
        console.log('✅ Teaching permissions status:', hasTeachingRole);
        return hasTeachingRole;
      } catch (error) {
        console.error(`❌ Error checking instructor status (attempt ${attempt}/${retries}):`, error);
        
        // If it's a network error and we have retries left, wait and try again
        if (attempt < retries && (error.code === 'unavailable' || error.message?.includes('offline'))) {
          console.log(`⏳ Retrying instructor check in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        // Final fallback
        console.log('🔄 Using fallback instructor status: false');
        return false;
      }
    }
    return false;
  };

  // Auth state change handler
  useEffect(() => {
    console.log('🔥 Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Auth state changed:', user ? user.uid : 'signed out');
      
      if (user) {
        // First get the Firestore user document to get the full user data
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let userData = {};

          if (userDoc.exists()) {
            userData = userDoc.data();
            console.log('🔥 Loaded Firestore user data:', userData);
          } else {
            console.log('⚠️ No Firestore user document found for:', user.uid);
          }

          // Map Firebase user to include both uid and id for backward compatibility
          // and merge with Firestore user data
          const mappedUser = {
            ...user,
            id: user.uid, // Add id property for components that expect it
            uid: user.uid, // Keep uid for backward compatibility
            name: userData.name || user.displayName || user.email?.split('@')[0], // Use Firestore name, then displayName, then email prefix
            email: user.email,
            role: userData.role || 'student',
            ...userData // Merge any additional fields from Firestore
          };

          console.log('🔥 Final mappedUser object:', {
            uid: mappedUser.uid,
            email: mappedUser.email,
            name: mappedUser.name,
            displayName: mappedUser.displayName
          });

          setCurrentUser(mappedUser);
        } catch (error) {
          console.error('Error loading user data from Firestore:', error);
          // Fallback to basic user object if Firestore fails
          const mappedUser = {
            ...user,
            id: user.uid,
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0]
          };
          setCurrentUser(mappedUser);
        }
        
        // Check if this is the designated admin email and auto-promote if needed
        if (user.email === 'sage+admin@sagerock.com') {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists() || userDoc.data().role !== 'admin') {
              console.log('🔥 Auto-promoting designated admin user:', user.email);
              await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                email: user.email,
                name: user.displayName || 'Admin',
                role: 'admin',
                isGlobalAdmin: true,
                emailNotificationsEnabled: true,
                instructorNoteEmails: true,
                newProjectEmails: true,
                weeklyReminderEmails: true,
                systemUpdateEmails: true,
                createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date(),
                updatedAt: new Date()
              });
              console.log('✅ Admin user auto-promoted successfully');
            }
          } catch (error) {
            console.error('❌ Error auto-promoting admin user:', error);
          }
        }
        
        // Fetch user role and instructor status
        try {
          const [role, isInstructor] = await Promise.all([
            fetchUserRole(user.uid),
            checkInstructorStatus(user.uid)
          ]);
          
          setUserRole(role);
          setIsInstructorAnywhere(isInstructor);
          setIsSchoolAdministrator(role === 'school_administrator');
          
          console.log('✅ User data loaded:', { role, isInstructor, isSchoolAdmin: role === 'school_administrator' });
        } catch (error) {
          console.error('❌ Error loading user data:', error);
          setUserRole('student');
          setIsInstructorAnywhere(false);
          setIsSchoolAdministrator(false);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setIsInstructorAnywhere(false);
        setIsSchoolAdministrator(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    isInstructorAnywhere,
    isSchoolAdministrator,
    loading,
    signUp,
    signIn,
    login, // Backward compatibility alias
    signup, // Backward compatibility alias
    logout,
    resetPassword,
    updateProfile,
    promoteToAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}