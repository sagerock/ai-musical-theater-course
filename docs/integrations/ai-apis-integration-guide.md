# AI APIs Integration Guide

## Overview
This project integrates with 4 major AI providers to offer diverse AI model options for educational interactions.

## Supported AI Models

### OpenAI Integration
**Model**: GPT-4o (`gpt-4o-2024-08-06`) - Default model
**SDK**: openai@4.24.1
**File**: `src/services/openaiApi.js`

#### Configuration
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});
```

#### Usage Pattern
```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-2024-08-06',
  messages: messages,
  stream: true
});
```

### Anthropic Integration
**Model**: Claude Sonnet 4 (`claude-sonnet-4-20250514`)
**SDK**: @anthropic-ai/sdk@0.56.0
**File**: `src/services/anthropicApi.js`

#### Configuration
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});
```

#### Usage Pattern
```javascript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  messages: messages,
  stream: true
});
```

### Google Gemini Integration
**Model**: Gemini Flash (`gemini-1.5-flash`)
**SDK**: @google/generative-ai@0.24.1
**File**: `src/services/googleApi.js`

#### Configuration
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

### Perplexity Integration
**Model**: Sonar Pro (`sonar-pro`)
**File**: `src/services/perplexityApi.js`

#### Configuration
```javascript
// Uses fetch API with Perplexity endpoint
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  headers: {
    'Authorization': `Bearer ${process.env.REACT_APP_PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

## Unified API Layer

### Central Router
**File**: `src/services/aiApi.js`
- Routes requests to appropriate provider based on model selection
- Handles streaming responses uniformly
- Provides consistent error handling

#### Usage in Components
```javascript
import { aiApi } from '../services/aiApi';

const response = await aiApi.sendMessage({
  messages: conversationHistory,
  model: selectedModel,
  onChunk: (chunk) => setStreamingResponse(prev => prev + chunk)
});
```

## Streaming Implementation

All AI providers support streaming responses for real-time chat experience:

### OpenAI Streaming
```javascript
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-2024-08-06',
  messages: messages,
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  onChunk(content);
}
```

### Anthropic Streaming
```javascript
const stream = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  messages: messages,
  stream: true
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    onChunk(chunk.delta.text);
  }
}
```

## Error Handling

### Common Error Patterns
- API key validation
- Rate limit handling
- Network timeout management
- Model-specific error responses

### Implementation
```javascript
try {
  const response = await aiApi.sendMessage(params);
  return response;
} catch (error) {
  console.error('AI API Error:', error);
  throw new Error(`AI service temporarily unavailable: ${error.message}`);
}
```

## Environment Variables Required

```env
# AI Provider API Keys
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key
REACT_APP_GOOGLE_API_KEY=your_google_api_key
REACT_APP_PERPLEXITY_API_KEY=your_perplexity_api_key
```

## Educational Use Cases

### Student Interactions
- Real-time AI tutoring sessions
- Code review and explanation
- Creative writing assistance
- Research and analysis help

### Instructor Oversight
- Monitor AI interaction patterns
- Track model usage statistics
- Review conversation quality
- Analyze student engagement

## Model Selection Strategy

1. **GPT-4o** (Default) - Best for general-purpose educational tasks
2. **Claude Sonnet 4** - Excellent for complex reasoning and analysis
3. **Gemini Flash** - Fast responses for quick questions
4. **Sonar Pro** - Research-focused with web search capabilities

This multi-provider approach ensures reliability and gives users access to the strengths of different AI models for various educational scenarios.