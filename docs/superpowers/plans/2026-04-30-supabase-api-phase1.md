# Supabase API Phase 1 — Auth, Users, Courses, Projects

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Firebase Auth and Firestore with Supabase for the core app layer — authentication, user profiles, courses, memberships, and projects — so the app runs end-to-end against Supabase on a preview branch.

**Architecture:** A new `supabase-migration` git branch holds all changes. A new `src/lib/supabaseClient.js` provides the singleton client. `AuthContext.js` is rewritten against Supabase Auth. A new `src/services/supabaseApi.js` exports `userApi`, `courseApi`, and `projectApi` with identical method signatures to `firebaseApi.js` so all components work without changes.

**Tech Stack:** `@supabase/supabase-js`, React 18, Supabase project `dplaqxqnczmnxkuccsph` (us-east-2)

**Supabase project details:**
- Project ID: `dplaqxqnczmnxkuccsph`
- URL: `https://dplaqxqnczmnxkuccsph.supabase.co`
- Anon key: `sb_publishable_FEH-PIMBo5VR_uM7AwFb-g_nRPL85V3`
- Dashboard: https://supabase.com/dashboard/project/dplaqxqnczmnxkuccsph

**Admin email:** `sage+admin@sagerock.com` — auto-promoted to role='admin' on sign-up/sign-in.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/supabaseClient.js` | Create | Supabase singleton client |
| `src/contexts/AuthContext.js` | Rewrite | Firebase Auth → Supabase Auth |
| `src/services/supabaseApi.js` | Create | userApi + courseApi + projectApi |
| `.env.local` | Modify | Add Supabase keys |

Firebase files (`src/config/firebase.js`, `src/services/firebaseApi.js`) are left untouched — they still work on the Firebase version.

---

## Task 1: Create Branch and Install Supabase

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

- [ ] **Step 1: Create the migration branch**

```bash
git checkout -b supabase-migration
```

- [ ] **Step 2: Install Supabase client**

```bash
npm install @supabase/supabase-js
```

Expected output: `added 1 package` (or similar — it has no sub-dependencies)

- [ ] **Step 3: Add Supabase env vars to .env.local**

Open `.env.local` and add these lines (keep all existing Firebase lines — don't remove them yet):

```
# Supabase
REACT_APP_SUPABASE_URL=https://dplaqxqnczmnxkuccsph.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_FEH-PIMBo5VR_uM7AwFb-g_nRPL85V3
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.local
git commit -m "chore: install supabase-js and add env vars"
```

---

## Task 2: Create Supabase Client Singleton

**Files:**
- Create: `src/lib/supabaseClient.js`

- [ ] **Step 1: Create the client file**

Create `src/lib/supabaseClient.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Verify it loads without error**

Run `npm start`. The browser console should not show any Supabase config errors. Stop the server after confirming.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabaseClient.js
git commit -m "feat: add Supabase client singleton"
```

---

## Task 3: Rewrite AuthContext.js

**Files:**
- Modify: `src/contexts/AuthContext.js`

This is the most critical task. The new AuthContext has the same exported interface as the old one — same context value shape, same method names — so all components (`Login`, `Signup`, `ProtectedRoute`, etc.) keep working.

**Firebase → Supabase mapping:**
- `onAuthStateChanged` → `supabase.auth.onAuthStateChange`
- `createUserWithEmailAndPassword` → `supabase.auth.signUp`
- `signInWithEmailAndPassword` → `supabase.auth.signInWithPassword`
- `signOut` → `supabase.auth.signOut`
- `sendPasswordResetEmail` → `supabase.auth.resetPasswordForEmail`
- Firestore user doc → `users` table query via `supabase.from('users')`

- [ ] **Step 1: Rewrite AuthContext.js**

Replace the entire contents of `src/contexts/AuthContext.js` with:

```javascript
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
```

- [ ] **Step 2: Run the app and verify auth loads**

```bash
npm start
```

Open the browser. The app should load without crashing. The login page should appear. Check browser console — you should see no errors related to AuthContext or Supabase. It's okay if Firebase errors appear (Firebase is still used elsewhere).

- [ ] **Step 3: Test sign-up**

On the signup page, create a new account with a test email (e.g., `test@example.com`). Then verify in Supabase dashboard → Authentication → Users that the new user appears. Also check Table Editor → users that a row was created by the trigger.

- [ ] **Step 4: Test sign-in**

Sign out and sign back in. Verify the user dashboard loads without errors.

- [ ] **Step 5: Test admin auto-promote**

Sign up or sign in as `sage+admin@sagerock.com`. Check Supabase Table Editor → users → verify that user's role = 'admin'.

- [ ] **Step 6: Commit**

```bash
git add src/contexts/AuthContext.js
git commit -m "feat(auth): replace Firebase Auth with Supabase Auth"
```

---

## Task 4: Create supabaseApi.js — Helpers and userApi

**Files:**
- Create: `src/services/supabaseApi.js`

- [ ] **Step 1: Create the file with helpers and userApi**

Create `src/services/supabaseApi.js`:

```javascript
import { supabase } from '../lib/supabaseClient'

// ---- Helpers ----

// Normalize a users row to match the shape components expect
const normalizeUser = (row) => {
  if (!row) return null
  return {
    id: row.id,
    uid: row.id,  // backward compat
    name: row.name,
    email: row.email,
    role: row.role || 'student',
    schoolId: row.school_id,
    school_id: row.school_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...row
  }
}

// Normalize a courses row
const normalizeCourse = (row) => {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    course_code: row.course_code,
    courseCode: row.course_code,
    accessCode: row.access_code,
    access_code: row.access_code,
    semester: row.semester,
    year: row.year,
    schoolId: row.school_id,
    school_id: row.school_id,
    createdBy: row.created_by,
    created_by: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...row
  }
}

// Normalize a course_memberships row
const normalizeMembership = (row) => {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    user_id: row.user_id,
    courseId: row.course_id,
    course_id: row.course_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
    addedBy: row.added_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...row
  }
}

// Normalize a projects row
const normalizeProject = (row) => {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdBy: row.created_by,
    created_by: row.created_by,
    courseId: row.course_id,
    course_id: row.course_id,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    ...row
  }
}

// ============================================================
// userApi
// ============================================================

export const userApi = {
  async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return normalizeUser(data)
  },

  async updateUser(userId, updates) {
    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.role !== undefined) dbUpdates.role = updates.role
    if (updates.schoolId !== undefined) dbUpdates.school_id = updates.schoolId
    if (updates.school_id !== undefined) dbUpdates.school_id = updates.school_id
    dbUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return normalizeUser(data)
  },

  async getAllUsers(courseId = null) {
    if (courseId) {
      const { data, error } = await supabase
        .from('users')
        .select(`*, course_memberships!inner(role, status, course_id)`)
        .eq('course_memberships.course_id', courseId)
      if (error) throw error
      return (data || []).map(row => ({
        ...normalizeUser(row),
        course_role: row.course_memberships?.[0]?.role,
        status: row.course_memberships?.[0]?.status,
        course_memberships: row.course_memberships
      }))
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')
    if (error) throw error
    return (data || []).map(normalizeUser)
  },

  async searchUsers(searchTerm, excludeCourseId = null, limitCount = 20) {
    let query = supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(limitCount)

    const { data, error } = await query
    if (error) throw error

    let results = (data || []).map(normalizeUser)

    if (excludeCourseId) {
      const { data: members } = await supabase
        .from('course_memberships')
        .select('user_id')
        .eq('course_id', excludeCourseId)
      const memberIds = new Set((members || []).map(m => m.user_id))
      results = results.filter(u => !memberIds.has(u.id))
    }

    return results
  },

  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    if (error) throw error
    return { success: true, message: 'User deleted', deletedData: { userId } }
  },

  async hasEmailNotificationsEnabled(userId, notificationType = 'instructor_note_emails') {
    const { data } = await supabase
      .from('users')
      .select('email_notifications_enabled')
      .eq('id', userId)
      .single()
    return data?.email_notifications_enabled !== false
  }
}
```

- [ ] **Step 2: Verify the file has no syntax errors**

```bash
node -e "require('./src/services/supabaseApi.js')" 2>&1 || echo "Note: This is a CRA app, syntax errors will show in the browser"
npm start
```

Open the app. No console errors should appear on load.

- [ ] **Step 3: Commit**

```bash
git add src/services/supabaseApi.js
git commit -m "feat(api): add supabaseApi with userApi"
```

---

## Task 5: Add courseApi to supabaseApi.js

**Files:**
- Modify: `src/services/supabaseApi.js`

- [ ] **Step 1: Append courseApi to the file**

Add the following to the bottom of `src/services/supabaseApi.js`:

```javascript
// ============================================================
// courseApi
// ============================================================

export const courseApi = {
  async createCourse(courseData) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        description: courseData.description || null,
        course_code: courseData.courseCode || courseData.course_code,
        access_code: courseData.accessCode || courseData.access_code || null,
        semester: courseData.semester || null,
        year: courseData.year || null,
        school_id: courseData.schoolId || courseData.school_id || null,
        created_by: user?.id || courseData.createdBy || courseData.created_by
      })
      .select()
      .single()
    if (error) throw error
    return normalizeCourse(data)
  },

  async getCourseById(courseId) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
    if (error) throw error
    return normalizeCourse(data)
  },

  getCourse(courseId) {
    return this.getCourseById(courseId)
  },

  async getAllCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select(`*, course_memberships(role, status, user_id)`)
      .order('title')
    if (error) throw error
    return (data || []).map(row => ({
      ...normalizeCourse(row),
      course_memberships: row.course_memberships || []
    }))
  },

  async updateCourse(courseId, updateData) {
    const dbUpdates = { updated_at: new Date().toISOString() }
    if (updateData.title !== undefined) dbUpdates.title = updateData.title
    if (updateData.description !== undefined) dbUpdates.description = updateData.description
    if (updateData.accessCode !== undefined) dbUpdates.access_code = updateData.accessCode
    if (updateData.access_code !== undefined) dbUpdates.access_code = updateData.access_code
    if (updateData.semester !== undefined) dbUpdates.semester = updateData.semester
    if (updateData.year !== undefined) dbUpdates.year = updateData.year

    const { data, error } = await supabase
      .from('courses')
      .update(dbUpdates)
      .eq('id', courseId)
      .select()
      .single()
    if (error) throw error
    return normalizeCourse(data)
  },

  async deleteCourse(courseId) {
    const { error } = await supabase.from('courses').delete().eq('id', courseId)
    if (error) throw error
    return true
  },

  generateCourseCode(courseName, semester, year) {
    const prefix = (courseName || 'CRS')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 3)
    const semCode = (semester || 'SP').substring(0, 2).toUpperCase()
    const yearCode = String(year || new Date().getFullYear()).slice(-2)
    const rand = Math.floor(Math.random() * 900) + 100
    return `${prefix}${semCode}${yearCode}${rand}`
  },

  async addUserToCourse(userId, courseId, role = 'student', addedBy = null) {
    const { error } = await supabase
      .from('course_memberships')
      .upsert({
        user_id: userId,
        course_id: courseId,
        role,
        status: 'approved',
        added_by: addedBy,
        joined_at: new Date().toISOString()
      }, { onConflict: 'user_id,course_id' })
    if (error) throw error
    return true
  },

  addStudentToCourse(userId, courseId, addedBy) {
    return this.addUserToCourse(userId, courseId, 'student', addedBy)
  },

  async removeStudentFromCourse(studentId, courseId) {
    const { error } = await supabase
      .from('course_memberships')
      .delete()
      .eq('user_id', studentId)
      .eq('course_id', courseId)
    if (error) throw error
    return true
  },

  async approveStudentEnrollment(studentId, courseId) {
    const { error } = await supabase
      .from('course_memberships')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('user_id', studentId)
      .eq('course_id', courseId)
    if (error) throw error
    return true
  },

  async rejectStudentEnrollment(studentId, courseId) {
    const { error } = await supabase
      .from('course_memberships')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('user_id', studentId)
      .eq('course_id', courseId)
    if (error) throw error
    return true
  },

  async removeMemberFromCourse(membershipId) {
    const { error } = await supabase
      .from('course_memberships')
      .delete()
      .eq('id', membershipId)
    if (error) throw error
    return true
  },

  async updateMemberRole(membershipId, newRole) {
    const { error } = await supabase
      .from('course_memberships')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', membershipId)
    if (error) throw error
    return true
  },

  async updateMembershipStatus(membershipId, status) {
    const { error } = await supabase
      .from('course_memberships')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', membershipId)
    if (error) throw error
    return true
  },

  async restoreInstructorRole(userId, courseId) {
    const { error } = await supabase
      .from('course_memberships')
      .update({ role: 'instructor', status: 'approved', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('course_id', courseId)
    if (error) throw error
    return { success: true, message: 'Instructor role restored' }
  },

  async getUserCourses(userId) {
    const { data, error } = await supabase
      .from('course_memberships')
      .select(`*, courses(*)`)
      .eq('user_id', userId)
      .eq('status', 'approved')
    if (error) throw error
    return (data || []).map(m => ({
      ...normalizeCourse(m.courses),
      membership: normalizeMembership(m),
      course_role: m.role,
      status: m.status
    }))
  },

  async getUserPendingCourses(userId) {
    const { data, error } = await supabase
      .from('course_memberships')
      .select(`*, courses(*)`)
      .eq('user_id', userId)
      .eq('status', 'pending')
    if (error) throw error
    return (data || []).map(m => ({
      ...normalizeCourse(m.courses),
      membership: normalizeMembership(m),
      course_role: m.role,
      status: m.status
    }))
  },

  async joinCourse(userId, courseId, accessCode, role = 'student') {
    // Verify access code if provided
    if (accessCode) {
      const { data: course } = await supabase
        .from('courses')
        .select('access_code')
        .eq('id', courseId)
        .single()
      if (course?.access_code && course.access_code !== accessCode) {
        throw new Error('Invalid access code')
      }
    }

    const { error } = await supabase
      .from('course_memberships')
      .upsert({
        user_id: userId,
        course_id: courseId,
        role,
        status: 'pending',
        joined_at: new Date().toISOString()
      }, { onConflict: 'user_id,course_id' })
    if (error) throw error
    return { success: true }
  },

  async getPendingApprovals(courseId) {
    const { data, error } = await supabase
      .from('course_memberships')
      .select(`*, users(*)`)
      .eq('course_id', courseId)
      .eq('status', 'pending')
      .order('created_at')
    if (error) throw error
    return (data || []).map(m => ({
      ...normalizeMembership(m),
      user: normalizeUser(m.users)
    }))
  },

  async getCourseByCode(courseCode) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('access_code', courseCode)
      .single()
    if (error) return null
    return normalizeCourse(data)
  },

  async getCourseMembers(courseId) {
    const { data, error } = await supabase
      .from('course_memberships')
      .select(`*, users(*)`)
      .eq('course_id', courseId)
      .eq('status', 'approved')
      .order('role')
    if (error) throw error
    return (data || []).map(m => ({
      ...normalizeMembership(m),
      user: normalizeUser(m.users)
    }))
  },

  async getUserCourseMembership(userId, courseId) {
    const { data, error } = await supabase
      .from('course_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()
    if (error) return null
    return normalizeMembership(data)
  },

  // No-op — counts are now live from the course_analytics view
  async updateCourseMemberCounts() {
    return
  },

  // No-op utility functions (data is clean in Supabase)
  async cleanupDuplicateMemberships() { return [] },
  async fixDuplicateMemberships() { return [] },
  async cleanupOrphanedMemberships() { return { cleaned: 0 } },
  async cleanupOrphanedChats() { return { orphanedCount: 0 } },
  async fixMissingAccessCodes() { return 0 },
  async debugListAllCourses() { return this.getAllCourses() },
  async updateCourseAccessCode(courseId, accessCode) {
    return this.updateCourse(courseId, { access_code: accessCode })
  },
  async joinTrialCourse(courseCode, userId, role) {
    const course = await this.getCourseByCode(courseCode)
    if (!course) throw new Error('Course not found')
    return this.joinCourse(userId, course.id, courseCode, role)
  }
}
```

- [ ] **Step 2: Verify the app still runs**

```bash
npm start
```

No console errors should appear.

- [ ] **Step 3: Commit**

```bash
git add src/services/supabaseApi.js
git commit -m "feat(api): add courseApi to supabaseApi"
```

---

## Task 6: Add projectApi to supabaseApi.js

**Files:**
- Modify: `src/services/supabaseApi.js`

- [ ] **Step 1: Append projectApi to the file**

Add the following to the bottom of `src/services/supabaseApi.js`:

```javascript
// ============================================================
// projectApi
// ============================================================

export const projectApi = {
  async createProject(projectData, userId, courseId) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: projectData.title,
        description: projectData.description || null,
        created_by: userId || projectData.createdBy || projectData.created_by,
        course_id: courseId || projectData.courseId || projectData.course_id || null
      })
      .select()
      .single()
    if (error) throw error
    return normalizeProject(data)
  },

  async getProjectById(projectId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    if (error) throw error
    return normalizeProject(data)
  },

  async getUserProjects(userId, courseId = null) {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query
    if (error) throw error
    return (data || []).map(normalizeProject)
  },

  async updateProject(projectId, updates) {
    const dbUpdates = { updated_at: new Date().toISOString() }
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description

    const { data, error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', projectId)
      .select()
      .single()
    if (error) throw error
    return normalizeProject(data)
  },

  async deleteProject(projectId) {
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) throw error
  },

  async getAllProjects(courseId = null) {
    let query = supabase
      .from('projects')
      .select(`*, users(id, name, email)`)
      .order('created_at', { ascending: false })

    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query
    if (error) throw error
    return (data || []).map(row => ({
      ...normalizeProject(row),
      user: normalizeUser(row.users)
    }))
  }
}
```

- [ ] **Step 2: Verify the app runs**

```bash
npm start
```

No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/supabaseApi.js
git commit -m "feat(api): add projectApi to supabaseApi"
```

---

## Task 7: Wire Up Components to Use supabaseApi

The components currently import from `firebaseApi`. We need to update the key dashboard and course components to import from `supabaseApi` instead.

**Files:**
- Explore and update whichever components import `courseApi`, `projectApi`, `userApi` from `firebaseApi`

- [ ] **Step 1: Find all components that import from firebaseApi**

```bash
grep -rl "from.*firebaseApi" src/ --include="*.js" --include="*.jsx" | head -30
```

- [ ] **Step 2: For each component, add a supabaseApi import alongside the firebaseApi one**

For any component that imports `courseApi`, `projectApi`, or `userApi` from `firebaseApi`, change the import to use `supabaseApi` instead. Example:

Before:
```javascript
import { courseApi, projectApi } from '../services/firebaseApi'
```

After:
```javascript
import { courseApi, projectApi } from '../services/supabaseApi'
```

Do this for all components that use these three APIs. Leave any imports of `chatApi`, `reflectionApi`, `instructorNotesApi`, `tagApi`, `attachmentApi`, `analyticsApi`, `announcementApi` pointing at `firebaseApi` — those are Phase 2.

- [ ] **Step 3: Run the app and walk through the core flow**

```bash
npm start
```

Test these paths manually:
1. Sign up as a new user → should create a users row in Supabase
2. Create a course → should appear in Supabase Table Editor → courses
3. View dashboard → courses should load
4. Create a project → should appear in Supabase Table Editor → projects
5. Join a course with an access code → membership should appear in course_memberships with status='pending'

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: wire dashboard and course components to supabaseApi"
```

---

## Task 8: Push Branch and Verify Vercel Preview URL

- [ ] **Step 1: Push the branch**

```bash
git push -u origin supabase-migration
```

- [ ] **Step 2: Check Vercel for the preview deployment**

Go to your Vercel dashboard. A new deployment for `supabase-migration` branch should appear automatically. Wait for it to build (usually 1-2 minutes).

- [ ] **Step 3: Add Supabase env vars to Vercel**

The preview deployment needs the Supabase env vars. In Vercel:
1. Go to Project Settings → Environment Variables
2. Add:
   - `REACT_APP_SUPABASE_URL` = `https://dplaqxqnczmnxkuccsph.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` = `sb_publishable_FEH-PIMBo5VR_uM7AwFb-g_nRPL85V3`
3. Set scope to "Preview" (not Production — that's still Firebase)
4. Redeploy the preview branch

- [ ] **Step 4: Test the preview URL end to end**

Open the Vercel preview URL. Repeat the sign-up, course creation, and project creation flow. Everything should work against the Supabase database.

---

## Completion Checklist

- [ ] `supabase-migration` branch exists and is pushed
- [ ] `@supabase/supabase-js` installed
- [ ] `src/lib/supabaseClient.js` created
- [ ] `AuthContext.js` uses Supabase Auth (sign up, sign in, sign out, reset password work)
- [ ] `sage+admin@sagerock.com` auto-promoted to admin on sign-up
- [ ] `supabaseApi.js` exports `userApi`, `courseApi`, `projectApi`
- [ ] Dashboard loads courses from Supabase
- [ ] Projects create and load from Supabase
- [ ] Vercel preview URL is live and functional

---

## What's NOT in This Plan (Phase 2+)

- `chatApi` — AI conversations (requires chat UI wiring)
- `reflectionApi`, `instructorNotesApi` — learning features
- `tagApi`, `attachmentApi` — organization features
- `analyticsApi` — uses the `course_analytics` view (simple but separate)
- `announcementApi` — course messaging
- `schoolsApi`, `tutorialApi`, `modulesApi`, `realtimeApi` — admin/advanced
- Storage migration — PDFs from Firebase Storage to Supabase Storage
- Cloud Functions replacement — email notifications
