// OpenAI client — uses Replit AI Integrations on Replit (no API key needed)
// Falls back to OPENAI_API_KEY for local VS Code development

import OpenAI from 'openai';

// On Replit: AI_INTEGRATIONS_OPENAI_API_KEY + AI_INTEGRATIONS_OPENAI_BASE_URL are set automatically
// Locally: set OPENAI_API_KEY in .env.local
export function getOpenAIClient(): OpenAI {
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    'missing-key';

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined;

  return new OpenAI({ apiKey, baseURL });
}
