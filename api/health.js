// Vercel Serverless Function for health check
// This file should be placed in /api/health.js

export default async function handler(req, res) {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless'
  });
}