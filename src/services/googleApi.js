import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API_KEY);

// Available Google models - Streamlined selection
export const GOOGLE_MODELS = {
  'Gemini Flash': 'gemini-1.5-flash',
  'Gemini 2.5 Pro': 'gemini-2.5-pro'
};

export const googleApi = {
  // Send chat completion request
  async sendChatCompletion(prompt, tool = 'Gemini Flash', conversationHistory = [], systemPrompt = null) {
    try {
      const modelName = GOOGLE_MODELS[tool] || GOOGLE_MODELS['Gemini Flash'];
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Use provided system prompt or fallback to default
      const defaultSystemPrompt = 'You are a helpful AI assistant designed to support educational activities. Please provide thoughtful, accurate, and educational responses. Encourage critical thinking and ethical use of AI tools.';
      
      // Configure generation settings - increased limits for Gemini 2.5 Pro
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: modelName === 'gemini-2.5-pro' ? 8192 : 1000, // Higher limit for 2.5 Pro
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
          parts: [{ text: systemPrompt || defaultSystemPrompt }]
        }
      });

      // Send message
      const result = await chatSession.sendMessage(prompt);
      const response = result.response;
      
      console.log('Google API result:', result);
      console.log('Google API response:', response);
      console.log('Google API candidates:', response.candidates);
      
      // Extract text from candidates with better error handling
      let responseText = '';
      
      // Check finish reason first
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        console.log('Google API candidate:', candidate);
        console.log('Google API finish reason:', candidate.finishReason);
        
        // Handle different finish reasons
        if (candidate.finishReason === 'MAX_TOKENS') {
          console.warn('Response truncated due to max tokens limit');
        } else if (candidate.finishReason === 'SAFETY') {
          throw new Error('Response blocked due to safety filters');
        } else if (candidate.finishReason === 'RECITATION') {
          throw new Error('Response blocked due to recitation concerns');
        }
        
        // Extract text content
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          responseText = candidate.content.parts[0].text || '';
          console.log('Google API extracted text length:', responseText.length);
          console.log('Google API extracted text preview:', responseText.substring(0, 100));
        }
      }
      
      // Try alternative extraction method if first method fails
      if (!responseText) {
        try {
          responseText = response.text() || '';
          console.log('Google API text() method result length:', responseText.length);
        } catch (e) {
          console.log('Google API text() method failed:', e);
        }
      }
      
      // If still no response, throw an error
      if (!responseText) {
        throw new Error('No response received from Gemini model. This may be due to content filtering or technical issues.');
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('test');
      return result.response.text() !== undefined;
    } catch (error) {
      console.error('API Key validation failed:', error);
      return false;
    }
  }
};

export default googleApi;