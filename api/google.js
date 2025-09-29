import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from server-side environment variable
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('Google API key not configured in Vercel environment variables');
      return res.status(500).json({
        error: 'Google API key not configured. Please set GOOGLE_API_KEY in Vercel environment variables.'
      });
    }

    // Initialize Google AI client
    const genAI = new GoogleGenerativeAI(apiKey);

    const { messages, model = 'gemini-2.5-flash', stream = false } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get the model
    const generativeModel = genAI.getGenerativeModel({ model });

    // Separate system message from conversation
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    // Convert OpenAI format to Google AI format (excluding system messages)
    const formattedMessages = conversationMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Prepare the prompt with system context if present
    let finalPrompt = '';
    if (systemMessage) {
      finalPrompt = `Context: ${systemMessage.content}\n\n`;
    }

    // Google AI expects a different format for chat
    const chat = generativeModel.startChat({
      history: formattedMessages.slice(0, -1), // All messages except the last
    });

    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const messageToSend = finalPrompt + lastMessage.content;

    if (stream) {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const result = await chat.sendMessageStream(messageToSend);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          // Convert to OpenAI format for consistency
          const data = JSON.stringify({
            choices: [{
              delta: {
                content: text
              }
            }]
          });
          res.write(`data: ${data}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('Google AI streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      const result = await chat.sendMessage(messageToSend);
      const response = await result.response;

      // Convert Google response to OpenAI format for consistency
      const formattedResponse = {
        id: 'google-' + Date.now(),
        object: 'chat.completion',
        created: Date.now() / 1000,
        model: model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.text()
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: response.usageMetadata?.totalTokenCount || 0
        }
      };

      res.status(200).json(formattedResponse);
    }
  } catch (error) {
    console.error('Google AI API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process Google AI request',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}