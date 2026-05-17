// engines/js/engine.js
// pptxgenjs PowerPoint engine

const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

/**
 * Build a .pptx file from structured slide JSON
 * @param {Object} options
 * @param {Object} options.slideData - Parsed JSON from content agent
 * @param {string} options.outputDir - Directory to write .pptx to
 * @param {string} options.filename - Output filename (without .pptx)
 * @returns {Promise<string>} - Absolute path to the generated file
 */
async function buildPresentation({ slideData, outputDir = './output', filename = 'presentation' }) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const pptx = new PptxGenJS();
  const theme = slideData.theme || {};

  const PRIMARY = theme.primaryColor || '1E2761';
  const SECONDARY = theme.secondaryColor || 'CADCFC';
  const ACCENT = theme.accentColor || 'FFFFFF';
  const FONT_TITLE = theme.fontTitle || 'Calibri';
  const FONT_BODY = theme.fontBody || 'Calibri';

  pptx.layout = 'LAYOUT_WIDE'; // 16:9

  for (const slide of slideData.slides) {
    const s = pptx.addSlide();
    const isDark = slide.type === 'title' || slide.type === 'closing' || theme.darkBackground;

    const bgColor = isDark ? PRIMARY : 'FFFFFF';
    const titleColor = isDark ? ACCENT : PRIMARY;
    const bodyColor = isDark ? SECONDARY : '333333';

    s.background = { color: bgColor };

    switch (slide.type) {
      case 'title':
        buildTitleSlide(s, slide, { titleColor, bodyColor, FONT_TITLE, FONT_BODY });
        break;
      case 'content':
        buildContentSlide(s, slide, { titleColor, bodyColor, PRIMARY, FONT_TITLE, FONT_BODY });
        break;
      case 'two-column':
        buildTwoColumnSlide(s, slide, { titleColor, bodyColor, PRIMARY, SECONDARY, FONT_TITLE, FONT_BODY });
        break;
      case 'stats':
        buildStatsSlide(s, slide, { titleColor, bodyColor, PRIMARY, ACCENT, SECONDARY, FONT_TITLE, FONT_BODY });
        break;
      case 'quote':
        buildQuoteSlide(s, slide, { titleColor, bodyColor, PRIMARY, SECONDARY, FONT_TITLE, FONT_BODY, bgColor });
        break;
      case 'closing':
        buildClosingSlide(s, slide, { titleColor, bodyColor, FONT_TITLE, FONT_BODY });
        break;
      default:
        buildContentSlide(s, slide, { titleColor, bodyColor, PRIMARY, FONT_TITLE, FONT_BODY });
    }

    if (slide.notes) {
      s.addNotes(slide.notes);
    }
  }

  const outPath = path.resolve(outputDir, `${filename}.pptx`);
  await pptx.writeFile({ fileName: outPath });
  return outPath;
}

// ──────────────────────────────────────────────
// Slide type builders
// ──────────────────────────────────────────────

function buildTitleSlide(s, slide, { titleColor, bodyColor, FONT_TITLE, FONT_BODY }) {
  s.addText(slide.title, {
    x: 0.5, y: 2.5, w: 9, h: 1.5,
    fontSize: 44, bold: true, color: titleColor,
    fontFace: FONT_TITLE, align: 'center', valign: 'middle'
  });
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.5, y: 4.2, w: 9, h: 0.8,
      fontSize: 20, color: bodyColor,
      fontFace: FONT_BODY, align: 'center'
    });
  }
}

function buildContentSlide(s, slide, { titleColor, bodyColor, PRIMARY, FONT_TITLE, FONT_BODY }) {
  s.addText(slide.title, {
    x: 0.5, y: 0.3, w: 9, h: 0.9,
    fontSize: 36, bold: true, color: titleColor, fontFace: FONT_TITLE
  });
  // Accent bar under title
  s.addShape(pptxShape('rect'), { x: 0.5, y: 1.25, w: 1.2, h: 0.07, fill: { color: PRIMARY } });

  if (slide.bullets?.length) {
    const bulletItems = slide.bullets.map(b => ({ text: b, options: { bullet: true } }));
    s.addText(bulletItems, {
      x: 0.5, y: 1.5, w: 9, h: 5,
      fontSize: 16, color: bodyColor, fontFace: FONT_BODY,
      valign: 'top', paraSpaceBefore: 8
    });
  }
}

function buildTwoColumnSlide(s, slide, { titleColor, bodyColor, PRIMARY, SECONDARY, FONT_TITLE, FONT_BODY }) {
  s.addText(slide.title, {
    x: 0.5, y: 0.3, w: 9, h: 0.9,
    fontSize: 32, bold: true, color: titleColor, fontFace: FONT_TITLE
  });

  // Left column box
  s.addShape(pptxShape('rect'), { x: 0.4, y: 1.4, w: 4.3, h: 4.8, fill: { color: SECONDARY }, line: { color: SECONDARY } });
  s.addText(slide.leftContent || '', {
    x: 0.55, y: 1.55, w: 4.0, h: 4.5,
    fontSize: 15, color: '222222', fontFace: FONT_BODY, valign: 'top', wrap: true
  });

  // Right column box
  s.addShape(pptxShape('rect'), { x: 5.1, y: 1.4, w: 4.3, h: 4.8, fill: { color: 'F5F5F5' }, line: { color: 'E0E0E0' } });
  s.addText(slide.rightContent || '', {
    x: 5.25, y: 1.55, w: 4.0, h: 4.5,
    fontSize: 15, color: '222222', fontFace: FONT_BODY, valign: 'top', wrap: true
  });
}

function buildStatsSlide(s, slide, { titleColor, bodyColor, PRIMARY, ACCENT, SECONDARY, FONT_TITLE, FONT_BODY }) {
  s.addText(slide.title, {
    x: 0.5, y: 0.3, w: 9, h: 0.9,
    fontSize: 32, bold: true, color: titleColor, fontFace: FONT_TITLE
  });

  const stats = slide.stats || [];
  const count = Math.min(stats.length, 4);
  const boxW = 9.0 / count;

  stats.slice(0, count).forEach((stat, i) => {
    const xPos = 0.5 + i * boxW;
    s.addShape(pptxShape('rect'), {
      x: xPos, y: 1.8, w: boxW - 0.2, h: 3.5,
      fill: { color: i % 2 === 0 ? PRIMARY : SECONDARY },
      line: { color: 'FFFFFF', width: 2 }
    });
    s.addText(stat.value || '', {
      x: xPos, y: 2.3, w: boxW - 0.2, h: 1.5,
      fontSize: 52, bold: true,
      color: i % 2 === 0 ? ACCENT : PRIMARY,
      fontFace: FONT_TITLE, align: 'center'
    });
    s.addText(stat.label || '', {
      x: xPos, y: 4.0, w: boxW - 0.2, h: 0.8,
      fontSize: 14, color: i % 2 === 0 ? 'FFFFFF' : '333333',
      fontFace: FONT_BODY, align: 'center', wrap: true
    });
  });
}

function buildQuoteSlide(s, slide, { titleColor, bodyColor, PRIMARY, SECONDARY, FONT_TITLE, FONT_BODY, bgColor }) {
  // Large opening quote mark
  s.addText('\u201C', {
    x: 0.3, y: 0.8, w: 1.5, h: 1.5,
    fontSize: 120, color: PRIMARY, fontFace: FONT_TITLE, opacity: 30
  });
  s.addText(slide.quote || '', {
    x: 0.8, y: 1.5, w: 8.5, h: 3.5,
    fontSize: 24, italic: true, color: titleColor,
    fontFace: FONT_TITLE, align: 'center', valign: 'middle', wrap: true
  });
  if (slide.quoteAuthor) {
    s.addText(`— ${slide.quoteAuthor}`, {
      x: 0.8, y: 5.2, w: 8.5, h: 0.5,
      fontSize: 14, color: bodyColor, fontFace: FONT_BODY, align: 'center'
    });
  }
}

function buildClosingSlide(s, slide, { titleColor, bodyColor, FONT_TITLE, FONT_BODY }) {
  s.addText(slide.title, {
    x: 0.5, y: 2.3, w: 9, h: 1.5,
    fontSize: 40, bold: true, color: titleColor,
    fontFace: FONT_TITLE, align: 'center', valign: 'middle'
  });
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.5, y: 4.0, w: 9, h: 0.8,
      fontSize: 18, color: bodyColor, fontFace: FONT_BODY, align: 'center'
    });
  }
}

// Helper: pptxgenjs shape type
function pptxShape(type) {
  const shapes = { rect: 'rect', circle: 'ellipse', line: 'line' };
  return shapes[type] || 'rect';
}

module.exports = { buildPresentation };
