# slide-builder-agent.md — Slide Builder Agent

This agent takes the structured JSON from the content agent and builds the actual `.pptx` file using the selected engine.

---

## Responsibilities

1. Receive slide JSON from content agent
2. Validate the JSON against `schemas/slide-schema.json`
3. Select engine: `js` (pptxgenjs) or `python` (python-pptx)
4. Call the engine with the JSON
5. Return the output `.pptx` file path

---

## Engine Selection Logic

```
if --engine flag is set → use that engine
else → use DEFAULT_ENGINE from .env
else → default to 'js'

if selected engine fails → log warning → retry with other engine
```

---

## Slide Type → Layout Mapping

| Slide Type | Layout Strategy |
|------------|-----------------|
| `title` | Full-bleed background, large centered title + subtitle |
| `content` | Title top, bullet points below (left-aligned) |
| `two-column` | Title top, two equal columns below |
| `stats` | Title top, large stat numbers in a row (2–4 stats) |
| `timeline` | Title top, numbered horizontal or vertical steps |
| `quote` | Centered large quote text, author below |
| `image-text` | Left: image placeholder, Right: text/bullets |
| `closing` | Similar to title — dark background, CTA or summary text |

---

## JS Engine Call

```javascript
const { buildPresentation } = require('../engines/js/engine');

const outputPath = await buildPresentation({
  slideData: parsedJSON,       // from content agent
  outputDir: './output',
  filename: 'my-presentation'  // without .pptx
});
```

## Python Engine Call

```python
from engines.python.engine import build_presentation

output_path = build_presentation(
    slide_data=parsed_json,
    output_dir="./output",
    filename="my-presentation"
)
```

---

## Validation Before Build

Always validate slide_data before passing to engine:

```javascript
function validateSlideData(data) {
  if (!data.title) throw new Error('Missing presentation title');
  if (!Array.isArray(data.slides)) throw new Error('slides must be an array');
  if (data.slides.length === 0) throw new Error('No slides found');
  for (const slide of data.slides) {
    if (!slide.type) throw new Error(`Slide ${slide.index} missing type`);
    if (!slide.title) throw new Error(`Slide ${slide.index} missing title`);
  }
  return true;
}
```
