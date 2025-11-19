import OpenAI from 'openai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from server-side environment variable (no REACT_APP_ prefix)
    const apiKey = process.env.OPENAI_API_KEY;

    console.log('OpenAI API Key Length:', apiKey ? apiKey.length : 'undefined');
    console.log('API Key starts with:', apiKey ? apiKey.substring(0, 20) + '...' : 'undefined');

    if (!apiKey) {
      console.error('OpenAI API key not configured in Vercel environment variables');
      return res.status(500).json({
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in Vercel environment variables.'
      });
    }

    if (apiKey.length < 40) {
      console.error('OpenAI API key appears to be invalid (too short)');
      return res.status(500).json({
        error: 'OpenAI API key appears to be invalid. Please check your environment variables.'
      });
    }

    // Initialize OpenAI client with server-side key and timeout configuration
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 55000, // 55 seconds - gives OpenAI time to respond before Vercel timeout
      maxRetries: 1    // Retry once on network errors
    });

    const { messages, model = 'gpt-4o-mini', stream = false } = req.body;

    // GPT-5 models only support temperature = 1
    const isGPT5Model = model.startsWith('gpt-5');
    const temperature = isGPT5Model ? 1 : (req.body.temperature || 0.7);

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (stream) {
      // Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const stream = await openai.chat.completions.create({
          model,
          messages,
          temperature,
          stream: true,
        });

        // Forward the stream to the client
        for await (const chunk of stream) {
          const data = JSON.stringify(chunk);
          res.write(`data: ${data}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('OpenAI streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      const startTime = Date.now();
      console.log(`[OpenAI] Starting request - Model: ${model}, Messages: ${messages.length}`);

      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature,
      });

      const duration = Date.now() - startTime;
      console.log(`[OpenAI] Request completed - Duration: ${duration}ms, Model: ${model}, Tokens: ${completion.usage?.total_tokens || 'unknown'}`);

      // Validate response has expected structure
      if (!completion || !completion.choices || !completion.choices[0]) {
        console.error('Invalid OpenAI response structure:', completion);
        return res.status(500).json({
          error: 'Invalid response from OpenAI API',
          details: 'Response missing expected structure'
        });
      }

      res.status(200).json(completion);
    }
  } catch (error) {
    console.error('[OpenAI] API error:', {
      message: error.message,
      code: error.code,
      type: error.type,
      status: error.status,
      model: req.body?.model
    });

    // Provide user-friendly error messages
    let userMessage = error.message || 'Failed to process OpenAI request';

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      userMessage = 'Request timed out. The AI model is taking longer than expected. Try using a faster model like GPT-5 Mini or GPT-5 Nano.';
    } else if (error.status === 429) {
      userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.status === 401) {
      userMessage = 'Authentication failed. Please check API key configuration.';
    } else if (error.status === 503) {
      userMessage = 'OpenAI service is temporarily unavailable. Please try again in a moment.';
    }

    res.status(error.status || 500).json({
      error: userMessage,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}