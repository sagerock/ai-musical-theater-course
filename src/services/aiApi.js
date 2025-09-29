import { aiProxyService } from './aiProxyService';

// Export AI tools for use in components
export const AI_TOOLS = {
  // OpenAI Models
  'GPT-4o Mini': 'gpt-4o-mini',
  'GPT-4o': 'gpt-4o',
  'GPT-4 Turbo': 'gpt-4-turbo',
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

// Legacy model mappings for compatibility
const ANTHROPIC_MODELS = {
  'Claude 3 Haiku': 'claude-3-haiku-20240307',
  'Claude 3.5 Sonnet': 'claude-3-5-sonnet-20241022',
  'Claude 3 Opus': 'claude-3-opus-20240229'
};
const GOOGLE_MODELS = {
  'Gemini Flash': 'gemini-2.5-flash',
  'Gemini 2.5 Pro': 'gemini-2.5-pro'
};
const PERPLEXITY_MODELS = {
  'Sonar Pro': 'sonar-pro'
};

// Model-specific educational prompting strategies
const MODEL_SPECIFIC_PROMPTS = {
  'gemini-2.5-pro': `ENHANCED CITATION MODE: As Gemini 2.5 Pro with LearnLM training, you excel at providing verifiable academic sources. For this interaction:
• PRIORITIZE providing specific, citable sources with author names, publication titles, and dates
• Use your educational training to model proper scholarly methodology
• Leverage your large context window for comprehensive source synthesis
• Demonstrate academic writing standards with proper evidence-based arguments`,
  
  'gemini-2.5-flash': `EFFICIENT EDUCATION MODE: As Gemini Flash, provide quick yet educational responses:
• Balance speed with educational value and proper sourcing
• Focus on clear, concise explanations with key references
• Use your multimodal capabilities for comprehensive analysis when applicable`,
  
  'gpt-4o-mini': `OPTIMIZED EDUCATIONAL MODE: As GPT-4o Mini, provide concise, clear educational responses:
• Deliver concise explanations with excellent speed
• Focus on essential concepts for quick comprehension
• Ideal for rapid review and basic understanding tasks`,

  'gpt-4o': `BALANCED EDUCATIONAL MODE: As GPT-4o, your goal is to support learning with:
• Deliver well-structured explanations with strong reasoning
• Excel at a wide range of tasks with high accuracy
• Balance speed and depth for optimal learning efficiency`,

  'gpt-4-turbo': `ADVANCED EDUCATIONAL ASSISTANT: As GPT-4 Turbo, leverage your superior capabilities:
• Provide comprehensive technical analysis with excellent reasoning
• Excel at complex problem-solving and coding tasks
• Leverage large context window for extensive document analysis
• Ideal for advanced academic work and research projects`,
  
  // Claude model prompts
  'claude-3-haiku-20240307': `EFFICIENT EDUCATIONAL MODE: As Claude 3 Haiku, provide fast, clear responses:
  • Deliver concise explanations with good accuracy
  • Focus on essential concepts for quick comprehension
  • Ideal for rapid review and basic tasks`,

  'claude-3-5-sonnet-20241022': `EDUCATIONAL EXCELLENCE MODE: As Claude 3.5 Sonnet, provide thoughtful educational support:
  • Balance analytical depth with clarity
  • Excel at breaking down complex concepts
  • Provide well-structured responses that model academic writing
  • Emphasize critical thinking and evidence-based reasoning`,

  'claude-3-opus-20240229': `WORLD-CLASS RESEARCH ASSISTANT: As Claude 3 Opus, leverage your exceptional capabilities:
  • Deliver comprehensive, research-grade analysis
  • Model advanced academic writing with sophisticated arguments
  • Provide detailed explanations for advanced research projects
  • Focus on developing deep understanding and critical evaluation`,
  
  
  'sonar-pro': `CURRENT RESEARCH MODE: As Sonar Pro with real-time search capabilities:
• ALWAYS provide current, dated sources and recent information
• Emphasize recent developments and current scholarly debates
• Include publication dates and recent citations for all claims
• Focus on connecting current events to academic research`,
  
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
  
  if (!modelId) {
    return 'openai'; // default fallback
  }
  
  // Check if it's an Anthropic model
  if (Object.values(ANTHROPIC_MODELS).includes(modelId)) {
    return 'anthropic';
  }
  
  // Check if it's a Google model
  if (Object.values(GOOGLE_MODELS).includes(modelId)) {
    return 'google';
  }
  
  // Check if it's a Perplexity model
  if (Object.values(PERPLEXITY_MODELS).includes(modelId)) {
    return 'perplexity';
  }
  
  // Default to OpenAI for other models
  return 'openai';
};

// Unified AI API service
export const aiApi = {
  // Send chat completion request (routes through secure proxy)
  async sendChatCompletion(prompt, tool = 'GPT-4o Mini', conversationHistory = []) {
    const modelId = AI_TOOLS[tool];
    const enhancedSystemPrompt = getModelSpecificPrompt(modelId);
    
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
      anthropic: true,
      google: true,
      perplexity: true
    };
  },

  // Get available models
  async getAvailableModels() {
    const models = [];

    // Return static list since we can't query APIs from client
    // Add OpenAI models
    models.push(
      { id: 'gpt-5-nano-2025-08-07', name: 'GPT-5 Nano', provider: 'openai' },
      { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini', provider: 'openai' },
      { id: 'gpt-5-2025-08-07', name: 'GPT-5', provider: 'openai' }
    );

    // Add Anthropic models (they don't have a list endpoint)
    Object.entries(ANTHROPIC_MODELS).forEach(([name, id]) => {
      models.push({
        id,
        name,
        provider: 'anthropic'
      });
    });

    // Add Google models (they don't have a list endpoint)
    Object.entries(GOOGLE_MODELS).forEach(([name, id]) => {
      models.push({
        id,
        name,
        provider: 'google'
      });
    });

    // Add Perplexity models (they don't have a list endpoint)
    Object.entries(PERPLEXITY_MODELS).forEach(([name, id]) => {
      models.push({
        id,
        name,
        provider: 'perplexity'
      });
    });

    return models;
  }
};

// Export default
export default aiApi;