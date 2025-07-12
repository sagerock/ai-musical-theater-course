import { supabase } from '../config/supabase';

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
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Project operations
export const projectApi = {
  // Create project
  async createProject(projectData, userId) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        created_by: userId
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

  // Get user's projects
  async getUserProjects(userId) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members!inner (
          role,
          joined_at
        )
      `)
      .eq('project_members.user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get all projects (for instructors)
  async getAllProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        users:created_by (name, email),
        project_members (
          users (name, email, role)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
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
  }
};

// Chat operations
export const chatApi = {
  // Create chat
  async createChat(chatData) {
    const { data, error } = await supabase
      .from('chats')
      .insert(chatData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get chats for a project
  async getProjectChats(projectId, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        users (name, email),
        chat_tags (
          tags (id, name)
        ),
        reflections (*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  // Get user's chats
  async getUserChats(userId, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        projects (title),
        chat_tags (
          tags (id, name)
        ),
        reflections (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
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

    // Apply filters
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
    if (filters.tagId) {
      query = query.contains('chat_tags.tag_id', [filters.tagId]);
    }

    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
};

// Tag operations
export const tagApi = {
  // Get all tags
  async getAllTags() {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Create tag
  async createTag(tagData) {
    const { data, error } = await supabase
      .from('tags')
      .insert(tagData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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

  // Get tag usage statistics
  async getTagUsageStats() {
    const { data, error } = await supabase
      .from('chat_tags')
      .select(`
        tag_id,
        tags (name),
        count
      `)
      .order('count', { ascending: false });
    
    if (error) throw error;
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
  async getOverallStats() {
    const [
      { data: totalChats, error: chatsError },
      { data: totalUsers, error: usersError },
      { data: totalProjects, error: projectsError },
      { data: reflectionRate, error: reflectionError }
    ] = await Promise.all([
      supabase.from('chats').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase
        .from('chats')
        .select(`
          id,
          reflections (id)
        `)
    ]);

    if (chatsError || usersError || projectsError || reflectionError) {
      throw chatsError || usersError || projectsError || reflectionError;
    }

    const chatsWithReflections = reflectionRate?.filter(chat => chat.reflections.length > 0).length || 0;
    const totalChatsCount = reflectionRate?.length || 0;
    
    return {
      totalChats: totalChats || 0,
      totalUsers: totalUsers || 0,
      totalProjects: totalProjects || 0,
      reflectionCompletionRate: totalChatsCount > 0 ? (chatsWithReflections / totalChatsCount) * 100 : 0
    };
  }
}; 