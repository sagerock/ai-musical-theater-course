// Retry Helper for handling transient AI API failures

class RetryHelper {
  constructor() {
    this.defaultConfig = {
      maxRetries: 2, // Reduced from 3 to 2 - timeout errors unlikely to succeed on retry
      baseDelay: 2000, // Increased from 1s to 2s - give more time between retries
      maxDelay: 10000, // 10 seconds
      backoffFactor: 2,
      retryableErrors: [
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'NetworkError'
      ],
      nonRetryableErrors: [
        'ETIMEDOUT',     // Don't retry timeouts - they'll just timeout again
        'TimeoutError',   // Same for timeout errors
        'AbortError'      // Don't retry user-initiated aborts
      ],
      retryableStatusCodes: [
        429, // Too Many Requests - definitely retry
        500, // Internal Server Error - might be transient
        502, // Bad Gateway - might be transient
        503  // Service Unavailable - might recover
      ],
      nonRetryableStatusCodes: [
        408, // Request Timeout - don't retry, will timeout again
        504, // Gateway Timeout - don't retry, will timeout again
        522, // Connection timed out - don't retry
        524  // A timeout occurred - don't retry
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
    // First check if error is explicitly non-retryable
    if (error.code && config.nonRetryableErrors?.includes(error.code)) {
      console.log(`⛔ Error code ${error.code} is not retryable`);
      return false;
    }

    // Check for non-retryable status codes (timeouts)
    if (error.status && config.nonRetryableStatusCodes?.includes(error.status)) {
      console.log(`⛔ Status ${error.status} is not retryable (likely timeout)`);
      return false;
    }

    // Check for timeout in error name
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.log(`⛔ ${error.name} is not retryable`);
      return false;
    }

    // Check for network errors that ARE retryable
    if (error.code && config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check for retryable status codes
    if (error.status && config.retryableStatusCodes.includes(error.status)) {
      return true;
    }

    // Check for specific error messages - but exclude timeout messages
    const errorMessage = error.message?.toLowerCase() || '';

    // Non-retryable message patterns
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out') ||
        errorMessage.includes('abort')) {
      console.log(`⛔ Timeout/abort message detected - not retrying`);
      return false;
    }

    // Retryable message patterns
    const retryableMessages = [
      'network',
      'fetch failed',
      'connection reset',
      'econnreset',
      'socket hang up',
      'rate limit',
      'too many requests',
      'service unavailable'
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
      // GPT-5 models - Can experience high load, need robust retry
      'gpt-5': {
        maxRetries: 3,
        baseDelay: 1500,
        maxDelay: 10000
      },
      'gpt-5-mini': {
        maxRetries: 3,
        baseDelay: 1500,
        maxDelay: 10000
      },
      'gpt-5-nano': {
        maxRetries: 3,
        baseDelay: 1200,
        maxDelay: 8000
      },
      // Claude models - might need more retries due to capacity
      'claude': {
        maxRetries: 3,
        baseDelay: 1500,
        maxDelay: 10000
      },
      // Gemini models - Can be slower, especially 2.5 Pro with large contexts
      'gemini': {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 15000
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