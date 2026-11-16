import { authHeaders } from './authHeaders';
// API Health Check Service
// Tests connectivity and basic functionality of all AI provider APIs

export const apiHealthCheck = {
  /**
   * Test OpenAI API connection
   */
  async testOpenAI() {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say "OK" if you can read this.' }
          ],
          model: 'gpt-6-luna'
        })
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          provider: 'OpenAI',
          model: 'gpt-6-luna',
          error: error.error || `HTTP ${response.status}`,
          duration,
          timestamp: new Date().toISOString()
        };
      }

      const data = await response.json();

      return {
        success: true,
        provider: 'OpenAI',
        model: 'gpt-6-luna',
        response: data.choices?.[0]?.message?.content || 'No response',
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        provider: 'OpenAI',
        model: 'gpt-6-luna',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Test Anthropic API connection
   */
  async testAnthropic() {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Say "OK" if you can read this.' }
          ],
          model: 'claude-haiku-5-5'
        })
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          provider: 'Anthropic',
          model: 'claude-haiku-5-5',
          error: error.error || `HTTP ${response.status}`,
          duration,
          timestamp: new Date().toISOString()
        };
      }

      const data = await response.json();

      return {
        success: true,
        provider: 'Anthropic',
        model: 'claude-haiku-5-5',
        response: data.choices?.[0]?.message?.content || data.content?.[0]?.text || 'No response',
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        provider: 'Anthropic',
        model: 'claude-haiku-5-5',
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Run health checks for all providers
   */
  async testAll() {
    const results = await Promise.all([
      this.testOpenAI(),
      this.testAnthropic()
    ]);

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      averageDuration: Math.round(
        results.reduce((sum, r) => sum + r.duration, 0) / results.length
      ),
      timestamp: new Date().toISOString(),
      results
    };

    return summary;
  }
};

export default apiHealthCheck;
