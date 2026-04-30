import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const ADMIN_EMAIL = 'sage+admin@sagerock.com'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [isInstructorAnywhere, setIsInstructorAnywhere] = useState(false)
  const [isSchoolAdministrator, setIsSchoolAdministrator] = useState(false)
  const [hasSemesterAccess, setHasSemesterAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  // ---- Auth functions ----

  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: displayName || email.split('@')[0] } }
    })
    if (error) throw error

    // The handle_new_user trigger creates the users row automatically.
    // Promote admin email immediately after sign-up.
    if (email === ADMIN_EMAIL && data.user) {
      await supabase.from('users')
        .update({ role: 'admin' })
        .eq('id', data.user.id)
    }

    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const login = signIn    // backward compat alias
  const signup = signUp   // backward compat alias

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    if (error) throw error
  }

  const updateProfile = async (updates) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const dbUpdates = { updated_at: new Date().toISOString() }

    if (updates.display_name || updates.displayName) {
      dbUpdates.name = updates.display_name || updates.displayName
    }

    if (updates.email) {
      const { error } = await supabase.auth.updateUser({ email: updates.email })
      if (error) throw error
      dbUpdates.email = updates.email
    }

    const { error } = await supabase.from('users').update(dbUpdates).eq('id', user.id)
    if (error) throw error

    setCurrentUser(prev => ({ ...prev, ...dbUpdates }))
  }

  const promoteToAdmin = async (email) => {
    if (email !== ADMIN_EMAIL) {
      throw new Error('Only sage+admin@sagerock.com can be promoted to admin')
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== email) throw new Error('User not authenticated')
    const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', user.id)
    if (error) throw error
    return true
  }

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userData) {
      setCurrentUser(prev => ({ ...prev, ...userData }))
      setHasSemesterAccess(checkSemesterAccess(userData))
    }
  }

  // ---- Helpers ----

  const checkSemesterAccess = (userData) => {
    if (!userData?.semester_end_date) return false
    return new Date(userData.semester_end_date) > new Date()
  }

  const loadUserState = async (session) => {
    if (!session?.user) {
      setCurrentUser(null)
      setUserRole(null)
      setIsInstructorAnywhere(false)
      setIsSchoolAdministrator(false)
      setHasSemesterAccess(false)
      setLoading(false)
      return
    }

    const user = session.user

    try {
      // Load user profile from users table
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Auto-promote admin email
      if (user.email === ADMIN_EMAIL && userData?.role !== 'admin') {
        await supabase.from('users').update({ role: 'admin' }).eq('id', user.id)
        if (userData) userData.role = 'admin'
      }

      const role = userData?.role || 'student'

      // Check if user has teaching role in any course
      const { data: teachingMemberships } = await supabase
        .from('course_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .in('role', ['instructor', 'teaching_assistant'])

      const isInstructor = (teachingMemberships?.length > 0) ||
        role === 'instructor' || role === 'admin'

      setCurrentUser({
        ...user,
        id: user.id,
        uid: user.id,  // backward compat
        name: userData?.name || user.email?.split('@')[0],
        email: user.email,
        role,
        ...(userData || {})
      })
      setUserRole(role)
      setIsInstructorAnywhere(isInstructor)
      setIsSchoolAdministrator(role === 'school_administrator')
      setHasSemesterAccess(checkSemesterAccess(userData))
    } catch (error) {
      console.error('Error loading user state:', error)
      setCurrentUser({ ...user, id: user.id, uid: user.id, role: 'student' })
      setUserRole('student')
      setIsInstructorAnywhere(false)
      setIsSchoolAdministrator(false)
      setHasSemesterAccess(false)
    }

    setLoading(false)
  }

  // ---- Auth state listener ----

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserState(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadUserState(session)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    currentUser,
    userRole,
    isInstructorAnywhere,
    isSchoolAdministrator,
    hasSemesterAccess,
    loading,
    signUp,
    signIn,
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
    promoteToAdmin,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
