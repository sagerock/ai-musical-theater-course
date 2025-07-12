import { openaiApi, AI_TOOLS } from './openaiApi';
import { anthropicApi, ANTHROPIC_MODELS } from './anthropicApi';
import { googleApi, GOOGLE_MODELS } from './googleApi';

// Helper function to determine provider based on model
const getProviderFromModel = (tool) => {
  const modelId = AI_TOOLS[tool];
  
  if (!modelId) {
    return 'openai'; // default fallback
  }
  
  // Check if it's an Anthropic model
  if (Object.values(ANTHROPIC_MODELS).includes(modelId)) {
    return 'anthropic';
  }
  
  // Check if it's a Google model
  if (Object.values(GOOGLE_MODELS).includes(modelId)) {
    return 'google';
  }
  
  // Default to OpenAI for other models
  return 'openai';
};

// Unified AI API service
export const aiApi = {
  // Send chat completion request (automatically routes to correct provider)
  async sendChatCompletion(prompt, tool = 'GPT-4.1', conversationHistory = []) {
    const provider = getProviderFromModel(tool);
    
    try {
      if (provider === 'anthropic') {
        return await anthropicApi.sendChatCompletion(prompt, tool, conversationHistory);
      } else if (provider === 'google') {
        return await googleApi.sendChatCompletion(prompt, tool, conversationHistory);
      } else {
        return await openaiApi.sendChatCompletion(prompt, tool, conversationHistory);
      }
    } catch (error) {
      console.error(`${provider} API Error:`, error);
      throw error;
    }
  },

  // Generate image (OpenAI only for now)
  async generateImage(prompt, size = '1024x1024') {
    return await openaiApi.generateImage(prompt, size);
  },

  // Validate API keys
  async validateApiKeys() {
    const results = {
      openai: false,
      anthropic: false,
      google: false
    };

    try {
      results.openai = await openaiApi.validateApiKey();
    } catch (error) {
      console.error('OpenAI validation failed:', error);
    }

    try {
      results.anthropic = await anthropicApi.validateApiKey();
    } catch (error) {
      console.error('Anthropic validation failed:', error);
    }

    try {
      results.google = await googleApi.validateApiKey();
    } catch (error) {
      console.error('Google validation failed:', error);
    }

    return results;
  },

  // Get available models
  async getAvailableModels() {
    const models = [];
    
    try {
      const openaiModels = await openaiApi.getAvailableModels();
      models.push(...openaiModels.map(model => ({ ...model, provider: 'openai' })));
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
    }

    // Add Anthropic models (they don't have a list endpoint)
    Object.entries(ANTHROPIC_MODELS).forEach(([name, id]) => {
      models.push({
        id,
        name,
        provider: 'anthropic'
      });
    });

    // Add Google models (they don't have a list endpoint)
    Object.entries(GOOGLE_MODELS).forEach(([name, id]) => {
      models.push({
        id,
        name,
        provider: 'google'
      });
    });

    return models;
  }
};

// Export everything for backward compatibility
export { AI_TOOLS, openaiApi, anthropicApi, googleApi, ANTHROPIC_MODELS, GOOGLE_MODELS };
export default aiApi;