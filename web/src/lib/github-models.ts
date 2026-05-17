import { SYSTEM_PROMPT } from './gemini';

// Available models via GitHub Models API (included with GitHub Copilot)
// Full catalog: GET https://models.github.ai/catalog/models
// NOTE: Anthropic/Claude models are NOT available on GitHub Models.
export const GITHUB_MODELS = [
  // OpenAI — Best for JSON generation
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', description: 'Latest & best quality' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', description: 'Fast & smart' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Multimodal flagship' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Budget friendly' },
  { id: 'openai/o4-mini', name: 'o4 Mini', provider: 'OpenAI', description: 'Latest reasoning' },
  { id: 'openai/o3-mini', name: 'o3 Mini', provider: 'OpenAI', description: 'Reasoning model' },
  // Meta
  { id: 'meta/llama-4-maverick-17b-128e-instruct-fp8', name: 'Llama 4 Maverick', provider: 'Meta', description: 'Best open-source' },
  { id: 'meta/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'Meta', description: '10M context window' },
  // xAI
  { id: 'xai/grok-3', name: 'Grok 3', provider: 'xAI', description: 'Supermassive scale' },
  { id: 'xai/grok-3-mini', name: 'Grok 3 Mini', provider: 'xAI', description: 'Fast reasoning' },
  // DeepSeek
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', description: 'Deep reasoning' },
  // Mistral
  { id: 'mistral-ai/mistral-medium-2505', name: 'Mistral Medium 3', provider: 'Mistral', description: 'Vision + reasoning' },
] as const;

export type GitHubModelId = typeof GITHUB_MODELS[number]['id'];

export async function generateSlideContentGitHub(
  token: string,
  topic: string,
  slideCount: number = 8,
  model: GitHubModelId = 'openai/gpt-4.1-mini'
) {
  const API_URL = 'https://models.github.ai/inference/chat/completions';

  const userPrompt = `Generate a ${slideCount}-slide presentation on the topic: "${topic}"

Apply the NARRATIVE ARC and SLIDE TYPE INTELLIGENCE from the system prompt.
Determine the deck type from the topic (pitch/research/product/corporate/investor) and follow its arc.

Return ONLY a valid JSON object — no markdown, no explanation — with this exact schema:
{
  "title": "Deck Title — Active, specific, never generic",
  "theme": {
    "primaryColor": "#HEX — topic-appropriate, never pure black",
    "secondaryColor": "#HEX — complements primary",
    "accentColor": "#HEX — high contrast, vibrant",
    "fontTitle": "System font name matching topic personality",
    "fontBody": "System font name",
    "darkBackground": true
  },
  "slides": [
    {
      "index": 1,
      "type": "title",
      "title": "Active claim, not a label",
      "subtitle": "One compelling sentence that makes them lean forward",
      "eyebrow": "Optional small label above title (e.g. CONFIDENTIAL · Q2 2025)",
      "imageKeywords": "2-3 English keywords for background photo",
      "notes": "Speaker notes"
    }
  ]
}

SLIDE FIELD REQUIREMENTS BY TYPE:

"title":
  { "title", "subtitle", "eyebrow"(optional), "imageKeywords" }

"closing":
  { "title", "subtitle", "imageKeywords" }

"content":
  { "title", "imageKeywords", "bullets": ["string max 12 words", ...] }
  — 3 to 5 bullets. Each must be a standalone insight, not filler.

"stats":
  { "title", "imageKeywords", "stats": [{ "value": "$4.7B", "label": "Total Addressable Market", "context": "CAGR 18% · IDC 2024" }] }
  — 2 to 4 stats. Real specific numbers only. Include source/unit in context.

"chart":
  { "title", "imageKeywords", "chartType": "bar|doughnut", "chartInsight": "What the chart PROVES in one sentence",
    "chartData": [{ "label": "string", "value": number }] }
  — 4 to 7 data points. Realistically varied, not linear.

"quote":
  { "quote": "Specific claim, not vague endorsement", "quoteAuthor": "Full Name, Title, Organization", "imageKeywords" }

"image-text":
  { "title", "imageKeywords", "imagePrompt": "Highly detailed scene for AI image generation", "content": "string" }

"two-column":
  { "title", "imageKeywords", "leftContent": "plain text paragraph", "rightContent": "plain text paragraph" }
  — ONLY use if content is genuinely comparative.

HARD RULES:
- Slide titles = active opinionated claims, never labels ("Market Overview" is REJECTED)
- No bullet exceeds 12 words
- No two consecutive slides may share the same type
- "title" is index 1 only. "closing" is the last slide only.
- All values = plain strings. No nested objects where strings are expected.
- imageKeywords on EVERY slide — specific to that slide's content, not the deck topic.`;

  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.85,
    max_tokens: 16384,
    response_format: { type: 'json_object' },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || err.message || res.statusText;
    if (res.status === 401) {
      throw new Error('Invalid GitHub token. Generate one at github.com/settings/tokens');
    }
    throw new Error(`GitHub Models API error: ${msg}`);
  }

  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content;

  if (!rawText) throw new Error('GitHub Models returned empty content');

  // Strip markdown fences if present
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  return JSON.parse(cleaned);
}
