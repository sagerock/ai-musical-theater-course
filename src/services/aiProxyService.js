// AI Proxy Service - Routes API calls through Vercel serverless functions
// This keeps API keys secure on the server side

import errorLogger from '../utils/errorLogger';
import retryHelper from '../utils/retryHelper';
import { authHeaders } from './authHeaders';

const API_ENDPOINTS = {
  openai: '/api/openai',
  anthropic: '/api/anthropic'
};

// Map tool names to their API endpoints and models
const TOOL_CONFIG = {
  'GPT-6 Luna': { endpoint: 'openai', model: 'gpt-6-luna' },
  'GPT-6.1 Sol': { endpoint: 'openai', model: 'gpt-6.1-sol' },
  'Claude Haiku 5.5': { endpoint: 'anthropic', model: 'claude-haiku-5-5' },
  'Claude Sonnet 5.5': { endpoint: 'anthropic', model: 'claude-sonnet-5-5' },
  'Claude Opus 5.5': { endpoint: 'anthropic', model: 'claude-opus-5-5' }
};
const DEFAULT_TOOL = 'GPT-6.1 Sol';

// Helper function to create user-friendly error messages
const getUserFriendlyError = (error, tool) => {
  const errorMessage = error.message?.toLowerCase() || '';

  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return `The ${tool} service is temporarily rate-limited. Please wait a moment and try again.`;
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return `The ${tool} service is taking longer than expected. This can happen with complex prompts or during high usage. Please try again, or consider using a simpler prompt or different model.`;
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return `Connection issue with ${tool}. Please check your internet connection and try again.`;
  }

  if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
    return `Authentication issue with ${tool}. The service configuration may need updating.`;
  }

  if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
    return `The ${tool} service is experiencing technical difficulties. Please try again in a moment.`;
  }

  if (errorMessage.includes('capacity') || errorMessage.includes('overloaded')) {
    return `The ${tool} service is at capacity. Please try a different model or wait a moment.`;
  }

  return `An error occurred with ${tool}: ${error.message}. Please try again or select a different model.`;
};

export const aiProxyService = {
  async sendChatCompletion(prompt, tool = DEFAULT_TOOL, conversationHistory = [], systemPrompt = null, stream = false) {
    const config = TOOL_CONFIG[tool] || TOOL_CONFIG[DEFAULT_TOOL];
    const endpoint = API_ENDPOINTS[config.endpoint];

    if (!endpoint) {
      const error = new Error(`Unknown AI tool: ${tool}`);
      errorLogger.logError(error, { tool, provider: 'unknown' });
      throw error;
    }

    // Build messages array in OpenAI format
    const messages = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    } else {
      messages.push({
        role: 'system',
        content: 'You are a helpful AI assistant designed to support educational activities. Please provide thoughtful, accurate, and educational responses. Encourage critical thinking and ethical use of AI tools.'
      });
    }

    // Add conversation history
    conversationHistory.forEach(chat => {
      messages.push({ role: 'user', content: chat.prompt });
      messages.push({ role: 'assistant', content: chat.response });
    });

    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    // Get retry configuration for this model
    const retryConfig = retryHelper.getModelConfig(config.model);

    // Start timing
    const startTime = Date.now();

    try {
      // Wrap the API call with retry logic
      const response = await retryHelper.withRetry(async () => {
        // Create abort controller for timeout
        const controller = new AbortController();
        // Use model-specific timeouts - some models need more time
        // Note: These must be longer than Vercel's maxDuration
        let timeoutMs = 35000; // Default 35 seconds
        const modelLower = config.model.toLowerCase();
        if (modelLower.includes('gemini')) {
          timeoutMs = 70000; // 70 seconds for Gemini
        } else if (modelLower.includes('gpt-5')) {
          timeoutMs = 70000; // 70 seconds for GPT-5 models (can be slow)
        } else if (modelLower.includes('gpt-4')) {
          timeoutMs = 55000; // 55 seconds for GPT-4 models
        } else if (modelLower.includes('opus')) {
          timeoutMs = 70000; // 70 seconds for Claude Opus (research model)
        }
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const fetchResponse = await fetch(endpoint, {
            method: 'POST',
            headers: await authHeaders(),
            body: JSON.stringify({
              messages,
              model: config.model,
              stream
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json().catch(() => ({}));
            const error = new Error(errorData.error || `API request failed: ${fetchResponse.status}`);
            error.status = fetchResponse.status;
            error.provider = config.endpoint;
            error.model = config.model;
            throw error;
          }

          return fetchResponse;
        } catch (err) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            const timeoutError = new Error('Request timeout - the AI service took too long to respond');
            timeoutError.status = 408;
            timeoutError.provider = config.endpoint;
            timeoutError.model = config.model;
            throw timeoutError;
          }
          throw err;
        }
      }, retryConfig);

      // Log successful API call in diagnostic mode
      const duration = Date.now() - startTime;
      if (errorLogger.diagnosticMode) {
        errorLogger.logApiCall(
          { model: config.model, provider: config.endpoint, prompt, conversationHistory },
          { success: true, statusCode: response.status, content: true },
          duration
        );
      }

      if (stream) {
        return response; // Return the response object for streaming
      } else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      // Log the error with context
      errorLogger.logError(error, {
        tool,
        model: config.model,
        provider: config.endpoint,
        promptLength: prompt?.length,
        historyLength: conversationHistory?.length,
        duration: Date.now() - startTime
      });

      // Create user-friendly error message
      const userMessage = getUserFriendlyError(error, tool);

      // Throw error with user-friendly message but preserve original for debugging
      const enhancedError = new Error(userMessage);
      enhancedError.originalError = error;
      enhancedError.tool = tool;
      enhancedError.model = config.model;

      console.error(`Error calling ${tool} API:`, error);
      throw enhancedError;
    }
  },

  // Helper method to handle streaming responses
  async* streamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              // Skip unparseable lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};

export default aiProxyService;