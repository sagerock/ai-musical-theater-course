import { supabase, supabaseAdmin } from '../config/supabase';

// Use admin client only for development - switch to regular client for production
const isDevelopment = process.env.NODE_ENV === 'development';
const hasServiceKey = !!process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const dbClient = (isDevelopment && hasServiceKey) ? supabaseAdmin : supabase;

// Helper function to get current Firebase UID for API calls
function getCurrentFirebaseUID() {
  return localStorage.getItem('firebase_uid') || null;
}

// User operations
export const userApi = {
  // Get user by ID
  async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user
  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all users (for instructors)
  async getAllUsers(courseId = null) {
    console.log('🔍 userApi.getAllUsers called with courseId:', courseId);
    
    let query = supabase
      .from('users')
      .select('*');

    // If courseId is provided, filter by course membership
    if (courseId) {
      console.log('🎯 Applying course filter for courseId:', courseId);
      
      // Check if course_memberships table exists
      try {
        const testQuery = await supabase.from('course_memberships').select('user_id').limit(1);
        if (!testQuery.error) {
          console.log('✅ course_memberships table exists, applying filter');
          
          // Get user IDs from course memberships first to avoid relationship conflicts
          const { data: memberships, error: memberError } = await supabase
            .from('course_memberships')
            .select('user_id')
            .eq('course_id', courseId)
            .eq('status', 'approved');
          
          if (memberError) {
            console.log('❌ Error getting course memberships:', memberError);
            throw memberError;
          }
          
          console.log('📊 Found course memberships:', memberships?.length || 0);
          
          if (memberships && memberships.length > 0) {
            const userIds = memberships.map(m => m.user_id);
            query = query.in('id', userIds);
            console.log('✅ Filtering users by course membership IDs:', userIds.length);
          } else {
            console.log('⚠️ No approved course members found, returning empty result');
            // Return a query that will match no users
            query = query.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        } else {
          console.log('❌ course_memberships table does not exist:', testQuery.error);
          console.log('🔄 Continuing without course filter (all users)');
        }
      } catch (error) {
        console.log('❌ Error checking course_memberships table:', error);
      }
    }

    query = query.order('created_at', { ascending: false });
    
    console.log('📊 Executing getAllUsers query...');
    const { data, error } = await query;
    
    console.log('📈 getAllUsers results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getAllUsers error:', error);
      throw error;
    }
    return data;
  }
};

// Project operations
export const projectApi = {
  // Create project
  async createProject(projectData, userId, courseId) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        created_by: userId,
        course_id: courseId
      })
      .select()
      .single();
    
    if (projectError) throw projectError;

    // Add creator as project admin
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: 'admin'
      });
    
    if (memberError) throw memberError;
    return project;
  },

  // Get user's projects (within a specific course)
  async getUserProjects(userId, courseId = null) {
    let query = supabase
      .from('projects')
      .select(`
        *,
        project_members!inner (
          role,
          joined_at
        )
      `)
      .eq('project_members.user_id', userId);
    
    // Only filter by course_id if courseId is provided and not null/undefined
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  // Get all projects (for instructors within a course)
  async getAllProjects(courseId = null) {
    console.log('🔍 projectApi.getAllProjects called with courseId:', courseId);
    
    let query = supabase
      .from('projects')
      .select(`
        *,
        users:created_by (name, email),
        project_members (
          users (name, email, role)
        )
      `);
    
    // Only filter by course_id if courseId is provided and not null/undefined
    if (courseId) {
      console.log('🎯 Applying course filter for courseId:', courseId);
      
      // Check if projects table has course_id column
      try {
        const testQuery = await supabase.from('projects').select('course_id').limit(1);
        if (!testQuery.error) {
          console.log('✅ projects table has course_id column, applying filter');
          query = query.eq('course_id', courseId);
        } else {
          console.log('❌ projects table missing course_id column:', testQuery.error);
          console.log('🔄 Continuing without course filter');
        }
      } catch (error) {
        console.log('❌ Error checking projects.course_id:', error);
      }
    }
    
    query = query.order('created_at', { ascending: false });

    console.log('📊 Executing getAllProjects query...');
    const { data, error } = await query;
    
    console.log('📈 getAllProjects results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getAllProjects error:', error);
      throw error;
    }
    return data;
  },

  // Get project by ID
  async getProjectById(projectId) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        users:created_by (name, email),
        project_members (
          users (id, name, email, role),
          role,
          joined_at
        )
      `)
      .eq('id', projectId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Add member to project
  async addProjectMember(projectId, userId, role = 'member') {
    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: role
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remove member from project
  async removeProjectMember(projectId, userId) {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  // Delete project (only by creator/admin)
  async deleteProject(projectId, userId) {
    // First check if user is the creator or an admin
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', projectId)
      .single();
    
    if (projectError) throw projectError;
    
    if (project.created_by !== userId) {
      throw new Error('Only the project creator can delete this project');
    }
    
    // Delete the project (this will cascade delete project_members and chats due to foreign keys)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) throw error;
  }
};

// Chat operations
export const chatApi = {
  // Create chat
  async createChat(chatData, courseId = null) {
    const insertData = {
      ...chatData,
      ...(courseId && { course_id: courseId })
    };

    const { data, error } = await supabase
      .from('chats')
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get chats for a project
  async getProjectChats(projectId, courseId = null, limit = 50, offset = 0) {
    let query = supabase
      .from('chats')
      .select(`
        *,
        users (name, email),
        chat_tags (
          tags (id, name)
        ),
        reflections (*)
      `)
      .eq('project_id', projectId);

    // Only filter by course_id if courseId is provided and not null/undefined
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  // Get user's chats
  async getUserChats(userId, courseId = null, limit = 50, offset = 0) {
    let query = supabase
      .from('chats')
      .select(`
        *,
        projects (title),
        chat_tags (
          tags (id, name)
        ),
        reflections (*)
      `)
      .eq('user_id', userId);

    // Only filter by course_id if courseId is provided and not null/undefined
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  // Get chat by ID
  async getChatById(chatId) {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        users (name, email),
        projects (title),
        chat_tags (
          tags (id, name)
        ),
        reflections (*)
      `)
      .eq('id', chatId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get chats with filters (for instructor dashboard)
  async getChatsWithFilters(filters = {}) {
    console.log('🔍 chatApi.getChatsWithFilters called with filters:', filters);
    
    let query = supabase
      .from('chats')
      .select(`
        *,
        users (name, email),
        projects (title),
        chat_tags (
          tags (id, name)
        ),
        reflections (*)
      `);

    // Apply course filter only if courseId is provided and not null/undefined
    if (filters.courseId) {
      console.log('🎯 Applying course filter for courseId:', filters.courseId);
      
      // Check if chats table has course_id column
      try {
        const testQuery = await supabase.from('chats').select('course_id').limit(1);
        if (!testQuery.error) {
          console.log('✅ chats table has course_id column, applying filter');
          query = query.eq('course_id', filters.courseId);
        } else {
          console.log('❌ chats table missing course_id column:', testQuery.error);
          console.log('🔄 Continuing without course filter');
        }
      } catch (error) {
        console.log('❌ Error checking chats.course_id:', error);
      }
    }

    // Apply other filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters.toolUsed) {
      query = query.eq('tool_used', filters.toolUsed);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    // Tag filtering - we'll handle this client-side since it involves joined data
    // The backend will return all chats and frontend will filter by tags

    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    console.log('📊 Executing getChatsWithFilters query...');
    const { data, error } = await query;
    
    console.log('📈 getChatsWithFilters results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    // Debug: Let's also check all chats without course filter
    if (data?.length === 0 && filters.courseId) {
      console.log('🔍 No chats found with course filter. Checking all chats...');
      const { data: allChats, error: allError } = await supabase
        .from('chats')
        .select('id, course_id, project_id, created_at')
        .limit(10);
      
      console.log('📊 All chats sample:', allChats?.length || 0, 'chats found');
      if (allChats?.length > 0) {
        console.log('📋 Sample chat data:', allChats.slice(0, 3));
        console.log('🎯 Current course ID we\'re filtering for:', filters.courseId);
        console.log('🔍 Course IDs in chat data:', allChats.map(chat => chat.course_id));
        console.log('🔍 Project IDs in chat data:', allChats.map(chat => chat.project_id));
      }
    }
    
    if (error) {
      console.error('❌ getChatsWithFilters error:', error);
      throw error;
    }
    return data;
  }
};

// Tag operations
export const tagApi = {
  // Get all tags (global + course-specific if courseId provided)
  async getAllTags(courseId = null) {
    console.log('🏷️ tagApi.getAllTags called with courseId:', courseId);
    
    let query = supabase
      .from('tags')
      .select('*')
      .order('name');

    if (courseId) {
      // Get both global tags (course_id is NULL) and course-specific tags
      query = query.or(`course_id.is.null,course_id.eq.${courseId}`);
      console.log('✅ Filtering tags for course + global tags');
    } else {
      // If no courseId provided, return only global tags for backward compatibility
      query = query.is('course_id', null);
      console.log('✅ Returning only global tags (backward compatibility)');
    }
    
    const { data, error } = await query;
    
    console.log('📊 getAllTags results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getAllTags error:', error);
      throw error;
    }
    return data;
  },

  // Get course-specific tags for management (instructors only)
  async getCourseTags(courseId) {
    console.log('🏷️ tagApi.getCourseTags called with courseId:', courseId);
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('course_id', courseId)
      .order('name');
    
    console.log('📊 getCourseTags results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getCourseTags error:', error);
      throw error;
    }
    return data;
  },

  // Create tag (course-specific or global)
  async createTag(tagData, courseId = null, userRole = null) {
    console.log('🏷️ tagApi.createTag called with:', { tagData, courseId, userRole });
    
    // Check permissions - only admins and instructors can create tags
    if (userRole && userRole === 'student') {
      throw new Error('Students are not allowed to create tags. Only instructors and admins can create tags.');
    }
    
    const insertData = {
      ...tagData,
      ...(courseId && { course_id: courseId })
    };

    const { data, error } = await supabase
      .from('tags')
      .insert(insertData)
      .select()
      .single();
    
    console.log('📊 createTag results:');
    console.log('  - data:', data);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ createTag error:', error);
      throw error;
    }
    return data;
  },

  // Update tag (instructors can only update course-specific tags they manage)
  async updateTag(tagId, updates, courseId = null) {
    console.log('🏷️ tagApi.updateTag called with:', { tagId, updates, courseId });
    
    let query = supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId);

    // If courseId is provided, ensure we only update tags belonging to that course
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    const { data, error } = await query
      .select()
      .single();
    
    console.log('📊 updateTag results:');
    console.log('  - data:', data);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ updateTag error:', error);
      throw error;
    }
    return data;
  },

  // Delete tag (instructors can only delete course-specific tags they manage)
  async deleteTag(tagId, courseId = null) {
    console.log('🏷️ tagApi.deleteTag called with:', { tagId, courseId });
    
    let query = supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    // If courseId is provided, ensure we only delete tags belonging to that course
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    const { error } = await query;
    
    console.log('📊 deleteTag results:');
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ deleteTag error:', error);
      throw error;
    }
  },

  // Add tags to chat
  async addTagsToChat(chatId, tagIds) {
    const chatTags = tagIds.map(tagId => ({
      chat_id: chatId,
      tag_id: tagId
    }));

    const { error } = await supabase
      .from('chat_tags')
      .insert(chatTags);
    
    if (error) throw error;
  },

  // Remove tags from chat
  async removeTagsFromChat(chatId, tagIds) {
    const { error } = await supabase
      .from('chat_tags')
      .delete()
      .eq('chat_id', chatId)
      .in('tag_id', tagIds);
    
    if (error) throw error;
  },

  // Get tag usage statistics for a course
  async getTagUsageStats(courseId = null) {
    console.log('🏷️ tagApi.getTagUsageStats called with courseId:', courseId);
    
    let query = supabase
      .from('chat_tags')
      .select(`
        tag_id,
        tags (name, course_id),
        count
      `)
      .order('count', { ascending: false });

    // If courseId provided, filter by course-specific and global tags
    if (courseId) {
      // This requires a join with chats table to filter by course
      // For now, we'll get all stats and filter in JavaScript
      // TODO: Optimize this query for better performance
    }
    
    const { data, error } = await query;
    
    console.log('📊 getTagUsageStats results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getTagUsageStats error:', error);
      throw error;
    }
    
    // Filter by course if needed
    if (courseId && data) {
      return data.filter(stat => 
        !stat.tags.course_id || stat.tags.course_id === courseId
      );
    }
    
    return data;
  }
};

// Reflection operations
export const reflectionApi = {
  // Create reflection
  async createReflection(reflectionData) {
    const { data, error } = await supabase
      .from('reflections')
      .insert(reflectionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update reflection
  async updateReflection(reflectionId, updates) {
    const { data, error } = await supabase
      .from('reflections')
      .update(updates)
      .eq('id', reflectionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get reflection by chat ID
  async getReflectionByChatId(chatId) {
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('chat_id', chatId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  },

  // Delete reflection
  async deleteReflection(reflectionId) {
    const { error } = await supabase
      .from('reflections')
      .delete()
      .eq('id', reflectionId);
    
    if (error) throw error;
  }
};

// Analytics operations
// Course operations
export const courseApi = {
  // Create course (admin only)
  async createCourse(courseData) {
    const { data, error } = await dbClient
      .from('courses')
      .insert(courseData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all courses (admin view)
  async getAllCourses() {
    try {
      // First, get courses without relationships
      const { data: courses, error: coursesError } = await dbClient
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (coursesError) throw coursesError;
      
      // Then get memberships separately
      const { data: memberships, error: membershipsError } = await dbClient
        .from('course_memberships')
        .select('*');
      
      if (membershipsError) {
        console.warn('Could not load memberships:', membershipsError);
        // Return courses without membership data
        return courses.map(course => ({
          ...course,
          course_memberships: []
        }));
      }
      
      // Get user data for all memberships
      const userIds = [...new Set(memberships.map(m => m.user_id))];
      let users = [];
      
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await dbClient
          .from('users')
          .select('id, name, email')
          .in('id', userIds);
        
        if (usersError) {
          console.warn('Could not load users:', usersError);
        } else {
          users = usersData || [];
        }
      }
      
      // Combine the data
      const coursesWithMemberships = courses.map(course => ({
        ...course,
        course_memberships: memberships
          .filter(m => m.course_id === course.id)
          .map(membership => ({
            ...membership,
            users: users.find(user => user.id === membership.user_id) || null
          }))
      }));
      
      return coursesWithMemberships;
    } catch (error) {
      console.error('getAllCourses error:', error);
      throw error;
    }
  },

  // Get course by code
  async getCourseByCode(courseCode) {
    const { data, error } = await dbClient
      .from('courses')
      .select('*')
      .eq('course_code', courseCode)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get course by ID
  async getCourseById(courseId) {
    const { data, error } = await dbClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's courses
  async getUserCourses(userId) {
    try {
      // Get user's approved memberships
      const { data: memberships, error: membershipsError } = await dbClient
        .from('course_memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .order('joined_at', { ascending: false });
      
      if (membershipsError) throw membershipsError;
      
      if (!memberships || memberships.length === 0) {
        return [];
      }
      
      // Get course data
      const courseIds = memberships.map(m => m.course_id);
      const { data: courses, error: coursesError } = await dbClient
        .from('courses')
        .select('*')
        .in('id', courseIds);
      
      if (coursesError) throw coursesError;
      
      // Combine the data
      const result = memberships.map(membership => ({
        ...membership,
        courses: courses.find(course => course.id === membership.course_id)
      }));
      
      return result;
    } catch (error) {
      console.error('Error in getUserCourses:', error);
      throw error;
    }
  },

  // Join course with code
  async joinCourse(courseCode, userId, role = 'student') {
    try {
      // First, get the course
      const course = await this.getCourseByCode(courseCode);
      
      // Check if user already has membership in this course
      const { data: existingMembership } = await dbClient
        .from('course_memberships')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', userId)
        .single();
      
      if (existingMembership) {
        throw new Error('User already exists in this course');
      }
      
      // Create membership
      const { data, error } = await dbClient
        .from('course_memberships')
        .insert({
          course_id: course.id,
          user_id: userId,
          role: role,
          status: 'pending' // All memberships need approval
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in joinCourse:', error);
      throw error;
    }
  },

  // Clean up orphaned course memberships (admin function)
  async cleanupOrphanedMemberships() {
    try {
      console.log('🧹 Starting cleanup of orphaned course memberships...');
      
      // Find memberships with null user_id
      const { data: orphanedMemberships, error: findError } = await dbClient
        .from('course_memberships')
        .select('id, course_id, user_id, role')
        .is('user_id', null);
      
      if (findError) throw findError;
      
      console.log('📊 Found orphaned memberships:', orphanedMemberships?.length || 0);
      
      if (!orphanedMemberships || orphanedMemberships.length === 0) {
        return { deleted: 0, message: 'No orphaned memberships found' };
      }
      
      // Delete orphaned memberships
      const { error: deleteError } = await dbClient
        .from('course_memberships')
        .delete()
        .is('user_id', null);
      
      if (deleteError) throw deleteError;
      
      console.log('✅ Cleanup complete. Deleted:', orphanedMemberships.length, 'orphaned memberships');
      
      return { 
        deleted: orphanedMemberships.length, 
        message: `Successfully cleaned up ${orphanedMemberships.length} orphaned membership records` 
      };
    } catch (error) {
      console.error('❌ Error in cleanupOrphanedMemberships:', error);
      throw error;
    }
  },

  // Join trial course with auto-approval
  async joinTrialCourse(courseCode, userId, role = 'student') {
    try {
      // First, get the course
      const course = await this.getCourseByCode(courseCode);
      
      // Check if user already has membership in this course
      const { data: existingMembership } = await dbClient
        .from('course_memberships')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', userId)
        .single();
      
      if (existingMembership) {
        // If membership exists but is pending, auto-approve it for trial course
        if (existingMembership.status === 'pending') {
          const { data: updatedMembership, error: updateError } = await dbClient
            .from('course_memberships')
            .update({ status: 'approved' })
            .eq('id', existingMembership.id)
            .select()
            .single();
          
          if (updateError) throw updateError;
          return updatedMembership;
        }
        throw new Error('User already exists in this course');
      }
      
      // Create membership with auto-approval for trial course
      const { data, error } = await dbClient
        .from('course_memberships')
        .insert({
          course_id: course.id,
          user_id: userId,
          role: role,
          status: 'approved' // Auto-approve for trial course
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in joinTrialCourse:', error);
      throw error;
    }
  },

  // Get pending approvals for instructor
  async getPendingApprovals(courseId, instructorId) {
    try {
      // Get pending memberships and user data separately to avoid relationship conflicts
      const { data: memberships, error: membershipsError } = await dbClient
        .from('course_memberships')
        .select('*')
        .eq('course_id', courseId)
        .eq('status', 'pending')
        .order('joined_at', { ascending: true });
      
      if (membershipsError) throw membershipsError;
      
      if (!memberships || memberships.length === 0) {
        return [];
      }
      
      // Get user data for all pending members
      const userIds = memberships.map(m => m.user_id);
      const { data: users, error: usersError } = await dbClient
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      
      if (usersError) throw usersError;
      
      // Get course data
      const { data: course, error: courseError } = await dbClient
        .from('courses')
        .select('name')
        .eq('id', courseId)
        .single();
      
      if (courseError) throw courseError;
      
      // Combine the data
      const result = memberships.map(membership => ({
        ...membership,
        users: users.find(user => user.id === membership.user_id),
        courses: course
      }));
      
      return result;
    } catch (error) {
      console.error('Error in getPendingApprovals:', error);
      throw error;
    }
  },

  // Approve/reject course membership
  async updateMembershipStatus(membershipId, status, approvedBy) {
    const { data, error } = await dbClient
      .from('course_memberships')
      .update({
        status: status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        approved_by: status === 'approved' ? approvedBy : null
      })
      .eq('id', membershipId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get course members
  async getCourseMembers(courseId) {
    try {
      // Get approved memberships with valid user_id
      const { data: memberships, error: membershipsError } = await dbClient
        .from('course_memberships')
        .select('*')
        .eq('course_id', courseId)
        .eq('status', 'approved')
        .not('user_id', 'is', null)
        .order('role', { ascending: true });
      
      if (membershipsError) throw membershipsError;
      
      if (!memberships || memberships.length === 0) {
        return [];
      }
      
      // Get user data
      const userIds = memberships.map(m => m.user_id);
      const { data: users, error: usersError } = await dbClient
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      
      if (usersError) throw usersError;
      
      // Combine the data
      const result = memberships.map(membership => {
        const userMatch = users.find(user => user.id === membership.user_id);
        if (!userMatch) {
          console.warn('⚠️ getCourseMembers: No user found for membership:', membership);
        }
        return {
          ...membership,
          users: userMatch
        };
      });
      
      console.log('📊 getCourseMembers result:', result);
      return result;
    } catch (error) {
      console.error('Error in getCourseMembers:', error);
      throw error;
    }
  },

  // Add instructor directly to course (admin function)
  async addInstructorToCourse(courseId, instructorEmail, role = 'instructor') {
    try {
      // First, find the user by email
      const { data: user, error: userError } = await dbClient
        .from('users')
        .select('id')
        .eq('email', instructorEmail)
        .single();

      if (userError) {
        throw new Error(`User with email ${instructorEmail} not found`);
      }

      // Add them to the course with approved status
      const { data, error } = await dbClient
        .from('course_memberships')
        .insert({
          course_id: courseId,
          user_id: user.id,
          role: role,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: getCurrentFirebaseUID()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding instructor to course:', error);
      throw error;
    }
  },

  // Generate unique course code
  async generateCourseCode(courseName, semester, year) {
    try {
      const { data, error } = await dbClient
        .rpc('generate_course_code', {
          course_name: courseName,
          semester: semester,
          year: year
        });
      
      if (error) {
        console.error('RPC function error:', error);
        // Fallback: generate code client-side
        const baseCode = courseName.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase() + 
                        '-' + 
                        (semester === 'Spring' ? 'SP' : semester === 'Fall' ? 'F' : 'SU') + 
                        year.toString().slice(-2);
        
        // Add random suffix to ensure uniqueness
        return baseCode + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
      }
      
      return data;
    } catch (error) {
      console.error('Course code generation error:', error);
      // Fallback method
      const baseCode = courseName.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase() + 
                      '-' + 
                      (semester === 'Spring' ? 'SP' : semester === 'Fall' ? 'F' : 'SU') + 
                      year.toString().slice(-2);
      
      return baseCode + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
    }
  },

  // Update course details
  async updateCourse(courseId, updates) {
    const { data, error } = await dbClient
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update member role in course
  async updateMemberRole(membershipId, newRole) {
    const { data, error } = await dbClient
      .from('course_memberships')
      .update({ role: newRole })
      .eq('id', membershipId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remove member from course
  async removeMemberFromCourse(membershipId) {
    const { error } = await dbClient
      .from('course_memberships')
      .delete()
      .eq('id', membershipId);
    
    if (error) throw error;
  },

  // Delete course (admin only - also deletes all related data)
  async deleteCourse(courseId) {
    // Note: This will cascade delete memberships, projects, chats, etc.
    // due to foreign key constraints
    const { error } = await dbClient
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) throw error;
  },

  // Fix chat course linkage (repair orphaned chats)
  async fixChatCourseLinkage() {
    try {
      console.log('🔧 Starting chat course linkage repair...');
      
      // Get all chats with null course_id but valid project_id
      const { data: orphanedChats, error: chatError } = await dbClient
        .from('chats')
        .select('id, project_id')
        .is('course_id', null)
        .not('project_id', 'is', null);
      
      if (chatError) throw chatError;
      
      console.log(`📊 Found ${orphanedChats?.length || 0} orphaned chats`);
      
      if (!orphanedChats || orphanedChats.length === 0) {
        console.log('✅ No orphaned chats found');
        return { fixed: 0 };
      }
      
      // Get project course mappings for these chats
      const projectIds = [...new Set(orphanedChats.map(chat => chat.project_id))];
      const { data: projects, error: projectError } = await dbClient
        .from('projects')
        .select('id, course_id')
        .in('id', projectIds)
        .not('course_id', 'is', null);
      
      if (projectError) throw projectError;
      
      console.log(`📊 Found ${projects?.length || 0} projects with course links`);
      
      let fixedCount = 0;
      
      // Update chats with correct course_id
      for (const project of projects || []) {
        const chatsToUpdate = orphanedChats.filter(chat => chat.project_id === project.id);
        
        if (chatsToUpdate.length > 0) {
          const { error: updateError } = await dbClient
            .from('chats')
            .update({ course_id: project.course_id })
            .in('id', chatsToUpdate.map(chat => chat.id));
          
          if (updateError) {
            console.error(`❌ Error updating chats for project ${project.id}:`, updateError);
          } else {
            fixedCount += chatsToUpdate.length;
            console.log(`✅ Fixed ${chatsToUpdate.length} chats for project ${project.id}`);
          }
        }
      }
      
      console.log(`🎉 Successfully fixed ${fixedCount} chat course linkages`);
      return { fixed: fixedCount };
      
    } catch (error) {
      console.error('❌ Error fixing chat course linkage:', error);
      throw error;
    }
  }
};

export const analyticsApi = {
  // Get user activity summary
  async getUserActivitySummary(userId) {
    const { data, error } = await supabase
      .rpc('get_user_activity_summary', { user_id: userId });
    
    if (error) throw error;
    return data;
  },

  // Get project activity summary
  async getProjectActivitySummary(projectId) {
    const { data, error } = await supabase
      .rpc('get_project_activity_summary', { project_id: projectId });
    
    if (error) throw error;
    return data;
  },

  // Get overall statistics (for instructors)
  async getOverallStats(courseId = null) {
    console.log('🔍 analyticsApi.getOverallStats called with courseId:', courseId);
    
    let chatsQuery = supabase.from('chats').select('id', { count: 'exact', head: true });
    let usersQuery = supabase.from('users').select('id', { count: 'exact', head: true });
    let projectsQuery = supabase.from('projects').select('id', { count: 'exact', head: true });
    let reflectionQuery = supabase.from('chats').select(`id, reflections (id)`);

    // Apply course filter if provided - but first check if course_id columns exist
    if (courseId) {
      console.log('🎯 Applying course filter for courseId:', courseId);
      
      // Check if chats table has course_id column
      try {
        const testChatQuery = await supabase.from('chats').select('course_id').limit(1);
        if (!testChatQuery.error) {
          console.log('✅ chats table has course_id column');
          chatsQuery = chatsQuery.eq('course_id', courseId);
          reflectionQuery = reflectionQuery.eq('course_id', courseId);
        } else {
          console.log('❌ chats table missing course_id column:', testChatQuery.error);
        }
      } catch (error) {
        console.log('❌ Error checking chats.course_id:', error);
      }

      // Check if projects table has course_id column
      try {
        const testProjectQuery = await supabase.from('projects').select('course_id').limit(1);
        if (!testProjectQuery.error) {
          console.log('✅ projects table has course_id column');
          projectsQuery = projectsQuery.eq('course_id', courseId);
        } else {
          console.log('❌ projects table missing course_id column:', testProjectQuery.error);
        }
      } catch (error) {
        console.log('❌ Error checking projects.course_id:', error);
      }

      // Check if course_memberships table exists
      try {
        const testMembershipQuery = await supabase.from('course_memberships').select('user_id').limit(1);
        if (!testMembershipQuery.error) {
          console.log('✅ course_memberships table exists');
          usersQuery = supabase
            .from('course_memberships')
            .select('user_id', { count: 'exact', head: true })
            .eq('course_id', courseId)
            .eq('status', 'approved');
        } else {
          console.log('❌ course_memberships table does not exist:', testMembershipQuery.error);
          // Fallback: count all users when no course system
          console.log('🔄 Using fallback: counting all users');
        }
      } catch (error) {
        console.log('❌ Error checking course_memberships table:', error);
      }
    }

    console.log('📊 Executing queries...');
    const [
      { count: totalChats, error: chatsError },
      { count: totalUsers, error: usersError },
      { count: totalProjects, error: projectsError },
      { data: reflectionRate, error: reflectionError }
    ] = await Promise.all([
      chatsQuery,
      usersQuery,
      projectsQuery,
      reflectionQuery
    ]);

    console.log('📈 Query results:');
    console.log('  - totalChats:', totalChats, chatsError ? `(Error: ${chatsError.message})` : '');
    console.log('  - totalUsers:', totalUsers, usersError ? `(Error: ${usersError.message})` : '');
    console.log('  - totalProjects:', totalProjects, projectsError ? `(Error: ${projectsError.message})` : '');
    console.log('  - reflectionRate data length:', reflectionRate?.length, reflectionError ? `(Error: ${reflectionError.message})` : '');

    if (chatsError || usersError || projectsError || reflectionError) {
      console.error('❌ Query errors detected');
      throw chatsError || usersError || projectsError || reflectionError;
    }

    const chatsWithReflections = reflectionRate?.filter(chat => chat.reflections.length > 0).length || 0;
    const totalChatsCount = reflectionRate?.length || 0;
    
    const stats = {
      totalChats: totalChats || 0,
      totalUsers: totalUsers || 0,
      totalProjects: totalProjects || 0,
      reflectionCompletionRate: totalChatsCount > 0 ? (chatsWithReflections / totalChatsCount) * 100 : 0
    };

    console.log('📊 Final stats:', stats);
    return stats;
  }
};

// Instructor Notes operations
export const instructorNotesApi = {
  // Create instructor note
  async createNote(noteData) {
    console.log('📝 instructorNotesApi.createNote called with:', noteData);
    
    const { data, error } = await supabase
      .from('instructor_notes')
      .insert(noteData)
      .select()
      .single();
    
    console.log('📊 createNote results:');
    console.log('  - data:', data);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ createNote error:', error);
      throw error;
    }
    return data;
  },

  // Get notes for a project
  async getProjectNotes(projectId) {
    console.log('📝 instructorNotesApi.getProjectNotes called with projectId:', projectId);
    
    const { data, error } = await supabase
      .from('instructor_notes')
      .select(`
        *,
        users!instructor_id (name, email)
      `)
      .eq('project_id', projectId)
      .eq('is_visible_to_student', true)
      .order('created_at', { ascending: false });
    
    console.log('📊 getProjectNotes results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getProjectNotes error:', error);
      throw error;
    }
    return data || [];
  },

  // Get notes by instructor for a course
  async getInstructorNotes(instructorId, courseId = null) {
    console.log('📝 instructorNotesApi.getInstructorNotes called with:', { instructorId, courseId });
    
    let query = supabase
      .from('instructor_notes')
      .select(`
        *,
        projects!project_id (title, created_by),
        courses!course_id (name)
      `)
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    const { data, error } = await query;
    
    console.log('📊 getInstructorNotes results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getInstructorNotes error:', error);
      throw error;
    }
    return data || [];
  },

  // Update instructor note
  async updateNote(noteId, updates, instructorId) {
    console.log('📝 instructorNotesApi.updateNote called with:', { noteId, updates, instructorId });
    
    const { data, error } = await supabase
      .from('instructor_notes')
      .update(updates)
      .eq('id', noteId)
      .eq('instructor_id', instructorId) // Ensure only the author can update
      .select()
      .single();
    
    console.log('📊 updateNote results:');
    console.log('  - data:', data);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ updateNote error:', error);
      throw error;
    }
    return data;
  },

  // Delete instructor note
  async deleteNote(noteId, instructorId) {
    console.log('📝 instructorNotesApi.deleteNote called with:', { noteId, instructorId });
    
    const { error } = await supabase
      .from('instructor_notes')
      .delete()
      .eq('id', noteId)
      .eq('instructor_id', instructorId); // Ensure only the author can delete
    
    console.log('📊 deleteNote results:');
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ deleteNote error:', error);
      throw error;
    }
  },

  // Get notes for instructor dashboard (with project and student info)
  async getNotesForDashboard(instructorId, courseId) {
    console.log('📝 instructorNotesApi.getNotesForDashboard called with:', { instructorId, courseId });
    
    const { data, error } = await supabase
      .from('instructor_notes')
      .select(`
        *,
        projects!project_id (
          title,
          created_by,
          users!created_by (name, email)
        )
      `)
      .eq('instructor_id', instructorId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    
    console.log('📊 getNotesForDashboard results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getNotesForDashboard error:', error);
      throw error;
    }
    return data || [];
  }
}; 