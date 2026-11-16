// Shared sign-in check for the serverless API routes.
// Files starting with "_" are not exposed as routes by Vercel.
//
// Verifying a Firebase ID token only needs the project ID (the signing keys
// are public), so this works without a service-account credential.
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const APP_NAME = 'token-verifier';
const DEFAULT_PROJECT_ID = 'staging-intelligence-8c59c';

function tokenVerifier() {
  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.REACT_APP_FIREBASE_PROJECT_ID ||
    DEFAULT_PROJECT_ID
  ).trim();
  const app =
    getApps().find((a) => a.name === APP_NAME) ||
    initializeApp({ projectId }, APP_NAME);
  return getAuth(app);
}

/**
 * Returns the decoded Firebase ID token for the caller, or sends a 401 and
 * returns null. Callers must stop when null comes back.
 */
export async function requireUser(req, res) {
  const header = req.headers?.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    res.status(401).json({ error: 'Sign in required.' });
    return null;
  }
  try {
    return await tokenVerifier().verifyIdToken(match[1]);
  } catch (error) {
    console.warn('[auth] Rejected ID token:', error.code || error.message);
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    return null;
  }
}

// Bounds on what one request may ask a provider for.
const MAX_MESSAGES = 200;
const MAX_TOTAL_CHARS = 600000; // roughly 150K tokens of conversation and documents

/**
 * Validates the chat payload shared by the AI routes. Returns an error string,
 * or null when the payload is acceptable.
 */
export function validateChatPayload(body, modelPattern) {
  const { messages, model } = body || {};
  if (!messages || !Array.isArray(messages)) {
    return 'Messages array is required';
  }
  if (messages.length > MAX_MESSAGES) {
    return 'Too many messages in one request';
  }
  const totalChars = messages.reduce(
    (sum, m) => sum + (typeof m?.content === 'string' ? m.content.length : JSON.stringify(m?.content || '').length),
    0
  );
  if (totalChars > MAX_TOTAL_CHARS) {
    return 'Conversation is too long for one request';
  }
  if (model !== undefined && (typeof model !== 'string' || !modelPattern.test(model))) {
    return 'Unsupported model';
  }
  return null;
}
