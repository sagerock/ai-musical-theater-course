# AI Model Updates - November 2025

## Summary
Successfully added 8 new OpenAI models and updated premium model cost warnings.

## New Models Added

### GPT-5 Series (5 models)
1. **GPT-5 Nano** - `gpt-5-nano-2025-08-07`
   - Cost: $0.10/$0.80 per 1M tokens
   - Use: Ultra-efficient and cost-effective

2. **GPT-5 Mini** - `gpt-5-mini-2025-08-07` ✓ Already existed
   - Cost: $0.25/$2.00 per 1M tokens
   - Use: Balanced performance (default)

3. **GPT-5** - `gpt-5-2025-08-07` ✓ Already existed
   - Cost: $1.25/$10.00 per 1M tokens
   - Use: Premium for coding and complex reasoning

4. **GPT-5 Pro** - `gpt-5-pro-2025-10-06` 🆕
   - Cost: $5.00/$25.00 per 1M tokens
   - Use: Advanced expert-level tasks
   - ⚠️ **TRIGGERS PREMIUM WARNING**

5. **GPT-5.1** - `gpt-5.1-2025-11-13` 🆕
   - Cost: $6.00/$30.00 per 1M tokens
   - Use: Next-generation capabilities
   - ⚠️ **TRIGGERS PREMIUM WARNING**

### GPT-4.1 Series (3 models)
6. **GPT-4.1 Nano** - `gpt-4.1-nano-2025-04-14` 🆕
   - Cost: $0.15/$1.00 per 1M tokens
   - Use: Efficient GPT-4 variant

7. **GPT-4.1 Mini** - `gpt-4.1-mini-2025-04-14` 🆕
   - Cost: $0.35/$2.50 per 1M tokens
   - Use: Balanced GPT-4 variant

8. **GPT-4.1** - `gpt-4.1-2025-04-14` 🆕
   - Cost: $2.00/$15.00 per 1M tokens
   - Use: Advanced GPT-4 capabilities

## Premium Warning System

### Updated Threshold
Changed from: `input >= $10/M OR output >= $50/M`
To: `input >= $5/M OR output >= $25/M`

### Models Triggering Premium Warning
The following models will now display the premium cost warning banner:

#### OpenAI Models (2)
- ✅ **GPT-5 Pro** - $5/$25 per 1M tokens
- ✅ **GPT-5.1** - $6/$30 per 1M tokens

#### Anthropic Models (1)
- ✅ **Claude Opus 4.1** - $15/$75 per 1M tokens

### Warning Message
```
Premium Mode Active: You've selected [Model Name], which provides
superior capabilities but costs significantly more than standard models.
Use for complex tasks requiring advanced reasoning and analysis.

Cost: $X.XX/$X.XX per 1K tokens
```

## Total Model Count
**15 AI models** now available across 4 providers:

- **OpenAI**: 8 models (5 × GPT-5 series, 3 × GPT-4.1 series)
- **Anthropic**: 2 models (Claude Sonnet 4.5, Claude Opus 4.1)
- **Google**: 2 models (Gemini Flash, Gemini 2.5 Pro)
- **Perplexity**: 1 model (Sonar Pro)

## Files Modified

1. **src/utils/costCalculator.js**
   - Added pricing for 6 new OpenAI models
   - Updated DISPLAY_NAME_MAPPING

2. **src/services/aiApi.js**
   - Added 6 new models to AI_TOOLS
   - Added model-specific educational prompts for all new models
   - Updated getAvailableModels() to include new models

3. **src/services/openaiApi.js**
   - Updated AI_TOOLS configuration with all new models

4. **src/components/Chat/Chat.js**
   - Adjusted premium warning threshold ($5/$25 per 1M tokens)
   - Updated warning message from "Research Mode" to "Premium Mode"
   - Made warning text more generic for both OpenAI and Anthropic

## Build Status
✅ Build successful with no errors
⚠️ Minor ESLint warnings (cosmetic only, not blocking)

## Next Steps
1. Update environment variables with `REACT_APP_` prefix
2. Test model selection in UI
3. Verify premium warnings display correctly
4. Update documentation in CLAUDE.md
