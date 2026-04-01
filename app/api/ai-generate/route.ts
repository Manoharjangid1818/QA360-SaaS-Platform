// API route: POST /api/ai-generate
// Generates test cases from a requirement using OpenAI
// Uses Replit AI Integrations on Replit (no API key needed)
// Uses OPENAI_API_KEY for local development

import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import type { GeneratedTestCase } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { requirement } = await req.json();

    if (!requirement?.trim()) {
      return NextResponse.json({ error: 'Requirement text is required.' }, { status: 400 });
    }

    const openai = getOpenAIClient();

    const prompt = `You are an expert QA engineer. Given the following feature requirement, generate comprehensive test cases.

Requirement:
${requirement}

Generate test cases in three categories:
1. Positive test cases (happy path - things that should work)
2. Negative test cases (things that should fail gracefully)  
3. Edge cases (boundary conditions, unusual inputs)

Return a JSON object with the following structure:
{
  "testCases": [
    {
      "title": "Short descriptive title",
      "description": "What this test verifies",
      "steps": "1. Step one\\n2. Step two\\n3. Step three",
      "expected_result": "What should happen",
      "priority": "low|medium|high|critical",
      "type": "positive|negative|edge"
    }
  ]
}

Generate at least 3 positive, 3 negative, and 2 edge cases. Return ONLY valid JSON.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const testCases: GeneratedTestCase[] = parsed.testCases || [];

    return NextResponse.json({ testCases, count: testCases.length });
  } catch (error: unknown) {
    console.error('AI generate error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate test cases.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
