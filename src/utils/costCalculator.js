// Cost calculator utility for AI model usage
// Based on 2025 pricing research

// Pricing data (cost per 1 million tokens)
export const MODEL_PRICING = {
  // OpenAI Models
  'gpt-4.1-mini': {
    input: 0.40,
    output: 1.60,
    provider: 'OpenAI',
    displayName: 'GPT-4.1 Mini'
  },
  'gpt-4.1': {
    input: 2.00,
    output: 8.00,
    provider: 'OpenAI',
    displayName: 'GPT-4.1'
  },
  // Legacy OpenAI (for backward compatibility)
  'gpt-4o-2024-08-06': {
    input: 5.00,
    output: 15.00,
    provider: 'OpenAI',
    displayName: 'GPT-4o (Legacy)'
  },
  'gpt-4o': {
    input: 5.00,
    output: 15.00,
    provider: 'OpenAI',
    displayName: 'GPT-4o (Legacy)'
  },
  // Anthropic Models
  'claude-sonnet-4-20250514': {
    input: 3.00,
    output: 15.00,
    provider: 'Anthropic',
    displayName: 'Claude Sonnet 4'
  },
  'claude-sonnet-4': {
    input: 3.00,
    output: 15.00,
    provider: 'Anthropic',
    displayName: 'Claude Sonnet 4'
  },
  // Google Models
  'gemini-1.5-flash': {
    input: 0.15,
    output: 0.60,
    provider: 'Google',
    displayName: 'Gemini Flash'
  },
  'gemini-flash': {
    input: 0.15,
    output: 0.60,
    provider: 'Google',
    displayName: 'Gemini Flash'
  },
  // Perplexity Models
  'sonar-pro': {
    input: 3.00,
    output: 15.00,
    provider: 'Perplexity',
    displayName: 'Sonar Pro',
    searchCost: 0.005 // $5 per 1000 searches = $0.005 per search
  }
};

// Display name mappings for UI
export const DISPLAY_NAME_MAPPING = {
  'GPT-4.1 Mini': 'gpt-4.1-mini',
  'GPT-4.1': 'gpt-4.1',
  'GPT-4o': 'gpt-4o',
  'Claude Sonnet 4': 'claude-sonnet-4-20250514',
  'Gemini Flash': 'gemini-1.5-flash',
  'Sonar Pro': 'sonar-pro'
};

/**
 * Calculate the cost for a specific model usage
 * @param {string} modelId - The model identifier
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @param {number} searches - Number of searches (for Perplexity models)
 * @returns {object} Cost breakdown
 */
export function calculateModelCost(modelId, inputTokens = 0, outputTokens = 0, searches = 0) {
  // Normalize model ID to handle display names
  let normalizedModelId = modelId;
  if (DISPLAY_NAME_MAPPING[modelId]) {
    normalizedModelId = DISPLAY_NAME_MAPPING[modelId];
  }

  const pricing = MODEL_PRICING[normalizedModelId];
  
  if (!pricing) {
    console.warn(`Unknown model for cost calculation: ${modelId}`);
    return {
      inputCost: 0,
      outputCost: 0,
      searchCost: 0,
      totalCost: 0,
      provider: 'Unknown',
      displayName: modelId
    };
  }

  // Calculate costs (pricing is per 1M tokens)
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  const searchCost = searches * (pricing.searchCost || 0);
  const totalCost = inputCost + outputCost + searchCost;

  return {
    inputCost,
    outputCost,
    searchCost,
    totalCost,
    provider: pricing.provider,
    displayName: pricing.displayName,
    modelId: normalizedModelId
  };
}

/**
 * Calculate total platform costs from usage data
 * @param {Array} usageData - Array of usage records with model, tokens, etc.
 * @returns {object} Aggregated cost data
 */
export function calculatePlatformCosts(usageData) {
  const summary = {
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalSearches: 0,
    totalInteractions: usageData.length,
    byProvider: {},
    byModel: {},
    dailyCosts: {}
  };

  usageData.forEach(record => {
    const cost = calculateModelCost(
      record.model || record.toolUsed,
      record.inputTokens || 0,
      record.outputTokens || 0,
      record.searches || 0
    );

    // Add to totals
    summary.totalCost += cost.totalCost;
    summary.totalInputTokens += record.inputTokens || 0;
    summary.totalOutputTokens += record.outputTokens || 0;
    summary.totalSearches += record.searches || 0;

    // Group by provider
    if (!summary.byProvider[cost.provider]) {
      summary.byProvider[cost.provider] = {
        cost: 0,
        interactions: 0,
        inputTokens: 0,
        outputTokens: 0
      };
    }
    summary.byProvider[cost.provider].cost += cost.totalCost;
    summary.byProvider[cost.provider].interactions += 1;
    summary.byProvider[cost.provider].inputTokens += record.inputTokens || 0;
    summary.byProvider[cost.provider].outputTokens += record.outputTokens || 0;

    // Group by model
    if (!summary.byModel[cost.displayName]) {
      summary.byModel[cost.displayName] = {
        cost: 0,
        interactions: 0,
        inputTokens: 0,
        outputTokens: 0,
        provider: cost.provider
      };
    }
    summary.byModel[cost.displayName].cost += cost.totalCost;
    summary.byModel[cost.displayName].interactions += 1;
    summary.byModel[cost.displayName].inputTokens += record.inputTokens || 0;
    summary.byModel[cost.displayName].outputTokens += record.outputTokens || 0;

    // Group by day
    if (record.date) {
      const day = record.date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!summary.dailyCosts[day]) {
        summary.dailyCosts[day] = 0;
      }
      summary.dailyCosts[day] += cost.totalCost;
    }
  });

  return summary;
}

/**
 * Estimate monthly costs based on current usage
 * @param {object} platformCosts - Result from calculatePlatformCosts
 * @param {number} daysOfData - Number of days the data represents
 * @returns {number} Estimated monthly cost
 */
export function estimateMonthlyCost(platformCosts, daysOfData) {
  if (daysOfData <= 0) return 0;
  
  const dailyAverage = platformCosts.totalCost / daysOfData;
  return dailyAverage * 30; // 30 days per month
}

/**
 * Format currency for display
 * @param {number} amount - Amount in USD
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(amount);
}

/**
 * Format large numbers for display
 * @param {number} number - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(number) {
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  return number.toLocaleString();
}

export default {
  MODEL_PRICING,
  calculateModelCost,
  calculatePlatformCosts,
  estimateMonthlyCost,
  formatCurrency,
  formatNumber
};