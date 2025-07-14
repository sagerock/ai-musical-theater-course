// Perplexity API Integration
// Available Perplexity models
export const PERPLEXITY_MODELS = {
  'Sonar Pro': 'sonar-pro'
};

export const perplexityApi = {
  // Send chat completion request
  async sendChatCompletion(prompt, tool = 'Sonar Pro', conversationHistory = [], systemPrompt = null) {
    try {
      const model = PERPLEXITY_MODELS[tool] || PERPLEXITY_MODELS['Sonar Pro'];
      
      // Use provided system prompt or fallback to default
      const defaultSystemPrompt = 'You are a helpful AI assistant designed to support educational activities. Please provide thoughtful, accurate, and educational responses. Encourage critical thinking and ethical use of AI tools.';
      
      // Prepare messages array
      const messages = [
        {
          role: 'system',
          content: systemPrompt || defaultSystemPrompt
        },
        ...conversationHistory.map(chat => [
          { role: 'user', content: chat.prompt },
          { role: 'assistant', content: chat.response }
        ]).flat(),
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        response: data.choices[0].message.content,
        usage: data.usage,
        model: model
      };

    } catch (error) {
      console.error('Perplexity API Error:', error);
      
      // Handle different types of errors
      if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
        throw new Error('Invalid Perplexity API key. Please check your configuration.');
      } else if (error.message.includes('429') || error.message.includes('rate_limit')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.message.includes('400')) {
        throw new Error('Invalid request. Please check your input.');
      } else {
        throw new Error(error.message || 'Failed to get AI response. Please try again.');
      }
    }
  },

  // Validate API key
  async validateApiKey() {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });

      return response.ok;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  }
};

export default perplexityApi;