// OpenAI client — works on Replit, Vercel, Railway, and local development.
//
// Priority order for credentials:
//   1. AI_INTEGRATIONS_OPENAI_API_KEY  — injected automatically by Replit AI
//                                        integration (no key needed on Replit)
//   2. OPENAI_API_KEY                  — set this in .env.local for local dev,
//                                        or in Vercel/Railway environment vars
//                                        for production deployments
//
// The base URL is only overridden on Replit (AI_INTEGRATIONS_OPENAI_BASE_URL).
// On all other platforms the standard https://api.openai.com/v1 is used.

import OpenAI from 'openai';

export function getOpenAIClient(): OpenAI {
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    'missing-key';

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined;

  return new OpenAI({ apiKey, baseURL });
}
