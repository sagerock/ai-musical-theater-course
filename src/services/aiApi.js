import { aiProxyService } from './aiProxyService';

// Export AI tools for use in components
export const AI_TOOLS = {
  // OpenAI Models
  'GPT-6 Luna': 'gpt-6-luna',
  'GPT-6.1 Sol': 'gpt-6.1-sol',
  // Anthropic Models
  'Claude Haiku 5.5': 'claude-haiku-5-5',
  'Claude Sonnet 5.5': 'claude-sonnet-5-5',
  'Claude Opus 5.5': 'claude-opus-5-5'
};

export const DEFAULT_AI_TOOL = 'GPT-6.1 Sol';

const ANTHROPIC_MODELS = {
  'Claude Haiku 5.5': 'claude-haiku-5-5',
  'Claude Sonnet 5.5': 'claude-sonnet-5-5',
  'Claude Opus 5.5': 'claude-opus-5-5'
};

// Model-specific educational prompting strategies
const MODEL_SPECIFIC_PROMPTS = {
  'gpt-6-luna': `EFFICIENT EDUCATIONAL MODE: As GPT-6 Luna, provide fast, clear educational support:
• Give concise explanations that build understanding step by step
• Ask a guiding question when the student would learn more by working it out
• Point students toward reliable sources they can verify`,

  'gpt-6.1-sol': `BALANCED EDUCATIONAL MODE: As GPT-6.1 Sol, provide thoughtful, well-reasoned educational support:
• Explain reasoning clearly and show how ideas connect
• Encourage critical thinking with follow-up questions
• Model sound academic writing and evidence-based arguments`,

  'claude-haiku-5-5': `EFFICIENT EDUCATIONAL MODE: As Claude Haiku 5.5, provide fast yet thoughtful educational support:
• Give clear, accurate explanations without padding
• Ask a guiding question when the student would learn more by working it out
• Be honest about uncertainty and suggest how to verify`,

  'claude-sonnet-5-5': `EDUCATIONAL EXCELLENCE MODE: As Claude Sonnet 5.5, provide thoughtful educational support:
• Explain complex ideas with clarity and nuance
• Help students develop their own arguments rather than writing for them
• Encourage critical evaluation of sources and evidence`,

  'claude-opus-5-5': `RESEARCH MENTOR MODE: As Claude Opus 5.5, bring deep analysis to the student's work:
• Engage with complex questions across disciplines in depth
• Help students structure research and test their reasoning
• Model rigorous academic standards and intellectual honesty`,

  'default': `EDUCATIONAL SUPPORT MODE: Provide foundational educational assistance:
• Focus on clear explanations and step-by-step learning
• Encourage students to seek additional sources for verification
• Model good academic practices even with general knowledge responses`
};

// Centralized educational system prompt with enhanced citation requirements
export const EDUCATIONAL_SYSTEM_PROMPT = `You are a scholarly educational assistant designed to support students in academic research, writing, and critical thinking. Follow these academic standards:

CITATION REQUIREMENTS:
• Always provide specific, verifiable sources when making factual claims
• Include author names, publication titles, and dates when available  
• Distinguish clearly between verified sources and general knowledge
• Use proper academic citation format when possible
• For historical facts, scientific claims, or statistical data, always attempt to provide sources

EDUCATIONAL APPROACH:
• Encourage critical thinking and independent verification of information
• Explain your reasoning process clearly and step-by-step
• Model proper academic writing with clear structure and evidence-based arguments
• Ask follow-up questions that deepen understanding
• Acknowledge limitations and areas where students should seek additional sources

ACCURACY & INTEGRITY:
• Never provide false or misleading information
• If uncertain about facts, clearly state limitations and recommend verification
• Distinguish between established facts, current debates, and personal interpretations
• Encourage students to cross-reference multiple sources for important claims

Your goal is to help students develop strong research, writing, and critical thinking skills while maintaining the highest academic standards.`;

// Enhanced system prompt that adapts to specific models
export const getModelSpecificPrompt = (modelId) => {
  const specificPrompt = MODEL_SPECIFIC_PROMPTS[modelId] || MODEL_SPECIFIC_PROMPTS['default'];
  return `${EDUCATIONAL_SYSTEM_PROMPT}

${specificPrompt}`;
};

// Helper function to determine provider based on model
const getProviderFromModel = (tool) => {
  const modelId = AI_TOOLS[tool];
  return modelId && Object.values(ANTHROPIC_MODELS).includes(modelId) ? 'anthropic' : 'openai';
};

// Unified AI API service
export const aiApi = {
  // Send chat completion request (routes through secure proxy)
  async sendChatCompletion(prompt, tool = DEFAULT_AI_TOOL, conversationHistory = [], customSystemPrompt = null) {
    const modelId = AI_TOOLS[tool];
    const enhancedSystemPrompt = customSystemPrompt || getModelSpecificPrompt(modelId);
    
    try {
      // Use the proxy service instead of direct API calls
      const response = await aiProxyService.sendChatCompletion(
        prompt,
        tool,
        conversationHistory,
        enhancedSystemPrompt
      );

      // Log the response for debugging
      console.log('AI Proxy Response:', JSON.stringify(response, null, 2));

      // Extract the message content from the response
      let messageContent = null;

      if (response) {
        if (response.choices && response.choices[0]) {
          if (response.choices[0].message && response.choices[0].message.content) {
            messageContent = response.choices[0].message.content;
          } else if (response.choices[0].text) {
            messageContent = response.choices[0].text;
          }
        } else if (response.content) {
          messageContent = response.content;
        } else if (response.message) {
          messageContent = response.message;
        } else if (typeof response === 'string') {
          messageContent = response;
        }
      }

      if (response && response.error) {
        console.error('API returned error:', response.error);
        throw new Error(response.error);
      }

      if (!messageContent) {
        console.error('No content found in response:', response);
        messageContent = 'I apologize, but I encountered an error processing your request. Please try again.';
      }

      return messageContent;
    } catch (error) {
      console.error(`AI API Error:`, error);
      throw error;
    }
  },

  // Generate image (OpenAI only - not yet implemented in proxy)
  async generateImage(prompt, size = '1024x1024') {
    // TODO: Implement image generation in API proxy
    throw new Error('Image generation not yet available through secure proxy. Please check back later.');
  },

  // Validate API keys (checks server-side configuration)
  async validateApiKeys() {
    // Since keys are on server-side, we can't validate them from client
    // Return true for all as they're configured in Vercel
    return {
      openai: true,
      anthropic: true
    };
  },

  // Get available models
  async getAvailableModels() {
    return Object.entries(AI_TOOLS).map(([name, id]) => ({
      id,
      name,
      provider: Object.values(ANTHROPIC_MODELS).includes(id) ? 'anthropic' : 'openai'
    }));
  }
};

// Export default
export default aiApi;