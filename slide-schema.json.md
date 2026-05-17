# Slide Schema Reference

This is the canonical schema for slide data passed between the content agent and slide builder engines.

## Top-Level Object

```json
{
  "title": "Presentation Title",
  "theme": { ... },
  "slides": [ ... ]
}
```

## Theme Object

```json
{
  "primaryColor": "#1E2761",
  "secondaryColor": "#CADCFC",
  "accentColor": "#FFFFFF",
  "fontTitle": "Calibri",
  "fontBody": "Calibri",
  "darkBackground": false
}
```

All fields optional — engines fall back to defaults if missing.

## Slide Object Fields

| Field | Type | Required | Used By |
|-------|------|----------|---------|
| `index` | number | yes | all |
| `type` | string | yes | all |
| `title` | string | yes | all |
| `subtitle` | string | no | title, closing |
| `bullets` | string[] | no | content |
| `leftContent` | string | no | two-column |
| `rightContent` | string | no | two-column |
| `stats` | Stat[] | no | stats |
| `quote` | string | no | quote |
| `quoteAuthor` | string | no | quote |
| `notes` | string | no | all (speaker notes) |

## Stat Object

```json
{ "value": "93%", "label": "Customer satisfaction" }
```

## Slide Types

| Type | Description |
|------|-------------|
| `title` | Opening slide — large title + subtitle |
| `content` | Standard slide — title + bullet points |
| `two-column` | Side-by-side text columns |
| `stats` | 2–4 large stat numbers with labels |
| `timeline` | Numbered steps (rendered as content in v1) |
| `quote` | Large centered quote with attribution |
| `image-text` | Image placeholder + text (rendered as two-column in v1) |
| `closing` | Final slide — like title but with CTA or summary |
