const express = require('express')
const path = require('path')
const cors = require('cors')
require('dotenv').config({ path: '.env.local' })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ============================================================
// AI Proxy Routes
// ============================================================

// OpenAI
app.post('/api/openai', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey, timeout: 55000, maxRetries: 1 })

    const { messages, model = 'gpt-4o-mini', stream = false } = req.body
    if (!messages) return res.status(400).json({ error: 'messages is required' })

    const isGPT5Model = model.startsWith('gpt-5')
    const requestParams = {
      model,
      messages,
      stream,
      ...(isGPT5Model ? { temperature: 1 } : {})
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const streamResponse = await openai.chat.completions.create({ ...requestParams, stream: true })
      for await (const chunk of streamResponse) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`)
      }
      res.write('data: [DONE]\n\n')
      res.end()
    } else {
      const response = await openai.chat.completions.create(requestParams)
      res.json(response)
    }
  } catch (error) {
    console.error('OpenAI error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Anthropic
app.post('/api/anthropic', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

    const Anthropic = require('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey })

    const { messages, model = 'claude-sonnet-4-6', max_tokens = 4096, stream = false } = req.body
    if (!messages) return res.status(400).json({ error: 'messages is required' })

    const systemMessage = messages.find(m => m.role === 'system')
    const userMessages = messages.filter(m => m.role !== 'system')

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const streamResponse = await anthropic.messages.create({
        model, max_tokens,
        messages: userMessages,
        system: systemMessage?.content,
        stream: true
      })
      for await (const chunk of streamResponse) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk.delta?.text || '' } }] })}\n\n`)
      }
      res.write('data: [DONE]\n\n')
      res.end()
    } else {
      const message = await anthropic.messages.create({
        model, max_tokens,
        messages: userMessages,
        system: systemMessage?.content
      })
      const textContent = message.content?.[0]?.text || ''
      res.json({
        id: message.id,
        object: 'chat.completion',
        created: Date.now() / 1000,
        model: message.model,
        choices: [{ index: 0, message: { role: 'assistant', content: textContent }, finish_reason: message.stop_reason || 'stop' }],
        usage: {
          prompt_tokens: message.usage?.input_tokens || 0,
          completion_tokens: message.usage?.output_tokens || 0,
          total_tokens: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0)
        }
      })
    }
  } catch (error) {
    console.error('Anthropic error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Google
app.post('/api/google', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not configured' })

    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)

    const { messages, model = 'gemini-2.5-flash', stream = false } = req.body
    if (!messages) return res.status(400).json({ error: 'messages is required' })

    const generativeModel = genAI.getGenerativeModel({ model })
    const systemMessage = messages.find(m => m.role === 'system')
    const conversationMessages = messages.filter(m => m.role !== 'system')
    const formattedMessages = conversationMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const chat = generativeModel.startChat({ history: formattedMessages.slice(0, -1) })
    const lastMessage = conversationMessages[conversationMessages.length - 1]
    const prompt = systemMessage ? `Context: ${systemMessage.content}\n\n${lastMessage.content}` : lastMessage.content

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const result = await chat.sendMessageStream(prompt)
      for await (const chunk of result.stream) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk.text() } }] })}\n\n`)
      }
      res.write('data: [DONE]\n\n')
      res.end()
    } else {
      const result = await chat.sendMessage(prompt)
      const response = await result.response
      res.json({
        id: 'google-' + Date.now(),
        object: 'chat.completion',
        created: Date.now() / 1000,
        model,
        choices: [{ index: 0, message: { role: 'assistant', content: response.text() }, finish_reason: 'stop' }],
        usage: {
          prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: response.usageMetadata?.totalTokenCount || 0
        }
      })
    }
  } catch (error) {
    console.error('Google error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Perplexity
app.post('/api/perplexity', async (req, res) => {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'PERPLEXITY_API_KEY not configured' })

    let { messages, model = 'sonar', stream = false } = req.body
    if (model === 'sonar-pro') model = 'sonar'
    if (!messages) return res.status(400).json({ error: 'messages is required' })

    const perplexityUrl = 'https://api.perplexity.ai/chat/completions'
    const response = await fetch(perplexityUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Perplexity error ${response.status}: ${err}`)
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
      res.end()
    } else {
      res.json(await response.json())
    }
  } catch (error) {
    console.error('Perplexity error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Send Email (SendGrid)
app.post('/api/send-email', async (req, res) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@aiengagementhub.com'
    if (!apiKey) return res.status(500).json({ error: 'SENDGRID_API_KEY not configured' })

    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(apiKey)

    const { to, subject, htmlContent, textContent, replyTo } = req.body
    if (!to || !subject || (!htmlContent && !textContent)) {
      return res.status(400).json({ error: 'to, subject, and htmlContent or textContent are required' })
    }

    const msg = {
      to,
      from: { email: fromEmail, name: 'AI Engagement Hub' },
      subject,
      text: textContent || (htmlContent || '').replace(/<[^>]*>/g, ''),
      html: htmlContent || textContent,
      ...(replyTo ? { replyTo } : {})
    }

    const result = await sgMail.send(msg)
    res.json({ success: true, statusCode: result[0].statusCode })
  } catch (error) {
    console.error('SendGrid error:', error.message)
    res.status(500).json({ error: error.message, details: error.response?.body?.errors })
  }
})

// Stripe — create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' })

    const stripe = require('stripe')(stripeKey)
    const { userId, userEmail, courseCode } = req.body
    if (!userId || !userEmail) return res.status(400).json({ error: 'userId and userEmail are required' })

    // Delegate to the existing handler logic
    const handler = await import('./api/create-checkout-session.js')
    return handler.default(req, res)
  } catch (error) {
    console.error('Stripe checkout error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Stripe webhook
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const handler = await import('./api/stripe-webhook.js')
    return handler.default(req, res)
  } catch (error) {
    console.error('Stripe webhook error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ============================================================
// Serve React build (production)
// ============================================================
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'build')
  app.use(express.static(buildPath))
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Engagement Hub server running on port ${PORT}`)
})
