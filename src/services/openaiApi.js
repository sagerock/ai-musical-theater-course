import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
});

// Available AI tools/models
export const AI_TOOLS = {
  // OpenAI Models
  'GPT-4.1': 'gpt-4.1-2025-04-14',
  'GPT-4.1-Mini': 'gpt-4.1-mini-2025-04-14',
  'O4-Mini': 'o4-mini-2025-04-16',
  'GPT-4o': 'gpt-4o-2024-08-06',
  'GPT-Image-1': 'gpt-image-1',
  // Anthropic Models
  'Claude Opus 4': 'claude-opus-4-20250514',
  'Claude Sonnet 4': 'claude-sonnet-4-20250514',
  'Claude Sonnet 3.7': 'claude-3-7-sonnet-20250219',
  'Claude Sonnet 3.5': 'claude-3-5-sonnet-20241022',
  'Claude Haiku 3.5': 'claude-3-5-haiku-20241022',
  // Google Models
  'Gemini 2.5 Pro': 'gemini-2.0-flash-exp',
  'Gemini 2.5 Flash': 'gemini-1.5-flash'
};

export const openaiApi = {
  // Send chat completion request
  async sendChatCompletion(prompt, tool = 'GPT-4.1', conversationHistory = []) {
    try {
      const model = AI_TOOLS[tool] || AI_TOOLS['GPT-4.1'];
      
      // Prepare messages array
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant designed to support educational activities. Please provide thoughtful, accurate, and educational responses. Encourage critical thinking and ethical use of AI tools.'
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

      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      return {
        success: true,
        response: completion.choices[0].message.content,
        usage: completion.usage,
        model: model
      };

    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Handle different types of errors
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.code === 'model_not_found') {
        throw new Error('The requested AI model is not available.');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(error.message || 'Failed to get AI response. Please try again.');
      }
    }
  },

  // Generate image with DALL-E (placeholder for future implementation)
  async generateImage(prompt, size = '1024x1024') {
    try {
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: prompt,
        size: size,
        quality: 'standard',
        n: 1,
      });

      return {
        success: true,
        imageUrl: response.data[0].url,
        revisedPrompt: response.data[0].revised_prompt
      };

    } catch (error) {
      console.error('DALL-E API Error:', error);
      throw new Error(error.message || 'Failed to generate image. Please try again.');
    }
  },

  // Validate API key
  async validateApiKey() {
    try {
      await openai.models.list();
      return true;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  },

  // Get available models
  async getAvailableModels() {
    try {
      const response = await openai.models.list();
      return response.data.filter(model => 
        model.id.includes('gpt') || model.id.includes('dall-e')
      );
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  }
};

export default openaiApi; 