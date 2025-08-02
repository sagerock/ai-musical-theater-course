// Analytics API service for platform usage tracking
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculatePlatformCosts, estimateMonthlyCost } from '../utils/costCalculator';

export const analyticsApi = {
  /**
   * Get platform usage analytics for a date range
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<object>} Analytics data with costs and usage
   */
  async getPlatformUsageAnalytics(startDate, endDate) {
    try {
      console.log('📊 Loading platform usage analytics...', { startDate, endDate });
      
      // Get all chat interactions within the date range
      const chatsRef = collection(db, 'chats');
      let q = query(
        chatsRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );

      console.log('🔍 Querying chats from', startDate, 'to', endDate);
      const snapshot = await getDocs(q);
      
      console.log(`📄 Found ${snapshot.size} chat interactions`);

      // Process chat data for usage analytics
      const usageData = [];
      
      snapshot.forEach(doc => {
        const chat = doc.data();
        
        // Debug: Log the first few chat documents to understand the data structure
        if (usageData.length < 3) {
          console.log('🔍 Sample chat document:', {
            id: doc.id,
            toolUsed: chat.toolUsed,
            model: chat.model,
            tool: chat.tool,
            aiTool: chat.aiTool,
            availableFields: Object.keys(chat)
          });
        }
        
        // Extract usage information
        const usageRecord = {
          id: doc.id,
          date: chat.createdAt?.toDate ? chat.createdAt.toDate() : new Date(chat.createdAt),
          model: chat.toolUsed || chat.model || chat.tool || chat.aiTool || 'unknown',
          // Extract token usage from various possible locations
          inputTokens: this.extractTokenUsage(chat, 'input'),
          outputTokens: this.extractTokenUsage(chat, 'output'),
          searches: this.extractSearchCount(chat),
          userId: chat.userId,
          courseId: chat.courseId,
          projectId: chat.projectId,
          prompt: chat.prompt?.substring(0, 100) || '', // First 100 chars for context
          responseLength: chat.response?.length || 0
        };

        usageData.push(usageRecord);
      });

      console.log('💾 Processed usage data:', usageData.length, 'records');

      // Calculate costs and aggregate data
      const costAnalysis = calculatePlatformCosts(usageData);
      
      // Calculate additional metrics
      const daysInRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const estimatedMonthlyCost = estimateMonthlyCost(costAnalysis, daysInRange);

      // Get user and course breakdown
      const userBreakdown = this.aggregateByUser(usageData);
      const courseBreakdown = this.aggregateByCourse(usageData);

      return {
        summary: {
          ...costAnalysis,
          dateRange: { startDate, endDate },
          daysInRange,
          estimatedMonthlyCost,
          averageCostPerInteraction: costAnalysis.totalCost / (costAnalysis.totalInteractions || 1),
          averageTokensPerInteraction: (costAnalysis.totalInputTokens + costAnalysis.totalOutputTokens) / (costAnalysis.totalInteractions || 1)
        },
        breakdown: {
          byProvider: costAnalysis.byProvider,
          byModel: costAnalysis.byModel,
          byUser: userBreakdown,
          byCourse: courseBreakdown,
          dailyCosts: costAnalysis.dailyCosts
        },
        rawData: usageData
      };

    } catch (error) {
      console.error('Error getting platform usage analytics:', error);
      throw error;
    }
  },

  /**
   * Extract token usage from chat data
   * @param {object} chat - Chat document data
   * @param {string} type - 'input' or 'output'
   * @returns {number} Token count
   */
  extractTokenUsage(chat, type) {
    // Try various locations where token usage might be stored
    const sources = [
      chat.usage?.[`${type}_tokens`],
      chat.usage?.[`${type}Tokens`],
      chat.tokenUsage?.[type],
      chat.apiResponse?.usage?.[`${type}_tokens`],
      chat.metadata?.usage?.[`${type}_tokens`]
    ];

    for (const source of sources) {
      if (typeof source === 'number' && source > 0) {
        return source;
      }
    }

    // Fallback: estimate based on text length (rough approximation)
    if (type === 'input' && chat.prompt) {
      const estimated = Math.ceil(chat.prompt.length / 4); // ~4 chars per token
      console.log(`📏 Estimated ${type} tokens from text length:`, estimated, 'for prompt:', chat.prompt.substring(0, 50) + '...');
      return estimated;
    } else if (type === 'output' && chat.response) {
      const estimated = Math.ceil(chat.response.length / 4); // ~4 chars per token
      console.log(`📏 Estimated ${type} tokens from text length:`, estimated, 'for response:', chat.response.substring(0, 50) + '...');
      return estimated;
    }

    return 0;
  },

  /**
   * Extract search count for Perplexity models
   * @param {object} chat - Chat document data
   * @returns {number} Number of searches performed
   */
  extractSearchCount(chat) {
    // For Perplexity/Sonar models, assume 1 search per interaction
    const model = chat.toolUsed || chat.model || '';
    if (model.toLowerCase().includes('sonar') || model.toLowerCase().includes('perplexity')) {
      return 1;
    }
    
    // Check if explicitly tracked
    return chat.searches || chat.searchCount || 0;
  },

  /**
   * Aggregate usage data by user
   * @param {Array} usageData - Array of usage records
   * @returns {object} User breakdown
   */
  aggregateByUser(usageData) {
    const userMap = {};
    
    usageData.forEach(record => {
      if (!record.userId) return;
      
      if (!userMap[record.userId]) {
        userMap[record.userId] = {
          userId: record.userId,
          interactions: 0,
          totalCost: 0,
          inputTokens: 0,
          outputTokens: 0,
          models: new Set()
        };
      }
      
      const user = userMap[record.userId];
      user.interactions += 1;
      user.inputTokens += record.inputTokens;
      user.outputTokens += record.outputTokens;
      user.models.add(record.model);
      
      // Calculate cost for this interaction
      const { calculateModelCost } = require('../utils/costCalculator');
      const cost = calculateModelCost(record.model, record.inputTokens, record.outputTokens, record.searches);
      user.totalCost += cost.totalCost;
    });

    // Convert Set to Array for models
    Object.values(userMap).forEach(user => {
      user.models = Array.from(user.models);
      user.modelCount = user.models.length;
    });

    return userMap;
  },

  /**
   * Aggregate usage data by course
   * @param {Array} usageData - Array of usage records
   * @returns {object} Course breakdown
   */
  aggregateByCourse(usageData) {
    const courseMap = {};
    
    usageData.forEach(record => {
      const courseId = record.courseId || 'no-course';
      
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          courseId,
          interactions: 0,
          totalCost: 0,
          inputTokens: 0,
          outputTokens: 0,
          uniqueUsers: new Set(),
          models: new Set()
        };
      }
      
      const course = courseMap[courseId];
      course.interactions += 1;
      course.inputTokens += record.inputTokens;
      course.outputTokens += record.outputTokens;
      course.models.add(record.model);
      
      if (record.userId) {
        course.uniqueUsers.add(record.userId);
      }
      
      // Calculate cost for this interaction
      const { calculateModelCost } = require('../utils/costCalculator');
      const cost = calculateModelCost(record.model, record.inputTokens, record.outputTokens, record.searches);
      course.totalCost += cost.totalCost;
    });

    // Convert Sets to counts
    Object.values(courseMap).forEach(course => {
      course.uniqueUserCount = course.uniqueUsers.size;
      course.modelCount = course.models.size;
      course.models = Array.from(course.models);
      delete course.uniqueUsers; // Remove Set object for JSON serialization
    });

    return courseMap;
  },

  /**
   * Get quick platform stats (for dashboard summary)
   * @param {number} days - Number of days to look back (default 30)
   * @returns {Promise<object>} Quick stats summary
   */
  async getQuickPlatformStats(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const analytics = await this.getPlatformUsageAnalytics(startDate, endDate);
      
      return {
        totalCost: analytics.summary.totalCost,
        totalInteractions: analytics.summary.totalInteractions,
        totalTokens: analytics.summary.totalInputTokens + analytics.summary.totalOutputTokens,
        estimatedMonthlyCost: analytics.summary.estimatedMonthlyCost,
        topModel: this.getTopModel(analytics.breakdown.byModel),
        days
      };
    } catch (error) {
      console.error('Error getting quick platform stats:', error);
      return {
        totalCost: 0,
        totalInteractions: 0,
        totalTokens: 0,
        estimatedMonthlyCost: 0,
        topModel: 'Unknown',
        days
      };
    }
  },

  /**
   * Get the most used model from analytics
   * @param {object} byModel - Model breakdown from analytics
   * @returns {string} Most used model name
   */
  getTopModel(byModel) {
    if (!byModel || Object.keys(byModel).length === 0) return 'Unknown';
    
    return Object.entries(byModel)
      .sort(([,a], [,b]) => b.interactions - a.interactions)
      [0]?.[0] || 'Unknown';
  }
};

export default analyticsApi;