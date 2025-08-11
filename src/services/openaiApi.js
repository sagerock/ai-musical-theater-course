import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
});

// Available AI tools/models - Streamlined selection  
export const AI_TOOLS = {
  // OpenAI Models - GPT-5 Series (2025)
  'GPT-5 Nano': 'gpt-5-nano-2025-08-07',  // Fastest, most cost-efficient
  'GPT-5 Mini': 'gpt-5-mini-2025-08-07',  // Balanced performance and cost (default)
  'GPT-5': 'gpt-5-2025-08-07',            // Premium model for coding and complex reasoning
  // Anthropic Models
  'Claude Sonnet 4': 'claude-sonnet-4-20250514',
  'Claude Opus 4': 'claude-4-opus-20250514',
  // Google Models
  'Gemini Flash': 'gemini-1.5-flash',
  'Gemini 2.5 Pro': 'gemini-2.5-pro',
  // Perplexity Model
  'Sonar Pro': 'sonar-pro'
};

export const openaiApi = {
  // Send chat completion request
  async sendChatCompletion(prompt, tool = 'GPT-5 Mini', conversationHistory = [], systemPrompt = null) {
    try {
      const model = AI_TOOLS[tool] || AI_TOOLS['GPT-5 Mini'];
      
      // Use provided system prompt or fallback to default
      const defaultSystemPrompt = 'You are a helpful AI assistant designed to support educational activities. Please provide thoughtful, accurate, and educational responses. Encourage critical thinking and ethical use of AI tools.';
      
      // Check if it's a GPT-5 model
      const isGPT5Model = model.startsWith('gpt-5');
      
      if (isGPT5Model) {
        // GPT-5 models use the new Responses API
        
        // Build input messages for Responses API
        const inputMessages = [
          {
            role: 'developer',
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
        
        // Use Responses API for GPT-5 models
        const response = await openai.responses.create({
          model: model,
          input: inputMessages,
          text: {
            verbosity: 'medium'  // Can be 'low', 'medium', or 'high'
          },
          reasoning: {
            effort: 'medium'  // Can be 'minimal', 'medium', or 'high'
          }
        });
        
        // Extract text from the new response format
        let outputText = '';
        if (response.output && Array.isArray(response.output)) {
          for (const item of response.output) {
            if (item && item.content) {
              for (const content of item.content) {
                if (content && content.text) {
                  outputText += content.text;
                }
              }
            }
          }
        }
        
        // Debug logging for GPT-5 responses
        console.log('🔍 GPT-5 Responses API Result:', {
          model: model,
          outputText: outputText,
          usage: response.usage,
          fullResponse: response
        });
        
        return {
          success: true,
          response: outputText,
          usage: response.usage,
          model: model
        };
        
      } else {
        // Non-GPT-5 models use the traditional Chat Completions API
        
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
      }

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