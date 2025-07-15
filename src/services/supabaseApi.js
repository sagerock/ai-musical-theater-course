import { supabase, supabaseAdmin } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';

// Use admin client only for development - switch to regular client for production
const isDevelopment = process.env.NODE_ENV === 'development';
const hasServiceKey = !!process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const dbClient = (isDevelopment && hasServiceKey) ? supabaseAdmin : supabase;

// DIRECT ADMIN CLIENT - bypasses any configuration issues
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const serviceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

const directAdminClient = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// For attachments, use direct admin client to bypass RLS issues
const attachmentClient = directAdminClient;

// IMMEDIATE DEBUG - This will run when the file loads
console.log('🚀 SUPABASE API MODULE LOADED');
console.log('🚀 DIRECT ADMIN CLIENT CREATED');
console.log('  - URL:', supabaseUrl);
console.log('  - Service key starts with:', serviceKey.substring(0, 20) + '...');
console.log('  - Client created successfully:', !!directAdminClient);
console.log('🔐 ATTACHMENT CLIENT VERIFICATION:');
console.log('  - Using direct admin client:', attachmentClient === directAdminClient);
console.log('  - Ready for PDF operations');

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
    
    // If courseId is provided, get users with their course-specific roles
    if (courseId) {
      console.log('🎯 Getting users with course-specific roles for courseId:', courseId);
      
      try {
        // Join users with course_memberships to get course-specific roles
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            course_memberships!inner (
              role,
              status,
              course_id
            )
          `)
          .eq('course_memberships.course_id', courseId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ getAllUsers error:', error);
          console.log('🔄 Falling back to manual filtering due to relationship error');
          // Don't throw error - fall back to manual filtering
        } else {
          // Only use the data if there's no error
          // Flatten the course_memberships data to add course_role and status to each user
          const usersWithCourseRole = data.map(user => ({
            ...user,
            course_role: user.course_memberships?.[0]?.role || 'student',
            status: user.course_memberships?.[0]?.status || 'pending'
          }));
          
          console.log('📈 getAllUsers results:');
          console.log('  - data length:', usersWithCourseRole?.length || 0);
          console.log('  - course roles:', usersWithCourseRole.map(u => `${u.name}: ${u.course_role}`));
          
          return usersWithCourseRole;
        }
        
      } catch (error) {
        console.log('❌ Error getting users with course roles:', error);
        // Fallback to original method
        console.log('🔄 Falling back to original method');
      }
    }

    // Fallback for no courseId or if course-specific query fails
    if (courseId) {
      // For course-specific requests, we need to filter by course membership
      console.log('🔄 Fallback: Manually filtering users by course membership...');
      
      // Get all users first
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.error('❌ getAllUsers error:', usersError);
        throw usersError;
      }
      
      // Get course memberships for this course
      const { data: memberships, error: membershipsError } = await supabase
        .from('course_memberships')
        .select('user_id, role, status')
        .eq('course_id', courseId);
      
      if (membershipsError) {
        console.error('❌ Course memberships error:', membershipsError);
        throw membershipsError;
      }
      
      // Create a map of user_id -> {course_role, status}
      const membershipMap = memberships.reduce((acc, membership) => {
        acc[membership.user_id] = {
          role: membership.role,
          status: membership.status
        };
        return acc;
      }, {});
      
      // Filter users who have course membership and add course_role and status
      const courseUsers = allUsers
        .filter(user => membershipMap[user.id])
        .map(user => ({
          ...user,
          course_role: membershipMap[user.id].role,
          status: membershipMap[user.id].status
        }));
      
      console.log('📊 Fallback query results:');
      console.log('  - Total users:', allUsers.length);
      console.log('  - Course memberships:', memberships.length);
      console.log('  - Course users:', courseUsers.length);
      
      return courseUsers;
    } else {
      // No courseId, return all users
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📊 Executing getAllUsers query (no course filter)...');
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
  },

  // Approve student enrollment
  async approveStudentEnrollment(userId, courseId, instructorId) {
    console.log('✅ API approveStudentEnrollment called:', { userId, courseId, instructorId });
    
    try {
      // First, verify the instructor has permission for this course
      console.log('🔍 Checking instructor permissions...');
      const { data: instructorMembership, error: instructorError } = await supabase
        .from('course_memberships')
        .select('role')
        .eq('user_id', instructorId)
        .eq('course_id', courseId)
        .eq('status', 'approved')
        .single();
      
      console.log('👨‍🏫 Instructor membership check result:', { instructorMembership, instructorError });
      
      if (instructorError || !instructorMembership || instructorMembership.role !== 'instructor') {
        const errorMsg = 'Unauthorized: You must be an instructor for this course';
        console.error('❌ Authorization failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('✅ Instructor authorized, proceeding with student approval...');
      
      // Update the student's status to approved
      const { data, error } = await supabase
        .from('course_memberships')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating student status:', error);
        throw error;
      }
      
      console.log('✅ Student approved successfully:', data);
      return data;
      
    } catch (error) {
      console.error('❌ approveStudentEnrollment error:', error);
      throw error;
    }
  },

  // Reject student enrollment
  async rejectStudentEnrollment(userId, courseId, instructorId) {
    console.log('❌ API rejectStudentEnrollment called:', { userId, courseId, instructorId });
    
    try {
      // First, verify the instructor has permission for this course
      console.log('🔍 Checking instructor permissions...');
      const { data: instructorMembership, error: instructorError } = await supabase
        .from('course_memberships')
        .select('role')
        .eq('user_id', instructorId)
        .eq('course_id', courseId)
        .eq('status', 'approved')
        .single();
      
      console.log('👨‍🏫 Instructor membership check result:', { instructorMembership, instructorError });
      
      if (instructorError || !instructorMembership || instructorMembership.role !== 'instructor') {
        const errorMsg = 'Unauthorized: You must be an instructor for this course';
        console.error('❌ Authorization failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('✅ Instructor authorized, proceeding with student rejection...');
      
      // Remove the student from the course (reject = remove)
      const { error } = await supabase
        .from('course_memberships')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);
      
      if (error) {
        console.error('❌ Error rejecting student:', error);
        throw error;
      }
      
      console.log('✅ Student rejected successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ rejectStudentEnrollment error:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const { data, error } = await dbClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  },

  // Get user email settings
  async getUserEmailSettings(userId) {
    try {
      const { data, error } = await dbClient
        .from('users')
        .select('email_notifications_enabled, instructor_note_emails, new_project_emails, weekly_summary_emails, system_update_emails')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Return default settings if user settings don't exist
      return {
        email_notifications_enabled: data?.email_notifications_enabled ?? true,
        instructor_note_emails: data?.instructor_note_emails ?? true,
        new_project_emails: data?.new_project_emails ?? true,
        weekly_summary_emails: data?.weekly_summary_emails ?? false,
        system_update_emails: data?.system_update_emails ?? true
      };
    } catch (error) {
      console.error('Error getting user email settings:', error);
      // Return default settings on error
      return {
        email_notifications_enabled: true,
        instructor_note_emails: true,
        new_project_emails: true,
        weekly_summary_emails: false,
        system_update_emails: true
      };
    }
  },

  // Update user email settings
  async updateUserEmailSettings(userId, settings) {
    try {
      const { data, error } = await dbClient
        .from('users')
        .update({
          email_notifications_enabled: settings.email_notifications_enabled,
          instructor_note_emails: settings.instructor_note_emails,
          new_project_emails: settings.new_project_emails,
          weekly_summary_emails: settings.weekly_summary_emails,
          system_update_emails: settings.system_update_emails,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user email settings:', error);
      throw error;
    }
  },

  // Check if user has email notifications enabled
  async hasEmailNotificationsEnabled(userId, notificationType = 'email_notifications_enabled') {
    try {
      const settings = await this.getUserEmailSettings(userId);
      return settings.email_notifications_enabled && settings[notificationType];
    } catch (error) {
      console.error('Error checking email notification settings:', error);
      return false; // Fail safe - don't send emails if we can't check settings
    }
  },

  // Update user profile
  async updateUserProfile(userId, profileData) {
    try {
      const updateData = {
        updated_at: new Date().toISOString(),
        ...profileData
      };

      const { data, error } = await dbClient
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ User profile updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await dbClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
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
  },

  // Get user project count for a course
  async getUserProjectCount(userId, courseId) {
    try {
      const { data, error } = await dbClient
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('course_id', courseId);
      
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error getting user project count:', error);
      return 0;
    }
  },

  // Get course project count
  async getCourseProjectCount(courseId) {
    try {
      const { data, error } = await dbClient
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('course_id', courseId);
      
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error getting course project count:', error);
      return 0;
    }
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
    
    try {
      // First, try the relationship query with nested data
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

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      console.log('📊 Executing getChatsWithFilters query...');
      const { data, error } = await query;
      
      console.log('📈 getChatsWithFilters results:');
      console.log('  - data length:', data?.length || 0);
      console.log('  - error:', error?.message || 'none');
      
      // If the relationship query failed, try a manual join approach
      if (error) {
        console.log('⚠️ Relationship query failed, trying manual join approach...');
        return await this.getChatsWithManualJoin(filters);
      }
      
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
      
      return data;
    } catch (error) {
      console.error('❌ getChatsWithFilters error:', error);
      console.log('⚠️ Trying manual join approach as fallback...');
      return await this.getChatsWithManualJoin(filters);
    }
  },

  // Fallback method for when relationship queries fail due to RLS
  async getChatsWithManualJoin(filters = {}) {
    console.log('🔧 chatApi.getChatsWithManualJoin called with filters:', filters);
    
    try {
      // Get basic chat data first
      let query = supabase
        .from('chats')
        .select(`
          id,
          user_id,
          project_id,
          tool_used,
          user_message,
          ai_response,
          created_at,
          updated_at,
          has_reflection,
          course_id
        `);

      // Apply the same filters as the main method
      if (filters.courseId) {
        try {
          const testQuery = await supabase.from('chats').select('course_id').limit(1);
          if (!testQuery.error) {
            query = query.eq('course_id', filters.courseId);
          }
        } catch (error) {
          console.log('❌ Error checking chats.course_id in manual join:', error);
        }
      }

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

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data: chats, error: chatsError } = await query;
      
      if (chatsError) {
        console.error('❌ Manual join chats query failed:', chatsError);
        throw chatsError;
      }

      if (!chats || chats.length === 0) {
        console.log('📊 No chats found in manual join');
        return [];
      }

      console.log('✅ Manual join got', chats.length, 'chats');

      // Get unique user IDs and project IDs
      const userIds = [...new Set(chats.map(chat => chat.user_id).filter(Boolean))];
      const projectIds = [...new Set(chats.map(chat => chat.project_id).filter(Boolean))];

      console.log('🔍 Need to fetch', userIds.length, 'users and', projectIds.length, 'projects');

      // Fetch users and projects in parallel
      const [usersResult, projectsResult] = await Promise.allSettled([
        userIds.length > 0 ? supabase.from('users').select('id, name, email').in('id', userIds) : Promise.resolve({ data: [], error: null }),
        projectIds.length > 0 ? supabase.from('projects').select('id, title').in('id', projectIds) : Promise.resolve({ data: [], error: null })
      ]);

      // Process results
      const users = usersResult.status === 'fulfilled' && usersResult.value.data ? usersResult.value.data : [];
      const projects = projectsResult.status === 'fulfilled' && projectsResult.value.data ? projectsResult.value.data : [];

      console.log('📊 Fetched', users.length, 'users and', projects.length, 'projects');

      // Create lookup maps
      const userMap = new Map(users.map(user => [user.id, user]));
      const projectMap = new Map(projects.map(project => [project.id, project]));

      // Combine data
      const enrichedChats = chats.map(chat => ({
        ...chat,
        users: chat.user_id ? userMap.get(chat.user_id) || null : null,
        projects: chat.project_id ? projectMap.get(chat.project_id) || null : null,
        // Add empty structures for other relationships to match expected format
        chat_tags: [],
        reflections: []
      }));

      console.log('✅ Manual join completed successfully');
      return enrichedChats;

    } catch (error) {
      console.error('❌ Manual join failed:', error);
      throw error;
    }
  },
  
  // Update chat
  async updateChat(chatId, updates) {
    console.log('💬 chatApi.updateChat called with:', { chatId, updates });
    
    const { data, error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', chatId)
      .select()
      .single();
    
    console.log('📊 updateChat results:');
    console.log('  - data:', data ? 'updated' : 'none');
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ updateChat error:', error);
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
  },

  // Get instructor emails for a course
  async getCourseInstructorEmails(courseId) {
    try {
      const { data, error } = await dbClient
        .from('course_memberships')
        .select(`
          users:user_id (
            email
          )
        `)
        .eq('course_id', courseId)
        .eq('role', 'instructor')
        .eq('status', 'approved')
        .not('user_id', 'is', null);
      
      if (error) throw error;
      
      return data
        .map(membership => membership.users?.email)
        .filter(email => email); // Filter out null/undefined emails
    } catch (error) {
      console.error('Error getting course instructor emails:', error);
      return [];
    }
  },

  // Get course by ID
  async getCourseById(courseId) {
    try {
      const { data, error } = await dbClient
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting course by ID:', error);
      throw error;
    }
  },

  // Remove student from course (instructor only)
  async removeStudentFromCourse(userId, courseId, instructorId) {
    console.log('🗑️ API removeStudentFromCourse called:', { userId, courseId, instructorId });
    
    try {
      // First, verify the instructor has permission for this course
      console.log('🔍 Checking instructor permissions...');
      const { data: instructorMembership, error: instructorError } = await supabase
        .from('course_memberships')
        .select('role')
        .eq('user_id', instructorId)
        .eq('course_id', courseId)
        .eq('status', 'approved')
        .single();
      
      console.log('👨‍🏫 Instructor membership check result:', { instructorMembership, instructorError });
      
      if (instructorError || !instructorMembership || instructorMembership.role !== 'instructor') {
        const errorMsg = 'Unauthorized: You must be an instructor for this course';
        console.error('❌ Authorization failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('✅ Instructor authorized, proceeding with student removal...');
      
      // Remove the student's course membership
      const { error: removeError } = await supabase
        .from('course_memberships')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);
      
      console.log('🗑️ Delete operation result:', { removeError });
      
      if (removeError) {
        console.error('❌ Error removing student from course:', removeError);
        throw removeError;
      }
      
      console.log('✅ Student removed from course successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ removeStudentFromCourse error:', error);
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
  },

  // Export chat data as CSV
  async exportChatData(instructorId, courseId, filters = {}) {
    console.log('📊 analyticsApi.exportChatData called with:', { instructorId, courseId, filters });
    
    try {
      // Use the existing getChatsWithFilters function to get chat data
      const chatFilters = {
        ...filters,
        courseId: courseId
      };
      
      const chatData = await chatApi.getChatsWithFilters(chatFilters);
      
      console.log('📈 Retrieved chat data:', chatData?.length || 0, 'chats');
      
      if (!chatData || chatData.length === 0) {
        console.log('📊 No chat data found for export');
        return 'Student Name,Student Email,Project Title,Tool Used,Message Preview,Date,Reflection Status,Tags\n';
      }
      
      // Helper function to safely escape CSV values
      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // If the value contains commas, quotes, or newlines, wrap it in quotes and escape internal quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };
      
      // Helper function to format date
      const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
          return dateString;
        }
      };
      
      // Helper function to create message preview
      const createMessagePreview = (prompt) => {
        if (!prompt) return '';
        // Remove extra whitespace and limit to 100 characters
        const cleanPrompt = prompt.replace(/\s+/g, ' ').trim();
        return cleanPrompt.length > 100 ? cleanPrompt.substring(0, 100) + '...' : cleanPrompt;
      };
      
      // Helper function to format tags
      const formatTags = (chatTags) => {
        if (!chatTags || !Array.isArray(chatTags)) return '';
        return chatTags
          .map(chatTag => chatTag.tags?.name)
          .filter(Boolean)
          .join('; ');
      };
      
      // Create CSV header
      const csvHeader = 'Student Name,Student Email,Project Title,Tool Used,Message Preview,Date,Reflection Status,Tags\n';
      
      // Create CSV rows
      const csvRows = chatData.map(chat => {
        const studentName = escapeCsvValue(chat.users?.name || 'Unknown Student');
        const studentEmail = escapeCsvValue(chat.users?.email || 'Unknown Email');
        const projectTitle = escapeCsvValue(chat.projects?.title || 'Unknown Project');
        const toolUsed = escapeCsvValue(chat.tool_used || 'Unknown Tool');
        const messagePreview = escapeCsvValue(createMessagePreview(chat.prompt));
        const date = escapeCsvValue(formatDate(chat.created_at));
        const reflectionStatus = escapeCsvValue(
          chat.reflections && chat.reflections.length > 0 ? 'Completed' : 'Not Completed'
        );
        const tags = escapeCsvValue(formatTags(chat.chat_tags));
        
        return `${studentName},${studentEmail},${projectTitle},${toolUsed},${messagePreview},${date},${reflectionStatus},${tags}`;
      });
      
      // Combine header and rows
      const csvString = csvHeader + csvRows.join('\n');
      
      console.log('📊 CSV export complete:', csvRows.length, 'rows generated');
      
      return csvString;
      
    } catch (error) {
      console.error('❌ exportChatData error:', error);
      throw error;
    }
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

// Helper function to create PDF summary for large documents
function createPDFSummary(fullText, fileName) {
  const pages = fullText.split(/--- Page \d+ ---/);
  const totalPages = pages.length - 1; // First split is empty
  const totalWords = fullText.split(/\s+/).length;
  
  // Extract first few pages for context
  const firstPages = pages.slice(1, 4).join('\n'); // First 3 pages
  const firstPagePreview = firstPages.substring(0, 8000); // First 8k characters
  
  // Try to identify key sections
  const sections = [];
  const sectionHeaders = fullText.match(/^[A-Z][A-Z\s]{10,}$/gm) || [];
  
  if (sectionHeaders.length > 0) {
    sections.push('\n**Key Sections Identified:**');
    sectionHeaders.slice(0, 10).forEach(header => {
      sections.push(`• ${header.trim()}`);
    });
  }
  
  // Create summary
  const summary = `**Large PDF Document Summary**
File: ${fileName}
Total Pages: ${totalPages}
Estimated Words: ${totalWords.toLocaleString()}
Status: Content was too large for full analysis. This summary includes the first few pages and key sections.

**Document Preview (First 3 Pages):**
${firstPagePreview}

${sections.join('\n')}

**How to work with this document:**
• Ask specific questions about topics you want to explore
• Request analysis of particular sections or concepts
• I can help you understand and work with the content even with this summary
• For detailed analysis of specific sections, you can copy and paste relevant text in follow-up messages

This document is available for download, and I can help you navigate and understand its contents based on your specific questions.`;

  return summary;
}

// Chat Attachments operations
export const attachmentApi = {
  // Upload PDF file and create attachment record
  async uploadPDFAttachment(file, chatId, userId) {
    console.log('📎 attachmentApi.uploadPDFAttachment called with:', { 
      fileName: file.name, 
      fileSize: file.size, 
      chatId, 
      userId 
    });
    
    try {
      // Validate file type - accept multiple formats
      const allowedTypes = ['pdf', 'txt', 'docx', 'doc'];
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      
      const isValidType = allowedTypes.some(type => 
        fileType.includes(type) || fileName.endsWith(`.${type}`)
      );
      
      if (!isValidType) {
        throw new Error('Supported formats: PDF, TXT, DOC, DOCX');
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }
      
      // Generate unique file path
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `${userId}/${chatId}/${uniqueFileName}`;
      
      console.log('📁 Uploading to storage path:', filePath);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await attachmentClient.storage
        .from('pdf-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log('✅ File uploaded successfully:', uploadData.path);
      
      // Extract text based on file type
      let extractedText = '';
      try {
        console.log('📝 Starting text extraction for:', file.type);
        
        if (file.type.includes('text/plain') || fileName.endsWith('.txt')) {
          // Handle TXT files
          extractedText = await file.text();
          console.log('✅ TXT text extraction successful');
          
        } else if (file.type.includes('pdf') || fileName.endsWith('.pdf')) {
          // Handle PDF files
          console.log('📄 Processing PDF...');
          
          // Import PDF.js
          const pdfjsLib = await import('pdfjs-dist/webpack');
          
          // Convert file to array buffer
          const arrayBuffer = await file.arrayBuffer();
          
          // Load PDF document
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          let fullText = '';
          console.log(`📄 Processing ${pdf.numPages} pages...`);
          
          // Extract text from each page
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
          }
          
          extractedText = fullText.trim();
          console.log('✅ PDF text extraction successful');
          
          // Check if content is too large and create a summary
          if (extractedText.length > 50000) { // ~50k characters = ~12.5k tokens
            console.log('📄 Large PDF detected, creating summary...');
            const summary = createPDFSummary(extractedText, file.name);
            extractedText = summary;
          }
          
        } else if (file.type.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          // Handle Word documents - for now, provide guidance
          const fileSizeKB = Math.round(file.size / 1024);
          extractedText = `Word document: ${file.name} (${fileSizeKB} KB) - Please copy and paste the text content you'd like help with, as Word document text extraction is not yet supported.`;
          
        } else {
          // Fallback for unsupported formats
          const fileSizeKB = Math.round(file.size / 1024);
          extractedText = `Document: ${file.name} (${fileSizeKB} KB) - Please copy and paste the text content you'd like help with.`;
        }
        
        console.log('📄 Extracted text length:', extractedText.length);
        
        // If extraction was successful but no text found
        if (!extractedText || extractedText.trim().length === 0) {
          extractedText = `File: ${file.name} - No extractable text found, please describe the content you'd like help with.`;
        }
        
      } catch (error) {
        console.warn('⚠️ Text extraction failed:', error);
        // Fallback to metadata-based approach
        const fileSizeKB = Math.round(file.size / 1024);
        extractedText = `File: ${file.name} (${fileSizeKB} KB) - Text extraction failed, please describe the content you'd like help with or copy and paste relevant sections.`;
      }
      
      // Create attachment record in database
      const attachmentData = {
        chat_id: chatId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: uploadData.path,
        extracted_text: extractedText
      };
      
      console.log('💾 Creating attachment record:', attachmentData);
      
      const { data: attachment, error: dbError } = await attachmentClient
        .from('pdf_attachments')
        .insert(attachmentData)
        .select()
        .single();
      
      if (dbError) {
        console.error('❌ Database error:', dbError);
        // Clean up uploaded file if database insert fails
        await attachmentClient.storage
          .from('pdf-uploads')
          .remove([uploadData.path]);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      console.log('✅ Attachment created successfully:', attachment.id);
      return attachment;
      
    } catch (error) {
      console.error('❌ uploadPDFAttachment error:', error);
      throw error;
    }
  },
  
  // Get attachments for a chat
  async getChatAttachments(chatId) {
    console.log('📎 attachmentApi.getChatAttachments called with chatId:', chatId);
    
    const { data, error } = await attachmentClient
      .from('pdf_attachments')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    console.log('📊 getChatAttachments results:');
    console.log('  - data length:', data?.length || 0);
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getChatAttachments error:', error);
      throw error;
    }
    return data || [];
  },
  
  // Get download URL for a PDF attachment
  async getAttachmentDownloadUrl(storagePath) {
    console.log('📎 attachmentApi.getAttachmentDownloadUrl called with path:', storagePath);
    
    const { data, error } = await attachmentClient.storage
      .from('pdf-uploads')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry
    
    console.log('📊 getAttachmentDownloadUrl results:');
    console.log('  - signedUrl:', data?.signedUrl ? 'generated' : 'null');
    console.log('  - error:', error?.message || 'none');
    
    if (error) {
      console.error('❌ getAttachmentDownloadUrl error:', error);
      throw error;
    }
    return data?.signedUrl;
  },
  
  // Delete attachment (removes file and database record)
  async deleteAttachment(attachmentId, userId) {
    console.log('📎 attachmentApi.deleteAttachment called with:', { attachmentId, userId });
    
    try {
      // First get the attachment to verify ownership and get storage path
      const { data: attachment, error: fetchError } = await attachmentClient
        .from('pdf_attachments')
        .select(`
          *,
          chats!chat_id (user_id)
        `)
        .eq('id', attachmentId)
        .single();
      
      if (fetchError) {
        console.error('❌ Fetch attachment error:', fetchError);
        throw new Error(`Failed to fetch attachment: ${fetchError.message}`);
      }
      
      // Verify ownership
      if (attachment.chats.user_id !== userId) {
        throw new Error('Unauthorized: You can only delete your own attachments');
      }
      
      // Delete from storage
      const { error: storageError } = await attachmentClient.storage
        .from('pdf-uploads')
        .remove([attachment.storage_path]);
      
      if (storageError) {
        console.error('❌ Storage deletion error:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
      
      // Delete from database
      const { error: dbError } = await attachmentClient
        .from('pdf_attachments')
        .delete()
        .eq('id', attachmentId);
      
      if (dbError) {
        console.error('❌ Database deletion error:', dbError);
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }
      
      console.log('✅ Attachment deleted successfully');
      
    } catch (error) {
      console.error('❌ deleteAttachment error:', error);
      throw error;
    }
  },
  
  // Get all attachments for a course (for instructors)
  async getCourseAttachments(courseId, instructorId) {
    console.log('📎 attachmentApi.getCourseAttachments called with:', { courseId, instructorId });
    console.log('📎 Using attachmentClient:', !!attachmentClient);
    
    try {
      // First, get all attachments with basic chat info
      // Try with the foreign key relationship first
      let attachments, attachmentError;
      
      // Always use manual approach since permissions are blocking the join
      console.log('🔄 Using manual approach to avoid permission issues');
      
      // Get attachments first
      const { data: attachmentsOnly, error: attachOnlyError } = await attachmentClient
        .from('pdf_attachments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (attachOnlyError) {
        console.error('❌ getCourseAttachments (attachments only) error:', attachOnlyError);
        throw attachOnlyError;
      }
      
      console.log('📎 Got attachments:', attachmentsOnly?.length || 0);
      
      // Try to get chat data - if this fails, we'll work with what we have
      let chats = [];
      const chatIds = attachmentsOnly.map(a => a.chat_id).filter(Boolean);
      
      if (chatIds.length > 0) {
        console.log('📎 Attempting to get chat data for IDs:', chatIds);
        
        // Try multiple approaches to get chat data
        const approaches = [
          { name: 'regular client', client: supabase },
          { name: 'admin client', client: dbClient },
          { name: 'attachment client', client: attachmentClient }
        ];
        
        for (const approach of approaches) {
          try {
            console.log(`📎 Trying ${approach.name}...`);
            
            const { data: chatsData, error: chatsError } = await approach.client
              .from('chats')
              .select('id, prompt, created_at, user_id, project_id, course_id')
              .in('id', chatIds);
            
            if (chatsError) {
              console.warn(`⚠️ ${approach.name} failed:`, chatsError);
              continue;
            }
            
            if (chatsData && chatsData.length > 0) {
              console.log(`✅ ${approach.name} worked! Got ${chatsData.length} chats`);
              chats = chatsData;
              break;
            }
          } catch (error) {
            console.warn(`⚠️ ${approach.name} threw error:`, error);
          }
        }
        
        if (chats.length === 0) {
          console.warn('⚠️ All approaches failed, will show PDFs without user/project data');
        }
      }
      
      console.log('📎 Got chats:', chats?.length || 0);
      
      // Manually join the data
      attachments = attachmentsOnly.map(attachment => ({
        ...attachment,
        chats: chats.find(c => c.id === attachment.chat_id)
      }));
      
      attachmentError = null;
      
      if (attachmentError) {
        console.error('❌ getCourseAttachments error:', attachmentError);
        throw attachmentError;
      }
      
      if (!attachments || attachments.length === 0) {
        console.log('📊 No attachments found');
        return [];
      }
      
      // Filter attachments to only include those from the selected course
      // Since we now have course_id in chats, we can filter directly
      const courseAttachments = attachments.filter(attachment => {
        return attachment.chats?.course_id === courseId;
      });
      
      console.log('📊 Course filtering:');
      console.log('  - Total attachments:', attachments.length);
      console.log('  - Course attachments:', courseAttachments.length);
      console.log('  - Looking for course_id:', courseId);
      console.log('  - Sample attachment:', attachments[0]);
      console.log('  - Sample chat data:', attachments[0]?.chats);
      
      // Get unique user IDs and project IDs from course attachments
      const userIds = [...new Set(courseAttachments.map(a => a.chats?.user_id).filter(Boolean))];
      const projectIds = [...new Set(courseAttachments.map(a => a.chats?.project_id).filter(Boolean))];
      
      // Get user data
      const { data: users, error: userError } = await attachmentClient
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      
      if (userError) {
        console.warn('⚠️ Error loading users:', userError);
      }
      
      // Get project data
      const { data: projects, error: projectError } = await attachmentClient
        .from('projects')
        .select('id, title, course_id')
        .in('id', projectIds);
      
      if (projectError) {
        console.warn('⚠️ Error loading projects:', projectError);
      }
      
      // Enhance attachments with user and project data
      const enhancedAttachments = courseAttachments.map(attachment => {
        const user = users?.find(u => u.id === attachment.chats?.user_id);
        const project = projects?.find(p => p.id === attachment.chats?.project_id);
        
        return {
          ...attachment,
          chats: {
            ...attachment.chats,
            users: user,
            projects: project
          }
        };
      });
      
      console.log('📊 getCourseAttachments results:');
      console.log('  - total attachments:', attachments?.length || 0);
      console.log('  - course attachments:', enhancedAttachments?.length || 0);
      console.log('  - sample attachment:', enhancedAttachments?.[0]);
      console.log('  - error:', 'none');
      
      return enhancedAttachments || [];
      
    } catch (error) {
      console.error('❌ getCourseAttachments error:', error);
      console.error('❌ Error details:', error.message, error.code);
      // Return empty array instead of throwing to prevent dashboard crash
      return [];
    }
  }
}; 