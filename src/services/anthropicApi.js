import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
});

// Available Anthropic models - Streamlined selection
export const ANTHROPIC_MODELS = {
  'Claude Sonnet 4': 'claude-sonnet-4-20250514'
};

export const anthropicApi = {
  // Send chat completion request
  async sendChatCompletion(prompt, tool = 'Claude Sonnet 4', conversationHistory = [], systemPrompt = null) {
    try {
      const model = ANTHROPIC_MODELS[tool] || ANTHROPIC_MODELS['Claude Sonnet 4'];
      
      // Use provided system prompt or fallback to default
      const defaultSystemPrompt = 'You are a helpful AI assistant designed to support educational activities. Please provide thoughtful, accurate, and educational responses. Encourage critical thinking and ethical use of AI tools.';
      
      // Prepare messages array
      const messages = [
        ...conversationHistory
          .filter(chat => chat.prompt && chat.response) // Filter out empty messages
          .map(chat => [
            { role: 'user', content: chat.prompt },
            { role: 'assistant', content: chat.response }
          ]).flat(),
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt || defaultSystemPrompt,
        messages: messages
      });

      return {
        success: true,
        response: response.content[0].text,
        usage: response.usage,
        model: model
      };

    } catch (error) {
      console.error('Anthropic API Error:', error);
      
      // Handle different types of errors
      if (error.status === 401) {
        throw new Error('Invalid Anthropic API key. Please check your configuration.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.status === 400) {
        throw new Error('Invalid request. Please check your input.');
      } else {
        throw new Error(error.message || 'Failed to get AI response. Please try again.');
      }
    }
  },

  // Validate API key
  async validateApiKey() {
    try {
      await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  }
};

export default anthropicApi;