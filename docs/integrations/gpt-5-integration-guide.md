# GPT-5 Integration Guide

## Overview
OpenAI's GPT-5 series models (GPT-5, GPT-5 Mini, GPT-5 Nano) require using the new **Responses API** instead of the traditional Chat Completions API. This guide documents the integration requirements and implementation details.

## Key Differences from Previous Models

### API Endpoint Change
- **Old Models (GPT-4, etc.)**: Use `openai.chat.completions.create()`
- **GPT-5 Models**: Use `openai.responses.create()`

### Message Format
- **Old Format**: Uses `system`, `user`, `assistant` roles
- **New Format**: Uses `developer`, `user`, `assistant` roles

### Response Structure
- **Old**: Simple `choices[0].message.content` extraction
- **New**: Nested structure requiring iteration through `output[].content[].text`

## Implementation

### 1. Model Detection
```javascript
const isGPT5Model = model.startsWith('gpt-5');
```

### 2. Responses API Call
```javascript
if (isGPT5Model) {
  const response = await openai.responses.create({
    model: model,
    input: [
      { role: 'developer', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    text: {
      verbosity: 'medium'  // 'low', 'medium', 'high'
    },
    reasoning: {
      effort: 'medium'  // 'minimal', 'medium', 'high'
    }
  });
}
```

### 3. Response Extraction
```javascript
let outputText = '';
if (response.output && Array.isArray(response.output)) {
  for (const item of response.output) {
    if (item && item.content) {
      for (const content of item.content) {
        if (content && content.text) {
          outputText += content.text;
        }
      }
    }
  }
}
```

## GPT-5 Specific Parameters

### Verbosity Parameter
Controls the length and detail of responses:
- `low`: Terse, minimal prose
- `medium`: Balanced detail (default)
- `high`: Verbose, comprehensive responses

### Reasoning Effort
Controls the amount of reasoning tokens:
- `minimal`: Fast responses with minimal reasoning
- `medium`: Balanced reasoning (default)
- `high`: Deep reasoning for complex tasks

## Model Specifications

| Model | ID | Best For | Cost (per 1M tokens) |
|-------|----|----|-----|
| GPT-5 Nano | `gpt-5-nano-2025-08-07` | Fast, simple tasks | $0.05 input / $0.40 output |
| GPT-5 Mini | `gpt-5-mini-2025-08-07` | Balanced performance | $0.25 input / $2.00 output |
| GPT-5 | `gpt-5-2025-08-07` | Complex reasoning, coding | $1.25 input / $10.00 output |

## Advanced Features (Not Yet Implemented)

### 1. Freeform Function Calling
GPT-5 supports sending raw text payloads to custom tools without JSON wrapping:
```javascript
tools: [{
  type: "custom",
  name: "code_exec",
  description: "Executes arbitrary code"
}]
```

### 2. Context-Free Grammar (CFG)
Constrain output to match predefined syntax:
```javascript
format: {
  type: "grammar",
  syntax: "lark",
  definition: grammarRules
}
```

## Error Handling

GPT-5 models may return different error codes:
- Handle traditional error codes for backward compatibility
- Add specific GPT-5 error handling as needed

## Testing Checklist

- [ ] GPT-5 Nano returns responses
- [ ] GPT-5 Mini returns responses  
- [ ] GPT-5 returns responses
- [ ] Response formatting is correct
- [ ] Usage tracking works properly
- [ ] Error handling functions correctly
- [ ] Conversation history maintains context

## Migration Notes

When updating from GPT-4 to GPT-5:
1. Update model IDs in `AI_TOOLS` configuration
2. Implement conditional logic for Responses API
3. Update response extraction logic
4. Test thoroughly with each model variant
5. Update cost calculations if needed

## References

- [OpenAI GPT-5 Documentation](https://platform.openai.com/docs/models/gpt-5)
- [Responses API Reference](https://platform.openai.com/docs/api-reference/responses)
- Implementation: `/src/services/openaiApi.js`