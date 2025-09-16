export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from server-side environment variable
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      console.error('Perplexity API key not configured in Vercel environment variables');
      return res.status(500).json({
        error: 'Perplexity API key not configured. Please set PERPLEXITY_API_KEY in Vercel environment variables.'
      });
    }

    // Perplexity model naming - they use 'sonar' not 'sonar-pro'
    let { messages, model = 'sonar', stream = false } = req.body;

    // Map common variations to correct model name
    if (model === 'sonar-pro') {
      model = 'sonar';
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Perplexity uses OpenAI-compatible API
    const perplexityUrl = 'https://api.perplexity.ai/chat/completions';

    const requestBody = {
      model,
      messages,
      stream
    };

    if (stream) {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const response = await fetch(perplexityUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
        }

        // Forward the stream to the client
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }

        res.end();
      } catch (streamError) {
        console.error('Perplexity streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      const response = await fetch(perplexityUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        } else {
          errorMessage = await response.text();
        }

        console.error(`Perplexity API error (${response.status}):`, errorMessage);
        throw new Error(`Perplexity API error: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      res.status(200).json(data);
    }
  } catch (error) {
    console.error('Perplexity API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process Perplexity request',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}