import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API_KEY);

// Available Google models
export const GOOGLE_MODELS = {
  'Gemini 2.5 Pro': 'gemini-2.5-pro',
  'Gemini 2.5 Flash': 'gemini-2.5-flash'
};

export const googleApi = {
  // Send chat completion request
  async sendChatCompletion(prompt, tool = 'Gemini 2.5 Pro', conversationHistory = []) {
    try {
      const modelName = GOOGLE_MODELS[tool] || GOOGLE_MODELS['Gemini 2.5 Pro'];
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Configure generation settings
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      };

      // Prepare conversation history
      const history = conversationHistory.map(chat => [
        {
          role: 'user',
          parts: [{ text: chat.prompt }]
        },
        {
          role: 'model',
          parts: [{ text: chat.response }]
        }
      ]).flat();

      // Start chat session with history
      const chatSession = model.startChat({
        generationConfig,
        history: history,
        systemInstruction: {
          role: 'system',
          parts: [{ text: 'You are a helpful AI assistant designed to support educational activities. Please provide thoughtful, accurate, and educational responses. Encourage critical thinking and ethical use of AI tools.' }]
        }
      });

      // Send message
      const result = await chatSession.sendMessage(prompt);
      const response = result.response;
      
      // Extract text from candidates
      let responseText = '';
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          responseText = candidate.content.parts[0].text || '';
        }
      }
      
      return {
        success: true,
        response: responseText,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        },
        model: modelName
      };

    } catch (error) {
      console.error('Google API Error:', error);
      
      // Handle different types of errors
      if (error.status === 401) {
        throw new Error('Invalid Google API key. Please check your configuration.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.status === 400) {
        throw new Error('Invalid request. Please check your input.');
      } else if (error.message && error.message.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Google API key. Please check your configuration.');
      } else {
        throw new Error(error.message || 'Failed to get AI response. Please try again.');
      }
    }
  },

  // Generate image (not available for Gemini yet)
  async generateImage(prompt, size = '1024x1024') {
    throw new Error('Image generation not available for Google Gemini models');
  },

  // Validate API key
  async validateApiKey() {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent('test');
      return result.response.text() !== undefined;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  }
};

export default googleApi;