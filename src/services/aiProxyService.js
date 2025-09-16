// AI Proxy Service - Routes API calls through Vercel serverless functions
// This keeps API keys secure on the server side

const API_ENDPOINTS = {
  openai: '/api/openai',
  anthropic: '/api/anthropic',
  google: '/api/google',
  perplexity: '/api/perplexity'
};

// Map tool names to their API endpoints and models
const TOOL_CONFIG = {
  // OpenAI Models
  'GPT-5 Nano': { endpoint: 'openai', model: 'gpt-5-nano-2025-08-07' },
  'GPT-5 Mini': { endpoint: 'openai', model: 'gpt-5-mini-2025-08-07' },
  'GPT-5': { endpoint: 'openai', model: 'gpt-5-2025-08-07' },

  // Anthropic Models
  'Claude Sonnet 4': { endpoint: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'Claude Opus 4': { endpoint: 'anthropic', model: 'claude-4-opus-20250514' },

  // Google Models
  'Gemini Flash': { endpoint: 'google', model: 'gemini-1.5-flash' },
  'Gemini 2.5 Pro': { endpoint: 'google', model: 'gemini-2.5-pro' },

  // Perplexity Model
  'Sonar Pro': { endpoint: 'perplexity', model: 'sonar-pro' }
};

export const aiProxyService = {
  async sendChatCompletion(prompt, tool = 'GPT-5 Mini', conversationHistory = [], systemPrompt = null, stream = false) {
    const config = TOOL_CONFIG[tool] || TOOL_CONFIG['GPT-5 Mini'];
    const endpoint = API_ENDPOINTS[config.endpoint];

    if (!endpoint) {
      throw new Error(`Unknown AI tool: ${tool}`);
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

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: config.model,
          stream
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API request failed: ${response.status}`);
      }

      if (stream) {
        return response; // Return the response object for streaming
      } else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error(`Error calling ${tool} API:`, error);
      throw error;
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