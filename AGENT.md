# AGENT.md — Master Agentic Instructions

This file instructs any AI agent (Claude, Copilot, Cursor, etc.) on how to build, run, and extend the Gemini-powered PowerPoint generator.

---

## Agent Goal

Build a working PowerPoint slide generator that:
- Accepts a natural-language topic or outline from the user
- Uses the **Gemini 2.5 Flash** model (free tier) to generate structured slide content
- Renders a `.pptx` file using either the **pptxgenjs** (JS) or **python-pptx** (Python) engine
- Outputs a downloadable `.pptx` file

---

## Step-by-Step Build Instructions

### Step 1 — Set Up Environment

1. Create a `.env` file from `.env.example`
2. Paste the user's `GEMINI_API_KEY`
3. Confirm the key works:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
   ```

### Step 2 — Implement the Content Agent

See `agents/content-agent.md` for full prompt engineering details.

- Call Gemini 2.5 Flash at:
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Pass the system prompt from `content-agent.md`
- Parse JSON from the response
- Validate against `schemas/slide-schema.json`

### Step 3 — Implement the Slide Builder

See `agents/slide-builder-agent.md`.

- Accept the JSON from Step 2
- Route to JS or Python engine based on `DEFAULT_ENGINE`
- Call the engine, get back the `.pptx` path
- Report success/failure

### Step 4 — Wire Up the CLI

- `cli/generate.js` (Node.js entry point)
- `cli/generate.py` (Python entry point)
- Both accept `--topic`, `--slides`, `--engine`, `--output`, `--template`

### Step 5 — Test

```bash
# JS
node cli/generate.js --topic "Climate Change Basics" --slides 6

# Python
python cli/generate.py --topic "Climate Change Basics" --slides 6
```

Expected: A file `output/climate-change-basics.pptx` is created.

---

## Rules for the Agent

- **Never hardcode the API key** — always read from `.env`
- **Always validate Gemini's JSON** before passing to the engine — Gemini sometimes returns markdown fences, strip them
- **Engine fallback**: if JS engine fails, automatically retry with Python engine and vice versa
- **Slide count**: default to 8 slides; minimum 3, maximum 20
- **Error handling**: if Gemini returns an error (quota exceeded, bad key), print a clear human-readable message, not a raw API error
- **Output naming**: slugify the topic for the filename (e.g., "Climate Change" → `climate-change.pptx`)

---

## Gemini Free Tier Limits (as of 2025)

| Model | RPM | TPM | RPD |
|-------|-----|-----|-----|
| gemini-2.5-flash | 10 | 250,000 | 500 |

- RPM = Requests per minute
- TPM = Tokens per minute
- RPD = Requests per day

**Agent note**: Add a 2-second delay between retries. If RPD is hit, inform the user clearly.

---

## Extending the Project

- Add a web UI → create a simple Express.js or Flask server, expose `/generate` endpoint
- Add themes → extend `templates/` with new `.md` files
- Add image support → use Gemini's image generation or pull from Unsplash API
- Add multi-language → pass `--lang` flag and instruct Gemini in the system prompt
