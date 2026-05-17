# Gemini-Powered PowerPoint Generator

An agentic PowerPoint slide generator using **Google Gemini 2.5 Flash** (free tier) as the AI brain and a **dual engine** backend — `pptxgenjs` (Node.js) and `python-pptx` (Python) — so you can run it from either environment.

---

## Project Structure

```
gemini-pptx-generator/
├── README.md                   ← You are here
├── .env.example                ← API key template
├── agents/
│   ├── AGENT.md                ← Master agentic instructions
│   ├── content-agent.md        ← Gemini content generation agent
│   └── slide-builder-agent.md  ← Slide construction agent
├── engines/
│   ├── js/
│   │   ├── engine.js           ← pptxgenjs engine
│   │   ├── package.json
│   │   └── README.md
│   └── python/
│       ├── engine.py           ← python-pptx engine
│       ├── requirements.txt
│       └── README.md
├── schemas/
│   ├── slide-schema.json       ← Canonical slide data schema
│   └── prompt-schema.md        ← How to structure input prompts
├── templates/
│   ├── business.md             ← Business presentation template
│   ├── technical.md            ← Technical/dev presentation template
│   └── minimal.md              ← Minimal/clean template
├── examples/
│   ├── input-example.md        ← Example user prompt
│   └── output-example.json     ← Example Gemini JSON output
└── cli/
    ├── generate.js             ← JS CLI entry point
    └── generate.py             ← Python CLI entry point
```

---

## Quick Start

### 1. Set up your API key

```bash
cp .env.example .env
# Edit .env and paste your Gemini API key
```

Get a free key at: https://aistudio.google.com/apikey

### 2. Install dependencies

**Node.js engine:**
```bash
cd engines/js
npm install
```

**Python engine:**
```bash
cd engines/python
pip install -r requirements.txt
```

### 3. Generate a presentation

**With Node.js:**
```bash
node cli/generate.js --topic "Introduction to Machine Learning" --slides 8 --engine js
```

**With Python:**
```bash
python cli/generate.py --topic "Introduction to Machine Learning" --slides 8 --engine python
```

---

## How It Works

```
User Prompt
    │
    ▼
[Content Agent] ── Gemini 2.5 Flash ──► Structured JSON (slide data)
    │
    ▼
[Slide Builder Agent] ── selects engine ──► .pptx file
    │
    ├── JS Engine (pptxgenjs)
    └── Python Engine (python-pptx)
```

1. User provides a topic/prompt
2. Content Agent sends it to Gemini 2.5 Flash with a structured system prompt
3. Gemini returns a JSON object matching the slide schema
4. Slide Builder Agent picks JS or Python engine based on user preference
5. Engine renders the `.pptx` file

---

## Environment Variables

```env
GEMINI_API_KEY=your_key_here
DEFAULT_ENGINE=js          # js | python
DEFAULT_SLIDE_COUNT=8
OUTPUT_DIR=./output
```
