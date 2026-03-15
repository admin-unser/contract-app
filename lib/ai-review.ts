/**
 * AI Contract Risk Review - Uses Claude API to analyze contract documents
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface RiskItem {
  severity: "high" | "medium" | "low";
  clause: string;
  issue: string;
  suggestion: string;
}

export interface ContractReviewResult {
  summary: string;
  overall_risk: "high" | "medium" | "low";
  risks: RiskItem[];
  missing_clauses: string[];
  positive_points: string[];
}

const SYSTEM_PROMPT = `あなたは日本の契約法に精通した法務AIアシスタントです。
電子契約書の内容を分析し、リスクを検出してください。

以下の観点で分析してください：
1. 不利な条項（一方に著しく不利な条件）
2. 曖昧な表現（紛争の原因になりうる不明確な記述）
3. 欠落条項（通常含まれるべきだが欠けている条項）
4. 期限・解約条件の問題
5. 損害賠償・責任制限の問題
6. 個人情報・機密保持の不備
7. 競業避止・知的財産権の問題

必ず以下のJSON形式で回答してください（日本語で）：
{
  "summary": "契約書全体の概要（1-2文）",
  "overall_risk": "high" | "medium" | "low",
  "risks": [
    {
      "severity": "high" | "medium" | "low",
      "clause": "該当する条項名や箇所",
      "issue": "問題点の説明",
      "suggestion": "改善提案"
    }
  ],
  "missing_clauses": ["欠落している重要条項のリスト"],
  "positive_points": ["契約書の良い点"]
}`;

export async function reviewContract(contractText: string): Promise<ContractReviewResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `以下の契約書の内容を分析し、リスクを検出してください。\n\n---\n${contractText}\n---`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[AI Review] API error:", response.status, errorBody);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error("AI returned empty response");
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON");
  }

  try {
    return JSON.parse(jsonMatch[0]) as ContractReviewResult;
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}
