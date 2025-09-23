// Error Logger Utility for AI Model Troubleshooting
// This helps diagnose intermittent AI model failures

class ErrorLogger {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100; // Keep last 100 errors
    this.diagnosticMode = this.checkDiagnosticMode();
  }

  checkDiagnosticMode() {
    // Enable diagnostic mode via URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debug') === 'true' ||
           localStorage.getItem('ai_diagnostic_mode') === 'true';
  }

  enableDiagnosticMode() {
    localStorage.setItem('ai_diagnostic_mode', 'true');
    this.diagnosticMode = true;
    console.log('🔍 AI Diagnostic Mode Enabled');
  }

  disableDiagnosticMode() {
    localStorage.removeItem('ai_diagnostic_mode');
    this.diagnosticMode = false;
    console.log('🔍 AI Diagnostic Mode Disabled');
  }

  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        networkType: navigator.connection?.effectiveType,
        online: navigator.onLine,
        timestamp: Date.now()
      },
      type: error.name || 'Error',
      model: context.model || 'unknown',
      provider: context.provider || 'unknown'
    };

    // Add to log
    this.errorLog.push(errorEntry);

    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('ai_error_log', JSON.stringify(this.errorLog));
    } catch (e) {
      console.warn('Failed to persist error log:', e);
    }

    // Console logging with formatting
    if (this.diagnosticMode) {
      console.group(`🚨 AI Error Logged [${errorEntry.model}]`);
      console.error('Error:', errorEntry.message);
      console.log('Context:', errorEntry.context);
      console.log('Stack:', errorEntry.stack);
      console.groupEnd();
    } else {
      console.error(`AI Error [${errorEntry.model}]:`, errorEntry.message);
    }

    return errorEntry;
  }

  logApiCall(request, response, duration) {
    if (!this.diagnosticMode) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      duration: duration,
      request: {
        model: request.model,
        provider: request.provider,
        promptLength: request.prompt?.length || 0,
        historyLength: request.conversationHistory?.length || 0
      },
      response: {
        success: response.success,
        statusCode: response.statusCode,
        hasContent: !!response.content,
        contentLength: response.content?.length || 0,
        error: response.error
      }
    };

    console.group(`📡 AI API Call [${request.model}]`);
    console.log('Duration:', `${duration}ms`);
    console.log('Request:', logEntry.request);
    console.log('Response:', logEntry.response);
    console.groupEnd();

    return logEntry;
  }

  getErrorReport() {
    // Load from localStorage if available
    try {
      const stored = localStorage.getItem('ai_error_log');
      if (stored) {
        this.errorLog = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load error log:', e);
    }

    const report = {
      totalErrors: this.errorLog.length,
      errorsByModel: {},
      errorsByProvider: {},
      errorsByType: {},
      recentErrors: this.errorLog.slice(-10),
      commonPatterns: this.findCommonPatterns()
    };

    // Group errors by model
    this.errorLog.forEach(error => {
      const model = error.model || 'unknown';
      const provider = error.provider || 'unknown';
      const type = error.type || 'unknown';

      report.errorsByModel[model] = (report.errorsByModel[model] || 0) + 1;
      report.errorsByProvider[provider] = (report.errorsByProvider[provider] || 0) + 1;
      report.errorsByType[type] = (report.errorsByType[type] || 0) + 1;
    });

    return report;
  }

  findCommonPatterns() {
    const patterns = [];

    // Check for network-related errors
    const networkErrors = this.errorLog.filter(e =>
      !e.context.online ||
      e.message.includes('network') ||
      e.message.includes('fetch')
    );
    if (networkErrors.length > 0) {
      patterns.push({
        type: 'Network Issues',
        count: networkErrors.length,
        message: 'Detected network connectivity problems'
      });
    }

    // Check for rate limiting
    const rateLimitErrors = this.errorLog.filter(e =>
      e.message.includes('rate') ||
      e.message.includes('429') ||
      e.message.includes('limit')
    );
    if (rateLimitErrors.length > 0) {
      patterns.push({
        type: 'Rate Limiting',
        count: rateLimitErrors.length,
        message: 'API rate limits being hit'
      });
    }

    // Check for authentication errors
    const authErrors = this.errorLog.filter(e =>
      e.message.includes('401') ||
      e.message.includes('403') ||
      e.message.includes('unauthorized') ||
      e.message.includes('authentication')
    );
    if (authErrors.length > 0) {
      patterns.push({
        type: 'Authentication',
        count: authErrors.length,
        message: 'API key or authentication issues'
      });
    }

    // Check for timeout errors
    const timeoutErrors = this.errorLog.filter(e =>
      e.message.includes('timeout') ||
      e.message.includes('timed out')
    );
    if (timeoutErrors.length > 0) {
      patterns.push({
        type: 'Timeouts',
        count: timeoutErrors.length,
        message: 'Requests taking too long to complete'
      });
    }

    // Check for specific model failures
    const modelGroups = {};
    this.errorLog.forEach(error => {
      const model = error.model || 'unknown';
      if (!modelGroups[model]) {
        modelGroups[model] = [];
      }
      modelGroups[model].push(error);
    });

    Object.entries(modelGroups).forEach(([model, errors]) => {
      if (errors.length >= 3) { // If a model has 3+ errors
        patterns.push({
          type: 'Model-Specific',
          count: errors.length,
          message: `${model} experiencing repeated failures`,
          model: model
        });
      }
    });

    return patterns;
  }

  clearErrorLog() {
    this.errorLog = [];
    localStorage.removeItem('ai_error_log');
    console.log('Error log cleared');
  }

  downloadErrorReport() {
    const report = this.getErrorReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-error-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.aiErrorLogger = errorLogger;
}

export default errorLogger;