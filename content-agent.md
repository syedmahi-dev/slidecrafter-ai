# content-agent.md — Gemini Content Generation Agent

This agent is responsible for calling the Gemini 2.5 Flash API and producing structured slide content as JSON.

---

## API Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}
```

---

## System Prompt (use exactly as shown)

```
You are a professional presentation designer and content strategist.
Your job is to generate structured PowerPoint slide content in JSON format.

RULES:
- Respond ONLY with valid JSON. No markdown, no explanation, no code fences.
- Follow the exact schema provided.
- Make content concise, impactful, and professional.
- Each slide must have a clear purpose — no filler slides.
- Vary slide types: don't use the same layout for every slide.
- Title slide comes first, summary/conclusion slide comes last.
```

---

## User Prompt Template

```
Generate a {slide_count}-slide presentation on the topic: "{topic}"

Use this template style: {template_name}

Return a JSON object with this exact schema:
{
  "title": "Presentation Title",
  "theme": {
    "primaryColor": "#HEX",
    "secondaryColor": "#HEX",
    "accentColor": "#HEX",
    "fontTitle": "Font Name",
    "fontBody": "Font Name",
    "darkBackground": true | false
  },
  "slides": [
    {
      "index": 1,
      "type": "title | content | two-column | stats | timeline | quote | image-text | closing",
      "title": "Slide Title",
      "subtitle": "Optional subtitle (title slide only)",
      "bullets": ["Point 1", "Point 2"],
      "leftContent": "Left column text (two-column only)",
      "rightContent": "Right column text (two-column only)",
      "stats": [
        { "value": "93%", "label": "Stat label" }
      ],
      "quote": "Quote text (quote slides only)",
      "quoteAuthor": "Author Name",
      "notes": "Speaker notes for this slide"
    }
  ]
}

Only include fields relevant to the slide type. Omit unused fields entirely.
```

---

## JavaScript Implementation

```javascript
// agents/content-agent.js
const fetch = require('node-fetch'); // or native fetch (Node 18+)
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are a professional presentation designer and content strategist.
Your job is to generate structured PowerPoint slide content in JSON format.

RULES:
- Respond ONLY with valid JSON. No markdown, no explanation, no code fences.
- Follow the exact schema provided.
- Make content concise, impactful, and professional.
- Each slide must have a clear purpose — no filler slides.
- Vary slide types: don't use the same layout for every slide.
- Title slide comes first, summary/conclusion slide comes last.`;

async function generateSlideContent({ topic, slideCount = 8, template = 'business' }) {
  const userPrompt = `Generate a ${slideCount}-slide presentation on the topic: "${topic}"
Use this template style: ${template}

Return a JSON object with this exact schema:
{
  "title": "Presentation Title",
  "theme": {
    "primaryColor": "#HEX",
    "secondaryColor": "#HEX",
    "accentColor": "#HEX",
    "fontTitle": "Font Name",
    "fontBody": "Font Name",
    "darkBackground": false
  },
  "slides": [
    {
      "index": 1,
      "type": "title",
      "title": "Slide Title",
      "subtitle": "Subtitle here",
      "notes": "Speaker notes"
    }
  ]
}

Only include fields relevant to each slide type. Omit unused fields entirely.`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json'
    }
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Gemini API error: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) throw new Error('Gemini returned empty content');

  // Strip markdown fences if present (safety net)
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  return JSON.parse(cleaned);
}

module.exports = { generateSlideContent };
```

---

## Python Implementation

```python
# agents/content_agent.py
import os
import json
import re
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

SYSTEM_PROMPT = """You are a professional presentation designer and content strategist.
Your job is to generate structured PowerPoint slide content in JSON format.

RULES:
- Respond ONLY with valid JSON. No markdown, no explanation, no code fences.
- Follow the exact schema provided.
- Make content concise, impactful, and professional.
- Each slide must have a clear purpose — no filler slides.
- Vary slide types: don't use the same layout for every slide.
- Title slide comes first, summary/conclusion slide comes last."""


def generate_slide_content(topic: str, slide_count: int = 8, template: str = "business") -> dict:
    user_prompt = f"""Generate a {slide_count}-slide presentation on the topic: "{topic}"
Use this template style: {template}

Return a JSON object matching the slide schema. 
Slide types: title, content, two-column, stats, timeline, quote, image-text, closing.
Include title, theme (primaryColor, secondaryColor, accentColor, fontTitle, fontBody, darkBackground), and slides array.
Only include fields relevant to each slide type."""

    body = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": user_prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json"
        }
    }

    response = requests.post(GEMINI_URL, json=body)
    response.raise_for_status()

    data = response.json()
    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]

    # Strip markdown fences if present
    cleaned = re.sub(r'^```json\s*', '', raw_text, flags=re.IGNORECASE)
    cleaned = re.sub(r'```\s*$', '', cleaned).strip()

    return json.loads(cleaned)
```

---

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `API_KEY_INVALID` | Wrong or missing key | Check `.env` |
| `RESOURCE_EXHAUSTED` | Free tier quota hit | Wait or check daily limit |
| `JSON parse failed` | Gemini returned non-JSON | Check system prompt, retry |
| `Empty content` | Model refused or timed out | Retry with simpler topic |
