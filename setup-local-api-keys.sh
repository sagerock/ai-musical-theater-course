#!/bin/bash

# Setup script for local development with Vercel CLI
# This creates a .env file for Vercel CLI (NOT for React)

echo "Setting up local API keys for Vercel development..."
echo ""
echo "This script will create a .env file for use with 'vercel dev'"
echo "These keys will be used by your API routes, not exposed in client code"
echo ""

# Create .env file for Vercel CLI (server-side only)
cat > .env << 'EOF'
# Server-side API Keys for Vercel Functions
# These are NOT exposed to the client

# AI Provider Keys (get these from your providers)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key_here
EOF

echo "✅ Created .env file for Vercel CLI"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your actual API keys"
echo "2. Install Vercel CLI: npm i -g vercel"
echo "3. Run locally with: vercel dev"
echo ""
echo "IMPORTANT:"
echo "- .env is for server-side keys only (used by API routes)"
echo "- .env.local is for client-side config (Firebase, etc)"
echo "- Never put secret keys in .env.local or REACT_APP_* variables"
echo ""