import Anthropic from '@anthropic-ai/sdk';
import { requireUser, validateChatPayload } from './_auth.js';

// Includes the model's thinking, which counts toward max_tokens on current Claude models.
const MAX_OUTPUT_TOKENS = 16000;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Signed-in users only
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    // Get API key from server-side environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('Anthropic API key not configured in Vercel environment variables');
      return res.status(500).json({
        error: 'Anthropic API key not configured. Please set ANTHROPIC_API_KEY in Vercel environment variables.'
      });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const { messages, model = 'claude-sonnet-5-5', stream = false } = req.body;

    const payloadError = validateChatPayload(req.body, /^claude-[\w.-]+$/);
    if (payloadError) {
      return res.status(400).json({ error: payloadError });
    }

    const requestedTokens = Number.parseInt(req.body.max_tokens, 10);
    const max_tokens = Number.isFinite(requestedTokens) && requestedTokens > 0
      ? Math.min(requestedTokens, MAX_OUTPUT_TOKENS)
      : 8192;

    // Convert OpenAI format to Anthropic format if needed
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'assistant' : msg.role,
      content: msg.content
    }));

    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    if (stream) {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const stream = await anthropic.messages.create({
          model,
          max_tokens,
          messages: userMessages,
          system: systemMessage?.content,
          stream: true,
        });

        for await (const chunk of stream) {
          // Convert Anthropic stream format to OpenAI format for consistency
          if (chunk.type !== 'content_block_delta' || chunk.delta?.type !== 'text_delta') continue;
          const data = JSON.stringify({
            choices: [{
              delta: {
                content: chunk.delta.text
              }
            }]
          });
          res.write(`data: ${data}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('Anthropic streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      const message = await anthropic.messages.create({
        model,
        max_tokens,
        messages: userMessages,
        system: systemMessage?.content,
      });

      // Extract the text content safely
      // Current Claude models think first, so the reply is the text blocks, not content[0].
      const textContent = (message.content || [])
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('') || 'I apologize, but I was unable to generate a response.';

      // Convert Anthropic response to OpenAI format for consistency
      const response = {
        id: message.id,
        object: 'chat.completion',
        created: Date.now() / 1000,
        model: message.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: textContent
          },
          finish_reason: message.stop_reason || 'stop'
        }],
        usage: {
          prompt_tokens: message.usage?.input_tokens || 0,
          completion_tokens: message.usage?.output_tokens || 0,
          total_tokens: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0)
        }
      };

      res.status(200).json(response);
    }
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process Anthropic request',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}