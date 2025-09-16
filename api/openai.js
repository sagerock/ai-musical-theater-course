import OpenAI from 'openai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from server-side environment variable (no REACT_APP_ prefix)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OpenAI API key not configured in Vercel environment variables');
      return res.status(500).json({
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in Vercel environment variables.'
      });
    }

    // Initialize OpenAI client with server-side key
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const { messages, model = 'gpt-4o-mini', temperature = 0.7, stream = false } = req.body;

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
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature,
      });

      res.status(200).json(completion);
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process OpenAI request',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}