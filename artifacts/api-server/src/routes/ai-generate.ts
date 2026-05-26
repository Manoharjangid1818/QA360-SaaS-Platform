import { Router } from "express";
import type { GeneratedTestCase } from "../types/qa360.js";

const router = Router();

router.post("/ai-generate", async (req, res) => {
  const { requirement } = req.body as { requirement?: string };

  if (!requirement?.trim()) {
    res.status(400).json({ error: "Requirement text is required." });
    return;
  }

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    res.status(503).json({
      error:
        "OpenAI API key not configured. Add OPENAI_API_KEY to your Secrets.",
    });
    return;
  }

  const prompt = `You are an expert QA engineer. Given the following feature requirement, generate comprehensive test cases.

Requirement:
${requirement}

Generate test cases in three categories:
1. Positive test cases (happy path)
2. Negative test cases (things that should fail gracefully)
3. Edge cases (boundary conditions, unusual inputs)

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

Generate at least 3 positive, 3 negative, and 2 edge cases. Return ONLY valid JSON.`;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 2000,
        }),
      },
    );

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
