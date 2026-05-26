import { Router } from "express";
import type { GeneratedTestCase } from "../types/qa360.js";

const router = Router();

router.post("/ai-generate", async (req, res) => {
  const { requirement, count } = req.body as {
    requirement?: string;
    count?: number;
  };

  if (!requirement?.trim()) {
    res.status(400).json({ error: "Requirement text is required." });
    return;
  }

  const apiKey =
    process.env["OPENAI_API_KEY2"] ??
    process.env["API_KEY1"] ??
    process.env["OPENAI_API_KEY"];

  if (!apiKey) {
    res.status(503).json({
      error: "OpenAI API key not configured. Add API_KEY1 to your Secrets.",
    });
    return;  
  }

  const total = Math.max(1, Math.min(50, Number(count) || 10));
  const positiveCount = Math.max(1, Math.round(total * 0.4));
  const negativeCount = Math.max(1, Math.round(total * 0.4));
  const edgeCount = Math.max(1, total - positiveCount - negativeCount);

  const prompt = `You are an expert QA engineer. Given the following feature requirement, generate exactly ${total} test cases.

Requirement:
${requirement}

Generate the test cases distributed across these three categories:
- Positive test cases (happy path): exactly ${positiveCount}
- Negative test cases (things that should fail gracefully): exactly ${negativeCount}
- Edge cases (boundary conditions, unusual inputs): exactly ${edgeCount}

Return a JSON object:
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

You MUST return exactly ${total} test cases total (${positiveCount} positive, ${negativeCount} negative, ${edgeCount} edge). Return ONLY valid JSON.`;

  try {
    const maxTokens = Math.min(8000, 300 + total * 180);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } }).error?.message ||
          `OpenAI error ${response.status}`,
      );
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = data.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { testCases?: GeneratedTestCase[] };
    const testCases: GeneratedTestCase[] = parsed.testCases ?? [];

    res.json({ testCases, count: testCases.length });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate test cases.";
    res.status(500).json({ error: message });
  }
});

export default router;
