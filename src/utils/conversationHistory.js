/**
 * Smart Conversation History Manager
 * Dynamically adjusts conversation context based on model capabilities
 */

// Model configurations with their context limits and optimal settings
const MODEL_CONFIGS = {
  // OpenAI GPT-5 Series
  'GPT-5 Nano': {
    maxTokens: 128000,        // 128K context window
    optimalMessages: 20,      // Keep more messages for better context
    maxMessages: 50,          // Maximum to prevent token overflow
    avgTokensPerMessage: 150 // Rough estimate
  },
  'GPT-5 Mini': {
    maxTokens: 128000,        // 128K context window
    optimalMessages: 25,      // Balanced approach
    maxMessages: 60,
    avgTokensPerMessage: 150
  },
  'GPT-5': {
    maxTokens: 400000,        // 400K context window (huge!)
    optimalMessages: 40,      // Can handle extensive context
    maxMessages: 100,         // Very generous limit
    avgTokensPerMessage: 150
  },
  
  // Anthropic Claude Models
  'Claude Sonnet 4': {
    maxTokens: 200000,        // 200K context window
    optimalMessages: 30,      // Good balance for Claude
    maxMessages: 75,
    avgTokensPerMessage: 150
  },
  'Claude Opus 4': {
    maxTokens: 200000,        // 200K context window
    optimalMessages: 35,      // Premium model can handle more
    maxMessages: 80,
    avgTokensPerMessage: 150
  },
  
  // Google Gemini Models
  'Gemini Flash': {
    maxTokens: 32000,         // 32K context window
    optimalMessages: 10,      // Keep it lighter for Flash
    maxMessages: 25,
    avgTokensPerMessage: 150
  },
  'Gemini 2.5 Pro': {
    maxTokens: 1000000,       // 1M context window (massive!)
    optimalMessages: 50,      // Can handle very long conversations
    maxMessages: 200,         // Extremely generous
    avgTokensPerMessage: 150
  },
  
  // Perplexity Model
  'Sonar Pro': {
    maxTokens: 127000,        // 127K context window
    optimalMessages: 20,      // Good for search-focused queries
    maxMessages: 50,
    avgTokensPerMessage: 150
  }
};

// Default fallback configuration
const DEFAULT_CONFIG = {
  maxTokens: 32000,
  optimalMessages: 10,
  maxMessages: 25,
  avgTokensPerMessage: 150
};

/**
 * Estimates the token count for a message
 * This is a rough approximation - actual tokenization varies by model
 */
function estimateTokens(text) {
  if (!text) return 0;
  
  // Rough estimate: ~1 token per 4 characters for English text
  // This is conservative to avoid hitting limits
  return Math.ceil(text.length / 3);
}

/**
 * Calculate total tokens in conversation history
 */
function calculateHistoryTokens(messages) {
  return messages.reduce((total, msg) => {
    const promptTokens = estimateTokens(msg.prompt || '');
    const responseTokens = estimateTokens(msg.response || '');
    return total + promptTokens + responseTokens;
  }, 0);
}

/**
 * Get smart conversation history based on the selected model
 * 
 * @param {Array} allChats - All chat messages in the conversation
 * @param {string} selectedTool - The currently selected AI model
 * @param {string} currentPrompt - The prompt being sent (to reserve tokens)
 * @param {string} pdfContent - Any PDF content being included (to reserve tokens)
 * @returns {Array} - Optimized conversation history
 */
export function getSmartConversationHistory(allChats, selectedTool, currentPrompt = '', pdfContent = '') {
  // Get model configuration
  const config = MODEL_CONFIGS[selectedTool] || DEFAULT_CONFIG;
  
  // Filter to only include valid messages
  const validChats = allChats.filter(chat => 
    chat.prompt && chat.response && 
    chat.prompt.trim() && chat.response.trim()
  );
  
  // If no history, return empty array
  if (validChats.length === 0) {
    return [];
  }
  
  // Calculate tokens reserved for the new prompt and PDF
  const reservedTokens = estimateTokens(currentPrompt) + estimateTokens(pdfContent) + 1000; // 1000 token buffer
  const availableTokens = Math.floor(config.maxTokens * 0.7) - reservedTokens; // Use 70% of max to be safe
  
  // Start with the optimal number of messages
  let historyMessages = validChats.slice(-config.optimalMessages);
  
  // Check if we're within token limits
  let historyTokens = calculateHistoryTokens(historyMessages);
  
  // If we're over the token limit, reduce messages
  while (historyTokens > availableTokens && historyMessages.length > 1) {
    historyMessages = historyMessages.slice(1); // Remove oldest message
    historyTokens = calculateHistoryTokens(historyMessages);
  }
  
  // If we have room and more messages available, try to add more
  const allValidMessages = validChats.slice(-config.maxMessages);
  if (historyMessages.length < allValidMessages.length) {
    for (let i = historyMessages.length; i < allValidMessages.length; i++) {
      const additionalMessage = allValidMessages[allValidMessages.length - i - 1];
      const additionalTokens = estimateTokens(additionalMessage.prompt) + estimateTokens(additionalMessage.response);
      
      // Check if adding this message would exceed our limit
      if (historyTokens + additionalTokens <= availableTokens) {
        historyMessages.unshift(additionalMessage);
        historyTokens += additionalTokens;
      } else {
        break; // Stop if we can't fit more
      }
    }
  }
  
  // Log the optimization results for debugging
  console.log(`📊 Smart History: ${selectedTool}`, {
    totalChats: allChats.length,
    validChats: validChats.length,
    includedMessages: historyMessages.length,
    estimatedTokens: historyTokens,
    availableTokens: availableTokens,
    config: config
  });
  
  return historyMessages;
}

/**
 * Get a summary of what will be included in the context
 */
export function getHistorySummary(allChats, selectedTool, currentPrompt = '', pdfContent = '') {
  const history = getSmartConversationHistory(allChats, selectedTool, currentPrompt, pdfContent);
  const config = MODEL_CONFIGS[selectedTool] || DEFAULT_CONFIG;
  
  return {
    messagesIncluded: history.length,
    totalMessages: allChats.length,
    estimatedTokens: calculateHistoryTokens(history),
    maxTokens: config.maxTokens,
    modelName: selectedTool
  };
}

/**
 * Check if a model supports long conversations well
 */
export function isLongContextModel(selectedTool) {
  const config = MODEL_CONFIGS[selectedTool];
  return config && config.maxTokens >= 100000;
}

/**
 * Get recommended message count for a model
 */
export function getRecommendedMessageCount(selectedTool) {
  const config = MODEL_CONFIGS[selectedTool] || DEFAULT_CONFIG;
  return config.optimalMessages;
}