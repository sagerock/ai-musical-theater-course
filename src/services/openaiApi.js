import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
});

// Available AI tools/models - Streamlined selection
export const AI_TOOLS = {
  // OpenAI Models
  'GPT-4o Mini': 'gpt-4o-mini',       // Fastest, most cost-efficient
  'GPT-4o': 'gpt-4o',                 // Balanced performance and cost (default)
  'GPT-4 Turbo': 'gpt-4-turbo',       // Premium model for coding and complex reasoning
  // Anthropic Models
  'Claude 3 Haiku': 'claude-3-haiku-20240307',
  'Claude 3.5 Sonnet': 'claude-3-5-sonnet-20241022',
  'Claude 3 Opus': 'claude-3-opus-20240229',
  // Google Models
  'Gemini Flash': 'gemini-2.5-flash',
  'Gemini 2.5 Pro': 'gemini-2.5-pro',
  // Perplexity Model
  'Sonar Pro': 'sonar-pro'
};

export const openaiApi = {
  // Send chat completion request
  async sendChatCompletion(prompt, tool = 'GPT-4o Mini', conversationHistory = [], systemPrompt = null) {
    try {
      const model = AI_TOOLS[tool] || AI_TOOLS['GPT-4o Mini'];
      
      // Use provided system prompt or fallback to default
      const defaultSystemPrompt = 'You are a helpful AI assistant designed to support educational activities. Please provide thoughtful, accurate, and educational responses. Encourage critical thinking and ethical use of AI tools.';
      
      // All models use the Chat Completions API
        
        // Prepare messages array for Chat Completions API
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
        
        const completionParams = {
          model: model,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        };
        
        const completion = await openai.chat.completions.create(completionParams);
        
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
        model: 'dall-e-3',
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