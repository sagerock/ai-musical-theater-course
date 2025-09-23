// Retry Helper for handling transient AI API failures

class RetryHelper {
  constructor() {
    this.defaultConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffFactor: 2,
      retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNREFUSED',
        'NetworkError',
        'TimeoutError'
      ],
      retryableStatusCodes: [
        408, // Request Timeout
        429, // Too Many Requests
        500, // Internal Server Error
        502, // Bad Gateway
        503, // Service Unavailable
        504, // Gateway Timeout
        522, // Connection timed out
        524  // A timeout occurred
      ]
    };
  }

  async withRetry(fn, options = {}) {
    const config = { ...this.defaultConfig, ...options };
    let lastError;
    let attempt = 0;

    while (attempt < config.maxRetries) {
      try {
        // Log retry attempt if not first attempt
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt} of ${config.maxRetries - 1}`);
        }

        // Execute the function
        const result = await fn();

        // Success - log if it was a retry
        if (attempt > 0) {
          console.log(`✅ Succeeded on retry attempt ${attempt}`);
        }

        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        // Check if error is retryable
        if (!this.isRetryable(error, config)) {
          console.log(`❌ Error is not retryable: ${error.message}`);
          throw error;
        }

        // Check if we've exhausted retries
        if (attempt >= config.maxRetries) {
          console.log(`❌ Max retries (${config.maxRetries}) exhausted`);
          throw new Error(`Failed after ${config.maxRetries} attempts: ${error.message}`);
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config);
        console.log(`⏳ Waiting ${delay}ms before retry...`);

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await this.sleep(jitteredDelay);
      }
    }

    throw lastError;
  }

  isRetryable(error, config) {
    // Check for network errors
    if (error.code && config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check for retryable status codes
    if (error.status && config.retryableStatusCodes.includes(error.status)) {
      return true;
    }

    // Check for specific error messages
    const errorMessage = error.message?.toLowerCase() || '';
    const retryableMessages = [
      'network',
      'timeout',
      'fetch failed',
      'connection',
      'econnreset',
      'socket hang up',
      'rate limit',
      'too many requests',
      'service unavailable',
      'gateway'
    ];

    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  calculateDelay(attempt, config) {
    // Exponential backoff with jitter
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(exponentialDelay, config.maxDelay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Model-specific retry configurations
  getModelConfig(model) {
    const configs = {
      // GPT-5 models - typically more stable, fewer retries needed
      'gpt-5': {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 5000
      },
      'gpt-5-mini': {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 5000
      },
      'gpt-5-nano': {
        maxRetries: 2,
        baseDelay: 800,
        maxDelay: 3000
      },
      // Claude models - might need more retries due to capacity
      'claude': {
        maxRetries: 3,
        baseDelay: 1500,
        maxDelay: 10000
      },
      // Gemini models - Google infrastructure, usually reliable
      'gemini': {
        maxRetries: 2,
        baseDelay: 1000,
        maxDelay: 5000
      },
      // Perplexity - external service, might need more retries
      'sonar': {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 10000
      }
    };

    // Find matching config based on model name
    for (const [key, config] of Object.entries(configs)) {
      if (model.toLowerCase().includes(key)) {
        return config;
      }
    }

    // Default config
    return this.defaultConfig;
  }
}

// Create singleton instance
const retryHelper = new RetryHelper();

export default retryHelper;