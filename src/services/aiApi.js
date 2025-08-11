import { openaiApi, AI_TOOLS } from './openaiApi';
import { anthropicApi, ANTHROPIC_MODELS } from './anthropicApi';
import { googleApi, GOOGLE_MODELS } from './googleApi';
import { perplexityApi, PERPLEXITY_MODELS } from './perplexityApi';

// Model-specific educational prompting strategies
const MODEL_SPECIFIC_PROMPTS = {
  'gemini-2.5-pro': `ENHANCED CITATION MODE: As Gemini 2.5 Pro with LearnLM training, you excel at providing verifiable academic sources. For this interaction:
• PRIORITIZE providing specific, citable sources with author names, publication titles, and dates
• Use your educational training to model proper scholarly methodology
• Leverage your large context window for comprehensive source synthesis
• Demonstrate academic writing standards with proper evidence-based arguments`,
  
  'gemini-1.5-flash': `EFFICIENT EDUCATION MODE: As Gemini Flash, provide quick yet educational responses:
• Balance speed with educational value and proper sourcing
• Focus on clear, concise explanations with key references
• Use your multimodal capabilities for comprehensive analysis when applicable`,
  
  'gpt-5-nano': `ULTRA-FAST LEARNING MODE: As GPT-5 Nano, provide quick, efficient educational support:
• Deliver concise, clear explanations optimized for summarization and classification
• Focus on essential concepts and quick comprehension
• Ideal for rapid review and basic understanding tasks`,
  
  'gpt-5-mini': `BALANCED PERFORMANCE MODE: As GPT-5 Mini, provide excellent educational value with enhanced reasoning:
• Deliver well-structured explanations with improved logical reasoning
• Excel at well-defined tasks with precise educational outcomes
• Balance speed and depth for optimal learning efficiency`,
  
  'gpt-5': `PREMIUM CODING & REASONING MODE: As GPT-5, excel at complex coding and agentic tasks:
• Provide comprehensive technical analysis with superior reasoning capabilities
• Excel at complex problem-solving across all domains
• Leverage 400K context window for extensive code and document analysis
• Ideal for advanced coding, mathematical reasoning, and multi-step problems`,
  
  // Dated OpenAI IDs (2025-08-07) for GPT-5 series
  'gpt-5-nano-2025-08-07': `ULTRA-FAST LEARNING MODE: As GPT-5 Nano, provide quick, efficient educational support:
  • Deliver concise, clear explanations optimized for summarization and classification
  • Focus on essential concepts and quick comprehension
  • Ideal for rapid review and basic understanding tasks`,
  
  'gpt-5-mini-2025-08-07': `BALANCED PERFORMANCE MODE: As GPT-5 Mini, provide excellent educational value with enhanced reasoning:
  • Deliver well-structured explanations with improved logical reasoning
  • Excel at well-defined tasks with precise educational outcomes
  • Balance speed and depth for optimal learning efficiency`,
  
  'gpt-5-2025-08-07': `PREMIUM CODING & REASONING MODE: As GPT-5, excel at complex coding and agentic tasks:
  • Provide comprehensive technical analysis with superior reasoning capabilities
  • Excel at complex problem-solving across all domains
  • Leverage 400K context window for extensive code and document analysis
  • Ideal for advanced coding, mathematical reasoning, and multi-step problems`,
  
  'claude-sonnet-4-20250514': `ANALYTICAL EXCELLENCE MODE: As Claude Sonnet 4, leverage your analytical strengths:
• Focus on thoughtful, nuanced analysis with clear reasoning chains
• Excel at breaking down complex concepts for educational understanding
• Provide well-structured responses that model academic writing conventions
• Emphasize critical thinking and evidence-based reasoning`,
  
  'claude-4-opus-20250514': `RESEARCH PREMIUM MODE: As Claude Opus 4, provide the highest quality educational support:
• Deliver comprehensive, research-grade analysis and insights
• Model advanced academic writing with sophisticated arguments
• Provide detailed explanations suitable for advanced research projects
• Focus on developing deep understanding and critical evaluation skills`,
  
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
  // Send chat completion request (automatically routes to correct provider)
  async sendChatCompletion(prompt, tool = 'GPT-5 Mini', conversationHistory = []) {
    const provider = getProviderFromModel(tool);
    const modelId = AI_TOOLS[tool];
    const enhancedSystemPrompt = getModelSpecificPrompt(modelId);
    
    try {
      if (provider === 'anthropic') {
        return await anthropicApi.sendChatCompletion(prompt, tool, conversationHistory, enhancedSystemPrompt);
      } else if (provider === 'google') {
        return await googleApi.sendChatCompletion(prompt, tool, conversationHistory, enhancedSystemPrompt);
      } else if (provider === 'perplexity') {
        return await perplexityApi.sendChatCompletion(prompt, tool, conversationHistory, enhancedSystemPrompt);
      } else {
        return await openaiApi.sendChatCompletion(prompt, tool, conversationHistory, enhancedSystemPrompt);
      }
    } catch (error) {
      console.error(`${provider} API Error:`, error);
      throw error;
    }
  },

  // Generate image (OpenAI only for now)
  async generateImage(prompt, size = '1024x1024') {
    return await openaiApi.generateImage(prompt, size);
  },

  // Validate API keys
  async validateApiKeys() {
    const results = {
      openai: false,
      anthropic: false,
      google: false,
      perplexity: false
    };

    try {
      results.openai = await openaiApi.validateApiKey();
    } catch (error) {
      console.error('OpenAI validation failed:', error);
    }

    try {
      results.anthropic = await anthropicApi.validateApiKey();
    } catch (error) {
      console.error('Anthropic validation failed:', error);
    }

    try {
      results.google = await googleApi.validateApiKey();
    } catch (error) {
      console.error('Google validation failed:', error);
    }

    try {
      results.perplexity = await perplexityApi.validateApiKey();
    } catch (error) {
      console.error('Perplexity validation failed:', error);
    }

    return results;
  },

  // Get available models
  async getAvailableModels() {
    const models = [];
    
    try {
      const openaiModels = await openaiApi.getAvailableModels();
      models.push(...openaiModels.map(model => ({ ...model, provider: 'openai' })));
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
    }

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

// Export everything for backward compatibility
export { AI_TOOLS, openaiApi, anthropicApi, googleApi, perplexityApi, ANTHROPIC_MODELS, GOOGLE_MODELS, PERPLEXITY_MODELS };
export default aiApi;