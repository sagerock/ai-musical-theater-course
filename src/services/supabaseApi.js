import { supabase } from '../lib/supabaseClient'

// ---- Helpers ----

const normalizeUser = (row) => {
  if (!row) return null
  return {
    id: row.id,
    uid: row.id,
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
        .select('*, course_memberships!inner(role, status, course_id)')
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(limitCount)
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
    const { error } = await supabase.from('users').delete().eq('id', userId)
    if (error) throw error
    return { success: true, message: 'User deleted', deletedData: { userId } }
  },

  async hasEmailNotificationsEnabled(userId) {
    const { data } = await supabase
      .from('users')
      .select('email_notifications_enabled')
      .eq('id', userId)
      .single()
    return data?.email_notifications_enabled !== false
  }
}

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
      .select('*, course_memberships(role, status, user_id)')
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
      .select('*, courses(*)')
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
      .select('*, courses(*)')
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
      .select('*, users(*)')
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
      .select('*, users(*)')
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

  async updateCourseMemberCounts() { return },
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
      .select('*, users(id, name, email)')
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
