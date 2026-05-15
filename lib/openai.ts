// OpenAI client — works on Vercel, Railway, and local development.
//
// API Key Priority:
//   1. OPENAI_API_KEY (environment variable)
//      - Local dev: set in .env.local
//      - Production: set in Vercel/Railway environment variables
//      - Get key from: https://platform.openai.com/api-keys
//
// Uses standard OpenAI endpoint: https://api.openai.com/v1

import OpenAI from 'openai';

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY || 'missing-key';
  return new OpenAI({ apiKey });
}
