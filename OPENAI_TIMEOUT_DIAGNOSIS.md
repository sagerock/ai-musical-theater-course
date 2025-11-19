# OpenAI Timeout Issues - Diagnosis

## Current Problems Identified

### 1. **No Timeout Configuration in Vercel Function**
- `api/openai.js` has NO timeout set
- Vercel free tier: **10 second** timeout (default)
- Vercel Pro tier: **60 second** timeout (configurable up to 900s)
- OpenAI API calls can take 15-60+ seconds for GPT-5 models

### 2. **No Timeout in OpenAI SDK Call**
The OpenAI client initialization has no timeout:
```javascript
const openai = new OpenAI({
  apiKey: apiKey,
  // Missing: timeout configuration
});
```

### 3. **Client-Side Timeout Too Aggressive**
In `aiProxyService.js`:
- GPT-4/GPT-5 models: 45 second timeout
- But if Vercel timeout is 10s, the function dies before client timeout

### 4. **Model-Specific Performance**
GPT-5 models are **slower** than GPT-4:
- GPT-5 Nano: ~5-15 seconds
- GPT-5 Mini: ~10-20 seconds  
- GPT-5: ~15-30 seconds
- GPT-5 Pro: ~20-40 seconds
- GPT-5.1: ~25-50 seconds

## Why This Happens

### Vercel Timeout Chain
```
User Request → Vercel Function (10s limit) → OpenAI API (15-60s response)
                        ↓ TIMEOUT!
```

If OpenAI takes > 10 seconds, Vercel kills the function.

## Solutions

### Option 1: Increase Vercel Timeout (Recommended)
Add `vercel.json` configuration:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  }
}
```

**Requirements:**
- Vercel Pro plan (paid)
- Up to 60s for Hobby/Pro, 900s for Enterprise

### Option 2: Add Timeout to OpenAI SDK
```javascript
const openai = new OpenAI({
  apiKey: apiKey,
  timeout: 50000, // 50 seconds
  maxRetries: 2
});
```

### Option 3: Stream Responses (Better UX)
- Streaming keeps connection alive
- Returns data incrementally
- User sees progress, not timeout

### Option 4: Use Faster Models
- Default to GPT-5 Mini instead of GPT-5
- Use GPT-5 Nano for quick tasks
- Reserve GPT-5 Pro/5.1 for critical tasks only

## Immediate Actions

1. ✅ Check your Vercel plan (free vs pro)
2. ✅ Add timeout config to OpenAI SDK
3. ✅ Add detailed error logging
4. ✅ Consider enabling streaming by default
5. ✅ Add vercel.json if on Pro plan

## Testing Strategy

Test with increasing complexity:
1. Simple prompt (should be fast)
2. Medium prompt with conversation history
3. Complex prompt with long context
4. Large document analysis

Monitor:
- Response times
- Timeout frequency
- Which models timeout most
