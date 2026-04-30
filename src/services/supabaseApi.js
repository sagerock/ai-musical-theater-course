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

// ============================================================
// chatApi
// ============================================================

const normalizeChat = (row) => {
  if (!row) return null
  return {
    id: row.id,
    prompt: row.prompt,
    response: row.response,
    tool_used: row.model,
    model: row.model,
    userId: row.user_id,
    user_id: row.user_id,
    projectId: row.project_id,
    project_id: row.project_id,
    moduleId: row.module_id,
    module_id: row.module_id,
    courseId: row.course_id,
    course_id: row.course_id,
    has_reflection: row.has_reflection,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    ...row
  }
}

export const chatApi = {
  async createChat(chatData, courseId) {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        prompt: chatData.prompt,
        response: chatData.response || null,
        model: chatData.tool_used || chatData.model || null,
        user_id: chatData.userId || chatData.user_id,
        project_id: chatData.projectId || chatData.project_id || null,
        module_id: chatData.moduleId || chatData.module_id || null,
        course_id: courseId || chatData.courseId || chatData.course_id || null,
        has_reflection: chatData.has_reflection || false
      })
      .select()
      .single()
    if (error) throw error
    return normalizeChat(data)
  },

  async getChatById(chatId) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single()
    if (error) throw error
    return normalizeChat(data)
  },

  async getProjectChats(projectId) {
    const { data, error } = await supabase
      .from('chats')
      .select('*, reflections(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []).map(row => ({
      ...normalizeChat(row),
      reflection: row.reflections?.[0] || null
    }))
  },

  async getUserChats(userId, courseId = null, limitCount = 100) {
    let q = supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount)
    if (courseId) q = q.eq('course_id', courseId)
    const { data, error } = await q
    if (error) throw error
    return (data || []).map(normalizeChat)
  },

  async getChatsWithFilters(filters = {}) {
    let q = supabase.from('chats').select('*, users(id, name, email), projects(id, title), reflections(*)').order('created_at', { ascending: false })
    if (filters.courseId) q = q.eq('course_id', filters.courseId)
    if (filters.userId) q = q.eq('user_id', filters.userId)
    if (filters.projectId) q = q.eq('project_id', filters.projectId)
    if (filters.toolUsed) q = q.eq('model', filters.toolUsed)
    if (filters.startDate) q = q.gte('created_at', new Date(filters.startDate).toISOString())
    if (filters.endDate) q = q.lte('created_at', new Date(filters.endDate).toISOString())
    if (filters.limit) q = q.limit(filters.limit)
    const { data, error } = await q
    if (error) throw error
    return (data || []).map(row => ({
      ...normalizeChat(row),
      users: row.users,
      user: row.users,
      project: row.projects,
      reflection: row.reflections?.[0] || null,
      reflections: row.reflections || []
    }))
  },

  async getChatsWithFiltersOptimized(filters = {}) {
    return this.getChatsWithFilters(filters)
  },

  async getCourseChatsCount(courseId) {
    const { count: totalChats } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
    const { data: usersData } = await supabase
      .from('chats')
      .select('user_id')
      .eq('course_id', courseId)
    const { data: projectsData } = await supabase
      .from('chats')
      .select('project_id')
      .eq('course_id', courseId)
      .not('project_id', 'is', null)
    const { count: reflectionCount } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('has_reflection', true)
    return {
      totalChats: totalChats || 0,
      uniqueUsers: new Set((usersData || []).map(c => c.user_id)).size,
      uniqueProjects: new Set((projectsData || []).map(c => c.project_id).filter(Boolean)).size,
      reflectionCount: reflectionCount || 0
    }
  },

  async getCourseChatsCountLightweight(courseId) {
    const { count: totalChats } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
    const { count: reflectionCount } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('has_reflection', true)
    return { totalChats: totalChats || 0, reflectionCount: reflectionCount || 0 }
  },

  async updateChat(chatId, updates) {
    const dbUpdates = { updated_at: new Date().toISOString() }
    if (updates.prompt !== undefined) dbUpdates.prompt = updates.prompt
    if (updates.response !== undefined) dbUpdates.response = updates.response
    if (updates.tool_used !== undefined) dbUpdates.model = updates.tool_used
    if (updates.model !== undefined) dbUpdates.model = updates.model
    if (updates.has_reflection !== undefined) dbUpdates.has_reflection = updates.has_reflection
    const { data, error } = await supabase
      .from('chats')
      .update(dbUpdates)
      .eq('id', chatId)
      .select()
      .single()
    if (error) throw error
    return normalizeChat(data)
  },

  async deleteChat(chatId) {
    const { error } = await supabase.from('chats').delete().eq('id', chatId)
    if (error) throw error
  },

  async fixMissingToolUsed() { return { fixed: 0, message: 'No-op on Supabase' } },
  async fixOrphanedChats() { return { fixed: 0, orphaned: 0, message: 'No-op on Supabase' } }
}

// ============================================================
// reflectionApi
// ============================================================

const normalizeReflection = (row) => {
  if (!row) return null
  return {
    id: row.id,
    chatId: row.chat_id,
    chat_id: row.chat_id,
    userId: row.user_id,
    user_id: row.user_id,
    courseId: row.course_id,
    course_id: row.course_id,
    projectId: row.project_id,
    project_id: row.project_id,
    content: row.content,
    reflection_text: row.content,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    ...row
  }
}

export const reflectionApi = {
  async createReflection(reflectionData) {
    const content = reflectionData.content || reflectionData.reflection_text
    const { data, error } = await supabase
      .from('reflections')
      .insert({
        chat_id: reflectionData.chatId || reflectionData.chat_id || null,
        user_id: reflectionData.userId || reflectionData.user_id,
        course_id: reflectionData.courseId || reflectionData.course_id || null,
        project_id: reflectionData.projectId || reflectionData.project_id || null,
        content
      })
      .select()
      .single()
    if (error) throw error
    if (data.chat_id) {
      await supabase.from('chats').update({ has_reflection: true }).eq('id', data.chat_id)
    }
    return normalizeReflection(data)
  },

  async getReflectionById(reflectionId) {
    const { data, error } = await supabase.from('reflections').select('*').eq('id', reflectionId).single()
    if (error) throw error
    return normalizeReflection(data)
  },

  async getReflectionByChat(chatId) {
    const { data, error } = await supabase.from('reflections').select('*').eq('chat_id', chatId).single()
    if (error) return null
    return normalizeReflection(data)
  },

  async updateReflection(reflectionId, updates) {
    const dbUpdates = { updated_at: new Date().toISOString() }
    if (updates.content !== undefined) dbUpdates.content = updates.content
    if (updates.reflection_text !== undefined) dbUpdates.content = updates.reflection_text
    const { data, error } = await supabase
      .from('reflections')
      .update(dbUpdates)
      .eq('id', reflectionId)
      .select()
      .single()
    if (error) throw error
    return normalizeReflection(data)
  },

  async deleteReflection(reflectionId) {
    const { data: refl } = await supabase.from('reflections').select('chat_id').eq('id', reflectionId).single()
    const { error } = await supabase.from('reflections').delete().eq('id', reflectionId)
    if (error) throw error
    if (refl?.chat_id) {
      await supabase.from('chats').update({ has_reflection: false }).eq('id', refl.chat_id)
    }
    return true
  },

  async getCourseReflections(courseId) {
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(normalizeReflection)
  },

  async checkReflectionIntegrity() {
    return { issues: [], correctCount: 0 }
  }
}

// ============================================================
// instructorNotesApi
// ============================================================

const normalizeNote = (row) => {
  if (!row) return null
  return {
    id: row.id,
    projectId: row.project_id,
    project_id: row.project_id,
    courseId: row.course_id,
    course_id: row.course_id,
    authorId: row.author_id,
    author_id: row.author_id,
    instructorId: row.author_id,
    authorName: row.author_name,
    author_name: row.author_name,
    content: row.content,
    parentId: row.parent_id,
    parent_id: row.parent_id,
    threadId: row.thread_id,
    thread_id: row.thread_id,
    isReply: row.is_reply,
    is_reply: row.is_reply,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    ...row
  }
}

export const instructorNotesApi = {
  async createNote(noteData) {
    const { data, error } = await supabase
      .from('instructor_notes')
      .insert({
        project_id: noteData.projectId || noteData.project_id,
        course_id: noteData.courseId || noteData.course_id,
        author_id: noteData.authorId || noteData.author_id || noteData.instructorId,
        author_name: noteData.authorName || noteData.author_name || null,
        content: noteData.content,
        parent_id: noteData.parentId || noteData.parent_id || null,
        thread_id: noteData.threadId || noteData.thread_id || null,
        is_reply: noteData.isReply || noteData.is_reply || false
      })
      .select()
      .single()
    if (error) throw error
    return normalizeNote(data)
  },

  async replyToNote(noteId, replyData) {
    const { data: parent } = await supabase.from('instructor_notes').select('thread_id, project_id, course_id').eq('id', noteId).single()
    const threadId = parent?.thread_id || noteId
    return this.createNote({
      ...replyData,
      project_id: replyData.project_id || parent?.project_id,
      course_id: replyData.course_id || parent?.course_id,
      parent_id: noteId,
      thread_id: threadId,
      is_reply: true
    })
  },

  async deleteInstructorNote(noteId) {
    const { error } = await supabase.from('instructor_notes').delete().eq('id', noteId)
    if (error) throw error
    return { success: true }
  },

  async getNotesByChat(chatId) {
    const { data: chat } = await supabase.from('chats').select('project_id').eq('id', chatId).single()
    if (!chat?.project_id) return []
    return this.getProjectNotes(chat.project_id)
  },

  async getProjectNotes(projectId) {
    const { data, error } = await supabase
      .from('instructor_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    if (error) throw error
    const notes = (data || []).map(normalizeNote)
    return this.organizeThreadedNotes(notes)
  },

  organizeThreadedNotes(notes) {
    const byId = new Map(notes.map(n => [n.id, { ...n, replies: [] }]))
    const roots = []
    notes.forEach(n => {
      const node = byId.get(n.id)
      if (n.parent_id && byId.has(n.parent_id)) {
        byId.get(n.parent_id).replies.push(node)
      } else {
        roots.push(node)
      }
    })
    return roots
  },

  async getNotesForDashboard(instructorId, courseId) {
    let q = supabase
      .from('instructor_notes')
      .select('*, projects(id, title, created_by, users:created_by(id, name, email))')
      .order('created_at', { ascending: false })
    if (courseId) q = q.eq('course_id', courseId)
    const { data, error } = await q
    if (error) throw error
    return (data || []).map(normalizeNote)
  }
}

// ============================================================
// tagApi
// ============================================================

const normalizeTag = (row) => {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    description: row.description,
    courseId: row.course_id,
    course_id: row.course_id,
    isGlobal: row.is_global,
    is_global: row.is_global,
    createdAt: row.created_at,
    created_at: row.created_at,
    ...row
  }
}

export const tagApi = {
  async getAllTags(courseId = null) {
    let q = supabase.from('tags').select('*').order('name')
    if (courseId) q = q.or(`course_id.eq.${courseId},is_global.eq.true`)
    const { data, error } = await q
    if (error) throw error
    return (data || []).map(normalizeTag)
  },

  async createTag(tagData, courseId) {
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: tagData.name,
        color: tagData.color || null,
        description: tagData.description || null,
        course_id: courseId || tagData.courseId || tagData.course_id || null,
        is_global: tagData.isGlobal || tagData.is_global || false
      })
      .select()
      .single()
    if (error) throw error
    return normalizeTag(data)
  },

  async getTagById(tagId) {
    const { data, error } = await supabase.from('tags').select('*').eq('id', tagId).single()
    if (error) throw error
    return normalizeTag(data)
  },

  async getCourseTagsWithUsage(courseId) {
    const { data: tags } = await supabase.from('tags').select('*').eq('course_id', courseId)
    const { data: chatTags } = await supabase
      .from('chat_tags')
      .select('tag_id, chats!inner(course_id)')
      .eq('chats.course_id', courseId)
    const counts = {}
    ;(chatTags || []).forEach(ct => { counts[ct.tag_id] = (counts[ct.tag_id] || 0) + 1 })
    return (tags || []).map(t => ({ ...normalizeTag(t), usage_count: counts[t.id] || 0 }))
  },

  async getGlobalTagsWithUsage(courseId) {
    const { data: tags } = await supabase.from('tags').select('*').eq('is_global', true)
    const { data: chatTags } = await supabase
      .from('chat_tags')
      .select('tag_id, chats!inner(course_id)')
      .eq('chats.course_id', courseId)
    const counts = {}
    ;(chatTags || []).forEach(ct => { counts[ct.tag_id] = (counts[ct.tag_id] || 0) + 1 })
    return (tags || []).map(t => ({ ...normalizeTag(t), usage_count: counts[t.id] || 0 }))
  },

  getCourseTags(courseId) { return this.getCourseTagsWithUsage(courseId) },

  async addTagsToChat(chatId, tagIds) {
    const rows = tagIds.map(tag_id => ({ chat_id: chatId, tag_id }))
    const { error } = await supabase.from('chat_tags').upsert(rows, { onConflict: 'chat_id,tag_id' })
    if (error) throw error
    return true
  },

  async removeTagsFromChat(chatId, tagIds) {
    const { error } = await supabase
      .from('chat_tags')
      .delete()
      .eq('chat_id', chatId)
      .in('tag_id', tagIds)
    if (error) throw error
    return true
  },

  async updateTag(tagId, updates) {
    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.description !== undefined) dbUpdates.description = updates.description
    const { data, error } = await supabase
      .from('tags')
      .update(dbUpdates)
      .eq('id', tagId)
      .select()
      .single()
    if (error) throw error
    return normalizeTag(data)
  },

  async deleteTag(tagId) {
    await supabase.from('chat_tags').delete().eq('tag_id', tagId)
    const { error } = await supabase.from('tags').delete().eq('id', tagId)
    if (error) throw error
  },

  async getChatTags(chatId) {
    const { data, error } = await supabase
      .from('chat_tags')
      .select('tag_id, tags(*)')
      .eq('chat_id', chatId)
    if (error) throw error
    return (data || []).map(ct => normalizeTag(ct.tags))
  }
}

// ============================================================
// analyticsApi
// ============================================================

export const analyticsApi = {
  async generateCourseAnalytics(courseId) {
    return this.getCourseAnalytics(courseId, true)
  },

  async getCourseAnalytics(courseId, forceRefresh = false) {
    const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single()
    const { data: analytics } = await supabase.from('course_analytics').select('*').eq('course_id', courseId).single()
    const { data: chats } = await supabase
      .from('chats')
      .select('model, user_id, created_at, project_id, has_reflection')
      .eq('course_id', courseId)

    const toolUsage = {}
    ;(chats || []).forEach(c => {
      const model = c.model || 'unknown'
      toolUsage[model] = (toolUsage[model] || 0) + 1
    })

    return {
      courseInfo: {
        id: courseId,
        title: course?.title,
        description: course?.description,
        course_code: course?.course_code
      },
      summary: {
        totalStudents: analytics?.student_count || 0,
        totalInteractions: analytics?.total_chats || 0,
        totalProjects: analytics?.total_projects || 0,
        totalReflections: analytics?.total_reflections || 0,
        averageInteractionsPerStudent: analytics?.student_count
          ? Math.round((analytics.total_chats || 0) / analytics.student_count * 10) / 10
          : 0,
        topTool: Object.keys(toolUsage).sort((a, b) => toolUsage[b] - toolUsage[a])[0] || null
      },
      toolUsage,
      engagementPatterns: { byDay: {}, byHour: {} },
      lastUpdated: new Date().toISOString(),
      cached: false
    }
  },

  async getCourseAnalyticsSummary(courseId) {
    const result = await this.getCourseAnalytics(courseId)
    return { courseInfo: result.courseInfo, summary: result.summary, cached: false }
  },

  async refreshCourseAnalytics(courseId) {
    return this.getCourseAnalytics(courseId, true)
  },

  async hasAnalytics(courseId) {
    const { data } = await supabase.from('course_analytics').select('course_id').eq('course_id', courseId).single()
    return !!data
  },

  async getAnalyticsStatus(courseId) {
    const { data, error } = await supabase.from('course_analytics').select('*').eq('course_id', courseId).single()
    if (error) return { exists: false, error: error.message }
    return {
      exists: true,
      lastUpdated: new Date().toISOString(),
      isStale: false,
      isFresh: true,
      studentCount: data.student_count,
      interactionCount: data.total_chats,
      projectCount: data.total_projects
    }
  }
}

// ============================================================
// schoolsApi
// ============================================================

const normalizeSchool = (row) => {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    shortName: row.code,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    zipCode: row.zip_code,
    zip_code: row.zip_code,
    isActive: row.is_active,
    is_active: row.is_active,
    createdBy: row.created_by,
    created_by: row.created_by,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    ...row
  }
}

export const schoolsApi = {
  async createSchool(schoolData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('schools')
      .insert({
        name: schoolData.name,
        code: schoolData.shortName || schoolData.code || null,
        address: schoolData.address || null,
        city: schoolData.city || null,
        state: schoolData.state || null,
        country: schoolData.country || 'US',
        zip_code: schoolData.zipCode || schoolData.zip_code || null,
        is_active: true,
        created_by: user?.id || null
      })
      .select()
      .single()
    if (error) throw error
    return normalizeSchool(data)
  },

  async getAllSchools() {
    const { data, error } = await supabase.from('schools').select('*').eq('is_active', true).order('name')
    if (error) throw error
    return (data || []).map(normalizeSchool)
  },

  async getSchoolById(schoolId) {
    const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId).single()
    if (error) throw error
    return normalizeSchool(data)
  },

  async updateSchool(schoolId, updates) {
    const dbUpdates = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.shortName !== undefined) dbUpdates.code = updates.shortName
    if (updates.code !== undefined) dbUpdates.code = updates.code
    if (updates.address !== undefined) dbUpdates.address = updates.address
    if (updates.city !== undefined) dbUpdates.city = updates.city
    if (updates.state !== undefined) dbUpdates.state = updates.state
    if (updates.country !== undefined) dbUpdates.country = updates.country
    if (updates.zipCode !== undefined) dbUpdates.zip_code = updates.zipCode
    const { data, error } = await supabase
      .from('schools')
      .update(dbUpdates)
      .eq('id', schoolId)
      .select()
      .single()
    if (error) throw error
    return normalizeSchool(data)
  },

  async deleteSchool(schoolId) {
    const { error } = await supabase
      .from('schools')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', schoolId)
    if (error) throw error
  },

  async getSchoolCourses(schoolId) {
    const { data, error } = await supabase.from('courses').select('*').eq('school_id', schoolId).order('title')
    if (error) throw error
    return data || []
  }
}

// ============================================================
// announcementApi
// ============================================================

const normalizeAnnouncement = (row) => {
  if (!row) return null
  return {
    id: row.id,
    courseId: row.course_id,
    course_id: row.course_id,
    authorId: row.created_by,
    author_id: row.created_by,
    title: row.title,
    content: row.content,
    type: row.type,
    isPinned: row.is_pinned,
    is_pinned: row.is_pinned,
    commentCount: row.comment_count,
    comment_count: row.comment_count,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    ...row
  }
}

const normalizeComment = (row) => {
  if (!row) return null
  return {
    id: row.id,
    announcementId: row.announcement_id,
    announcement_id: row.announcement_id,
    authorId: row.user_id,
    author_id: row.user_id,
    userId: row.user_id,
    user_id: row.user_id,
    authorName: row.user_name,
    user_name: row.user_name,
    content: row.content,
    createdAt: row.created_at,
    created_at: row.created_at,
    ...row
  }
}

export const announcementApi = {
  async createAnnouncement(announcementData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        course_id: announcementData.courseId || announcementData.course_id,
        title: announcementData.title,
        content: announcementData.content,
        type: 'announcement',
        is_pinned: announcementData.isPinned || false,
        created_by: user?.id || announcementData.authorId,
        comment_count: 0
      })
      .select()
      .single()
    if (error) throw error
    return normalizeAnnouncement(data)
  },

  async createDiscussion(discussionData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        course_id: discussionData.courseId || discussionData.course_id,
        title: discussionData.title,
        content: discussionData.content,
        type: 'discussion',
        is_pinned: false,
        created_by: user?.id || discussionData.authorId,
        comment_count: 0
      })
      .select()
      .single()
    if (error) throw error
    return normalizeAnnouncement(data)
  },

  async getAnnouncements(courseId) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, users:created_by(id, name, email)')
      .eq('course_id', courseId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(row => ({
      ...normalizeAnnouncement(row),
      authorName: row.users?.name,
      author: row.users
    }))
  },

  getDiscussions(courseId) { return this.getAnnouncements(courseId) },

  async updateAnnouncement(announcementId, updates) {
    const dbUpdates = { updated_at: new Date().toISOString() }
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.content !== undefined) dbUpdates.content = updates.content
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned
    if (updates.is_pinned !== undefined) dbUpdates.is_pinned = updates.is_pinned
    const { error } = await supabase.from('announcements').update(dbUpdates).eq('id', announcementId)
    if (error) throw error
    return { success: true }
  },

  async deleteAnnouncement(announcementId) {
    await supabase.from('announcement_comments').delete().eq('announcement_id', announcementId)
    const { error } = await supabase.from('announcements').delete().eq('id', announcementId)
    if (error) throw error
    return { success: true }
  },

  async pinAnnouncement(announcementId, isPinned) {
    const { error } = await supabase
      .from('announcements')
      .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
      .eq('id', announcementId)
    if (error) throw error
    return { success: true }
  },

  async addComment(announcementId, commentData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('announcement_comments')
      .insert({
        announcement_id: announcementId,
        user_id: user?.id || commentData.authorId,
        user_name: commentData.authorName || null,
        content: commentData.content
      })
      .select()
      .single()
    if (error) throw error
    await this.incrementCommentCount(announcementId)
    return normalizeComment(data)
  },

  async deleteComment(commentId) {
    const { data: comment } = await supabase.from('announcement_comments').select('announcement_id').eq('id', commentId).single()
    const { error } = await supabase.from('announcement_comments').delete().eq('id', commentId)
    if (error) throw error
    if (comment?.announcement_id) {
      const { count } = await supabase
        .from('announcement_comments')
        .select('*', { count: 'exact', head: true })
        .eq('announcement_id', comment.announcement_id)
      await supabase.from('announcements').update({ comment_count: count || 0 }).eq('id', comment.announcement_id)
    }
    return { success: true }
  },

  async updateComment(commentId, updates) {
    const dbUpdates = {}
    if (updates.content !== undefined) dbUpdates.content = updates.content
    const { error } = await supabase.from('announcement_comments').update(dbUpdates).eq('id', commentId)
    if (error) throw error
    return { success: true }
  },

  async getComments(announcementId) {
    const { data, error } = await supabase
      .from('announcement_comments')
      .select('*')
      .eq('announcement_id', announcementId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(normalizeComment)
  },

  async incrementCommentCount(announcementId) {
    const { count } = await supabase
      .from('announcement_comments')
      .select('*', { count: 'exact', head: true })
      .eq('announcement_id', announcementId)
    await supabase.from('announcements').update({ comment_count: count || 0 }).eq('id', announcementId)
  }
}

// ============================================================
// modulesApi
// ============================================================

const normalizeModule = (row) => {
  if (!row) return null
  return {
    id: row.id,
    courseId: row.course_id,
    course_id: row.course_id,
    title: row.title,
    description: row.description,
    order: row.display_order,
    display_order: row.display_order,
    systemPrompt: row.system_prompt,
    system_prompt: row.system_prompt,
    minimumExchanges: row.minimum_exchanges,
    minimum_exchanges: row.minimum_exchanges,
    aiModel: row.ai_model,
    ai_model: row.ai_model,
    createdBy: row.created_by,
    created_by: row.created_by,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    ...row
  }
}

export const modulesApi = {
  async createModule(moduleData) {
    const { data, error } = await supabase
      .from('modules')
      .insert({
        course_id: moduleData.courseId || moduleData.course_id,
        title: moduleData.title,
        description: moduleData.description || null,
        display_order: moduleData.order || moduleData.display_order || 0,
        system_prompt: moduleData.systemPrompt || moduleData.system_prompt || null,
        minimum_exchanges: moduleData.minimumExchanges || moduleData.minimum_exchanges || 0,
        ai_model: moduleData.aiModel || moduleData.ai_model || null,
        created_by: moduleData.createdBy || moduleData.created_by
      })
      .select()
      .single()
    if (error) throw error
    return normalizeModule(data)
  },

  async getModuleById(moduleId) {
    const { data, error } = await supabase.from('modules').select('*').eq('id', moduleId).single()
    if (error) throw error
    return normalizeModule(data)
  },

  async getModulesByCourse(courseId) {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('display_order')
    if (error) throw error
    return (data || []).map(normalizeModule)
  },

  async updateModule(moduleId, updates) {
    const dbUpdates = { updated_at: new Date().toISOString() }
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.order !== undefined) dbUpdates.display_order = updates.order
    if (updates.systemPrompt !== undefined) dbUpdates.system_prompt = updates.systemPrompt
    if (updates.minimumExchanges !== undefined) dbUpdates.minimum_exchanges = updates.minimumExchanges
    if (updates.aiModel !== undefined) dbUpdates.ai_model = updates.aiModel
    const { data, error } = await supabase
      .from('modules')
      .update(dbUpdates)
      .eq('id', moduleId)
      .select()
      .single()
    if (error) throw error
    return normalizeModule(data)
  },

  async deleteModule(moduleId) {
    await supabase.from('module_progress').delete().eq('module_id', moduleId)
    const { error } = await supabase.from('modules').delete().eq('id', moduleId)
    if (error) throw error
  }
}

// ============================================================
// moduleProgressApi
// ============================================================

const normalizeProgress = (row) => {
  if (!row) return null
  return {
    id: row.user_id + '_' + row.module_id,
    userId: row.user_id,
    user_id: row.user_id,
    moduleId: row.module_id,
    module_id: row.module_id,
    courseId: row.course_id,
    course_id: row.course_id,
    exchangeCount: row.exchange_count,
    exchange_count: row.exchange_count,
    completed: row.completed,
    completedAt: row.completed_at,
    completed_at: row.completed_at,
    startedAt: row.started_at,
    started_at: row.started_at,
    ...row
  }
}

export const moduleProgressApi = {
  async createOrGetProgress(userId, moduleId, courseId) {
    const { data: existing } = await supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single()
    if (existing) return normalizeProgress(existing)

    const { data, error } = await supabase
      .from('module_progress')
      .insert({
        user_id: userId,
        module_id: moduleId,
        course_id: courseId,
        exchange_count: 0,
        completed: false
      })
      .select()
      .single()
    if (error) throw error
    return normalizeProgress(data)
  },

  async getModuleProgress(userId, moduleId) {
    const { data, error } = await supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single()
    if (error) return null
    return normalizeProgress(data)
  },

  async getStudentModuleProgress(userId, courseId) {
    const { data, error } = await supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
    if (error) throw error
    const result = {}
    ;(data || []).forEach(row => { result[row.module_id] = normalizeProgress(row) })
    return result
  },

  async getCourseModuleProgress(courseId) {
    const { data, error } = await supabase
      .from('module_progress')
      .select('*')
      .eq('course_id', courseId)
    if (error) throw error
    return (data || []).map(normalizeProgress)
  },

  async incrementExchangeCount(userId, moduleId) {
    const { data: existing } = await supabase
      .from('module_progress')
      .select('exchange_count')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single()
    const newCount = (existing?.exchange_count || 0) + 1
    const { data, error } = await supabase
      .from('module_progress')
      .update({ exchange_count: newCount, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single()
    if (error) throw error
    return normalizeProgress(data)
  },

  async markComplete(userId, moduleId) {
    const { data, error } = await supabase
      .from('module_progress')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .select()
      .single()
    if (error) throw error
    return normalizeProgress(data)
  }
}

// ============================================================
// moduleChatApi
// ============================================================

export const moduleChatApi = {
  async getModuleChats(moduleId, userId) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('module_id', moduleId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []).map(normalizeChat)
  }
}

// ============================================================
// tutorialApi
// ============================================================

const normalizeTutorial = (row) => {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    description: row.content?.substring(0, 200),
    published: row.published,
    order: row.display_order,
    display_order: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...row
  }
}

export const tutorialApi = {
  async getPublishedTutorials() {
    const { data, error } = await supabase
      .from('tutorials')
      .select('*')
      .eq('published', true)
      .order('display_order')
    if (error) throw error
    return (data || []).map(normalizeTutorial)
  },

  async getTutorialBySlug(slug) {
    const { data, error } = await supabase.from('tutorials').select('*').eq('slug', slug).single()
    if (error) return null
    return normalizeTutorial(data)
  },

  async getAllTutorials() {
    const { data, error } = await supabase.from('tutorials').select('*').order('display_order')
    if (error) throw error
    return (data || []).map(normalizeTutorial)
  },

  async getTutorialById(id) {
    const { data, error } = await supabase.from('tutorials').select('*').eq('id', id).single()
    if (error) return null
    return normalizeTutorial(data)
  },

  async createTutorial(tutorialData) {
    const { data, error } = await supabase
      .from('tutorials')
      .insert({
        slug: tutorialData.slug,
        title: tutorialData.title,
        content: tutorialData.content || '',
        published: tutorialData.published || false,
        display_order: tutorialData.order || 0
      })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  },

  async updateTutorial(id, updates) {
    const dbUpdates = { updated_at: new Date().toISOString() }
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.content !== undefined) dbUpdates.content = updates.content
    if (updates.published !== undefined) dbUpdates.published = updates.published
    if (updates.order !== undefined) dbUpdates.display_order = updates.order
    const { error } = await supabase.from('tutorials').update(dbUpdates).eq('id', id)
    if (error) throw error
  },

  async deleteTutorial(id) {
    const { error } = await supabase.from('tutorials').delete().eq('id', id)
    if (error) throw error
  },

  async reorderTutorials(orderedItems) {
    for (const item of orderedItems) {
      await supabase.from('tutorials').update({ display_order: item.order }).eq('id', item.id)
    }
  },

  async seedFromStaticData(tutorialsData) {
    for (const t of tutorialsData) {
      await supabase.from('tutorials').upsert({
        slug: t.slug,
        title: t.title,
        content: t.content || '',
        published: t.published !== false,
        display_order: t.order || 0
      }, { onConflict: 'slug' })
    }
  }
}

// ============================================================
// paymentApi
// ============================================================

export const paymentApi = {
  async createCheckoutSession(userId, userEmail, courseCode) {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userEmail, courseCode })
    })
    if (!response.ok) throw new Error('Failed to create checkout session')
    return response.json()
  }
}

// ============================================================
// realtimeApi (Supabase Realtime subscriptions)
// ============================================================

export const realtimeApi = {
  subscribeToProjectChats(projectId, callback) {
    const channel = supabase
      .channel(`project-chats-${projectId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chats', filter: `project_id=eq.${projectId}` },
        async () => {
          const { data } = await supabase
            .from('chats')
            .select('*, reflections(*)')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true })
          callback((data || []).map(row => ({
            ...normalizeChat(row),
            reflection: row.reflections?.[0] || null
          })))
        }
      )
      .subscribe()
    supabase
      .from('chats')
      .select('*, reflections(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        callback((data || []).map(row => ({
          ...normalizeChat(row),
          reflection: row.reflections?.[0] || null
        })))
      })
    return () => { supabase.removeChannel(channel) }
  },

  subscribeToUserCourses(userId, callback) {
    const channel = supabase
      .channel(`user-courses-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'course_memberships', filter: `user_id=eq.${userId}` },
        async () => {
          const { data } = await supabase
            .from('course_memberships')
            .select('*, courses(*)')
            .eq('user_id', userId)
            .eq('status', 'approved')
          callback((data || []).map(m => ({
            ...normalizeCourse(m.courses),
            membership: normalizeMembership(m)
          })))
        }
      )
      .subscribe()
    supabase
      .from('course_memberships')
      .select('*, courses(*)')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .then(({ data }) => {
        callback((data || []).map(m => ({
          ...normalizeCourse(m.courses),
          membership: normalizeMembership(m)
        })))
      })
    return () => { supabase.removeChannel(channel) }
  }
}
