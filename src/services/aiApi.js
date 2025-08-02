import { openaiApi, AI_TOOLS } from './openaiApi';
import { anthropicApi, ANTHROPIC_MODELS } from './anthropicApi';
import { googleApi, GOOGLE_MODELS } from './googleApi';
import { perplexityApi, PERPLEXITY_MODELS } from './perplexityApi';

// Centralized educational system prompt
export const EDUCATIONAL_SYSTEM_PROMPT = "You are a helpful, curious, and respectful educational assistant designed to support students as they research, write, and learn. Always cite sources when possible, explain your reasoning clearly, and avoid providing false or misleading information. Encourage students to think critically and verify facts.";

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
  
  // Check if it's a Perplexity model
  if (Object.values(PERPLEXITY_MODELS).includes(modelId)) {
    return 'perplexity';
  }
  
  // Default to OpenAI for other models
  return 'openai';
};

// Unified AI API service
export const aiApi = {
  // Send chat completion request (automatically routes to correct provider)
  async sendChatCompletion(prompt, tool = 'GPT-4.1 Mini', conversationHistory = []) {
    const provider = getProviderFromModel(tool);
    
    try {
      if (provider === 'anthropic') {
        return await anthropicApi.sendChatCompletion(prompt, tool, conversationHistory, EDUCATIONAL_SYSTEM_PROMPT);
      } else if (provider === 'google') {
        return await googleApi.sendChatCompletion(prompt, tool, conversationHistory, EDUCATIONAL_SYSTEM_PROMPT);
      } else if (provider === 'perplexity') {
        return await perplexityApi.sendChatCompletion(prompt, tool, conversationHistory, EDUCATIONAL_SYSTEM_PROMPT);
      } else {
        return await openaiApi.sendChatCompletion(prompt, tool, conversationHistory, EDUCATIONAL_SYSTEM_PROMPT);
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
      google: false,
      perplexity: false
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

    try {
      results.perplexity = await perplexityApi.validateApiKey();
    } catch (error) {
      console.error('Perplexity validation failed:', error);
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

    // Add Perplexity models (they don't have a list endpoint)
    Object.entries(PERPLEXITY_MODELS).forEach(([name, id]) => {
      models.push({
        id,
        name,
        provider: 'perplexity'
      });
    });

    return models;
  }
};

// Export everything for backward compatibility
export { AI_TOOLS, openaiApi, anthropicApi, googleApi, perplexityApi, ANTHROPIC_MODELS, GOOGLE_MODELS, PERPLEXITY_MODELS };
export default aiApi;