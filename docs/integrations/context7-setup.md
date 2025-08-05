# Context 7 MCP Server Setup

## Overview
Context 7 is an MCP (Model Context Protocol) server that provides up-to-date documentation for your codebase's libraries and frameworks.

## Installation & Configuration

### For Claude Code
```bash
# Install Context 7 MCP server
npx -y @upstash/context7-mcp
```

### MCP Configuration
Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

## Key Libraries in This Project

Based on `package.json`, the following libraries would benefit from Context 7 documentation:

### Core Technologies
- **React 18** - UI framework with hooks and context
- **Firebase 12** - Authentication, Firestore, and Storage
- **React Router DOM 6** - Client-side routing
- **Tailwind CSS 3** - Utility-first CSS framework

### AI Integration APIs
- **OpenAI 4.24** - GPT-4 chat completions
- **Anthropic SDK 0.56** - Claude API integration
- **Google Generative AI 0.24** - Gemini API integration

### UI Components
- **Headless UI** - Unstyled, accessible components
- **Heroicons** - SVG icon library
- **React Hot Toast** - Notification system

### Utilities
- **date-fns** - Date manipulation library
- **PDF.js** - PDF processing
- **UUID** - Unique identifier generation

## Usage with Context 7

Once configured, you can use Context 7 in your prompts:
```
use context7 to get React hooks documentation
use context7 to get Firebase Firestore query examples  
use context7 to get Tailwind CSS responsive design patterns
```

## Benefits for This Project

1. **Up-to-date Documentation** - Always get the latest docs for your exact library versions
2. **Version-specific Examples** - Code examples that match your package.json versions
3. **Contextual Information** - Documentation injected directly into AI conversations
4. **Reduced Context Switching** - No need to browse external documentation sites