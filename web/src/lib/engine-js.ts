import pptxgen from 'pptxgenjs';

// ──────────────────────────────────────────────
// Deep text extraction
// ──────────────────────────────────────────────
function deepExtractText(val: any): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);

  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        const icon = item.icon ? `${item.icon} ` : '';
        const text = item.text || item.content || item.label || item.value || '';
        if (text) return `${icon}${deepExtractText(text)}`;
        if (item.title) return deepExtractText(item.title);
        return deepExtractText(Object.values(item).join(' '));
      }
      return String(item);
    }).filter(Boolean).join('\n');
  }

  if (typeof val === 'object') {
    if (val.text) return deepExtractText(val.text);
    if (val.content) return deepExtractText(val.content);
    const parts: string[] = [];
    if (val.title) parts.push(deepExtractText(val.title));
    if (val.subtitle) parts.push(deepExtractText(val.subtitle));
    if (Array.isArray(val.bullets)) parts.push(deepExtractText(val.bullets));
    if (Array.isArray(val.points)) parts.push(deepExtractText(val.points));
    if (val.description) parts.push(deepExtractText(val.description));
    if (parts.length > 0) return parts.join('\n');
    const allVals = Object.values(val).map(v => deepExtractText(v)).filter(Boolean);
    return allVals.join(' ');
  }
  return String(val);
}

const t = (val: any, opts: Record<string, any> = {}): Array<{ text: string; options: Record<string, any> }> => {
  return [{ text: deepExtractText(val), options: opts }];
};

function safeStr(val: any): string { return deepExtractText(val); }

// ──────────────────────────────────────────────
// Color utilities
// ──────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return [lr, lg, lb].map(c => c.toString(16).padStart(2, '0')).join('');
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return [dr, dg, db].map(c => c.toString(16).padStart(2, '0')).join('');
}

// ──────────────────────────────────────────────
// Image URL builder — direct URLs for pptxgenjs
// ──────────────────────────────────────────────
function buildImageUrl(slide: any): string {
  if (slide.imagePrompt) {
    return `https://gen.pollinations.ai/image/${encodeURIComponent(safeStr(slide.imagePrompt))}?width=1280&height=720&nologo=true`;
  } else if (slide.imageKeywords) {
    const kw = safeStr(slide.imageKeywords).split(',').map((k: string) => k.trim()).join(', ');
    return `https://gen.pollinations.ai/image/${encodeURIComponent(`Professional cinematic stock photo of ${kw}, ultra HD, bokeh background, studio lighting`)}?width=1280&height=720&nologo=true`;
  }
  return '';
}

// ──────────────────────────────────────────────
// Main build function
// ──────────────────────────────────────────────
export async function buildPresentationBrowser(slideData: any, filename: string = 'presentation') {
  const pptx = new pptxgen();
  const theme = slideData.theme || {};

  const PRIMARY = (theme.primaryColor || '#1B2A4A').replace('#', '');
  const SECONDARY = (theme.secondaryColor || '#64748B').replace('#', '');
  const ACCENT = (theme.accentColor || '#F59E0B').replace('#', '');
  const FONT_TITLE = theme.fontTitle || 'Montserrat';
  const FONT_BODY = theme.fontBody || 'Open Sans';
  const totalSlides = slideData.slides?.length || 0;

  const PRIMARY_LIGHT = lighten(PRIMARY, 0.15);
  const PRIMARY_DARK = darken(PRIMARY, 0.2);
  const ACCENT_LIGHT = lighten(ACCENT, 0.85);
  const SECONDARY_LIGHT = lighten(SECONDARY, 0.88);

  pptx.layout = 'LAYOUT_WIDE';

  if (!Array.isArray(slideData.slides)) {
    throw new Error('Invalid slide data: "slides" is not an array.');
  }

  for (let i = 0; i < slideData.slides.length; i++) {
    const slide = slideData.slides[i];
    slide.index = slide.index || i + 1;
    const s = pptx.addSlide();

    // Build image URL for this slide
    const imgUrl = buildImageUrl(slide);

    const ctx = {
      PRIMARY, SECONDARY, ACCENT, FONT_TITLE, FONT_BODY,
      PRIMARY_LIGHT, PRIMARY_DARK, ACCENT_LIGHT, SECONDARY_LIGHT,
      slideNum: i + 1, totalSlides,
      imgUrl, // direct URL for pptxgenjs to fetch
    };

    switch (slide.type) {
      case 'title': buildTitleSlide(s, slide, ctx); break;
      case 'content': buildContentSlide(s, slide, ctx); break;
      case 'two-column': buildTwoColumnSlide(s, slide, ctx); break;
      case 'stats': buildStatsSlide(s, slide, ctx); break;
      case 'quote': buildQuoteSlide(s, slide, ctx); break;
      case 'chart': buildChartSlide(s, slide, ctx); break;
      case 'image-text': buildImageTextSlide(s, slide, ctx); break;
      case 'closing': buildClosingSlide(s, slide, ctx); break;
      default: buildContentSlide(s, slide, ctx);
    }

    if (slide.notes) {
      s.addNotes(typeof slide.notes === 'string' ? slide.notes : JSON.stringify(slide.notes));
    }
  }

  await pptx.writeFile({ fileName: `${filename}.pptx` });
}

// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────

function addSlideNumber(s: any, ctx: any, light: boolean = false) {
  const color = light ? 'FFFFFF' : ctx.PRIMARY;
  s.addText(t(`${String(ctx.slideNum).padStart(2, '0')}  /  ${String(ctx.totalSlides).padStart(2, '0')}`), {
    x: 11.0, y: 7.0, w: 2.0, h: 0.4,
    fontSize: 9, fontFace: ctx.FONT_BODY, color, align: 'right',
    bold: true, transparency: 45,
  });
}

function addDecorativeCircle(s: any, x: number, y: number, size: number, color: string, opacity: number) {
  s.addShape('ellipse', { x, y, w: size, h: size, fill: { color }, line: { color, width: 0 }, transparency: opacity });
}

function addAccentBar(s: any, x: number, y: number, h: number, color: string) {
  s.addShape('rect', { x, y, w: 0.07, h, fill: { color } });
}

// Shadow-depth card (3-layer visual stack)
function addCard(s: any, x: number, y: number, w: number, h: number, fillColor: string, radius: number = 0.18) {
  // Shadow layer
  s.addShape('roundRect', { x: x + 0.04, y: y + 0.06, w, h, fill: { color: '000000' }, rectRadius: radius, transparency: 88 });
  // Main card
  s.addShape('roundRect', { x, y, w, h, fill: { color: fillColor }, rectRadius: radius });
}

// Dot-grid texture for depth
function addDotGrid(s: any, x: number, y: number, w: number, h: number, color: string) {
  const spacing = 0.42;
  const cols = Math.floor(w / spacing);
  const rows = Math.floor(h / spacing);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      s.addShape('ellipse', { x: x + c * spacing, y: y + r * spacing, w: 0.04, h: 0.04, fill: { color }, transparency: 82 });
    }
  }
}

// Consistent branding bottom bar
function addBrandingBar(s: any, ctx: any) {
  s.addShape('rect', { x: 0, y: 7.15, w: 13.33, h: 0.35, fill: { color: ctx.ACCENT } });
}

// Colored header band across top of light slides
function addHeaderBand(s: any, ctx: any, h: number = 1.1) {
  s.addShape('rect', { x: 0, y: 0, w: 13.33, h, fill: { color: ctx.PRIMARY } });
}

// Background image with overlay
function applyBgImage(s: any, ctx: any, overlayOpacity: number = 40) {
  if (ctx.imgUrl) {
    try { s.background = { path: ctx.imgUrl }; } catch { s.background = { color: ctx.PRIMARY }; }
    s.addShape('rect', { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: ctx.PRIMARY }, transparency: overlayOpacity });
  } else {
    s.background = { color: ctx.PRIMARY };
  }
}

// ──────────────────────────────────────────────
// TITLE SLIDE — Full-bleed hero, bottom-anchored
// ──────────────────────────────────────────────
function buildTitleSlide(s: any, slide: any, ctx: any) {
  // Background image (FIXED: use path: not data:)
  applyBgImage(s, ctx, 38);

  // Decorative fallback geometry when no image
  if (!ctx.imgUrl) {
    addDecorativeCircle(s, 8.5, -2.0, 8.0, ctx.ACCENT, 90);
    addDecorativeCircle(s, -2.0, 4.5, 5.0, ctx.SECONDARY, 92);
    addDotGrid(s, 7.0, 0.5, 6.0, 6.5, 'FFFFFF');
  }

  // Bottom gradient panel — text lives here
  s.addShape('rect', { x: 0, y: 4.0, w: 13.33, h: 3.5, fill: { color: ctx.PRIMARY }, transparency: 15 });

  // Left accent stripe
  s.addShape('rect', { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: ctx.ACCENT } });

  // Eyebrow / Category tag (small uppercase label)
  const tag = safeStr(slide.eyebrow || slide.tag || slide.category || 'PRESENTATION');
  s.addText(t(tag.toUpperCase()), {
    x: 1.2, y: 4.15, w: 6.0, h: 0.35,
    fontSize: 10, bold: true, color: ctx.ACCENT,
    fontFace: ctx.FONT_BODY, charSpacing: 3,
  });

  // Accent divider line
  s.addShape('rect', { x: 1.2, y: 4.55, w: 1.8, h: 0.05, fill: { color: ctx.ACCENT } });

  // Title — large, commanding
  s.addText(t(safeStr(slide.title)), {
    x: 1.2, y: 4.6, w: 10.8, h: 2.0,
    fontSize: 52, bold: true, color: 'FFFFFF',
    fontFace: ctx.FONT_TITLE, align: 'left', valign: 'top',
    lineSpacing: 62,
    shadow: { type: 'outer', blur: 8, offset: 3, color: '000000', opacity: 0.5 },
  });

  // Subtitle
  if (slide.subtitle) {
    s.addText(t(safeStr(slide.subtitle)), {
      x: 1.2, y: 6.65, w: 9.0, h: 0.5,
      fontSize: 16, color: 'FFFFFF', transparency: 25,
      fontFace: ctx.FONT_BODY, align: 'left',
    });
  }

  addBrandingBar(s, ctx);
  addSlideNumber(s, ctx, true);
}

// ──────────────────────────────────────────────
// CONTENT SLIDE — Header band + card bullets
// ──────────────────────────────────────────────
function buildContentSlide(s: any, slide: any, ctx: any) {
  s.background = { color: 'F8FAFB' };

  // Header band (primary color across top)
  addHeaderBand(s, ctx, 1.15);

  // Left accent stripe in header
  s.addShape('rect', { x: 0, y: 0, w: 0.12, h: 1.15, fill: { color: ctx.ACCENT } });

  // Title in header band — white
  s.addText(t(safeStr(slide.title)), {
    x: 0.45, y: 0.1, w: 12.4, h: 0.95,
    fontSize: 30, bold: true, color: 'FFFFFF',
    fontFace: ctx.FONT_TITLE, valign: 'middle',
  });

  // Corner decoration (visible, not 95% invisible)
  addDecorativeCircle(s, 10.8, 4.8, 3.5, ctx.SECONDARY, 88);

  // Card-based bullets
  if (Array.isArray(slide.bullets)) {
    const bullets = slide.bullets.slice(0, 6);
    const startY = 1.35;
    const cardH = 0.78;
    const gap = 0.1;

    bullets.forEach((b: any, i: number) => {
      const yPos = startY + i * (cardH + gap);
      const text = typeof b === 'object' && b !== null ? safeStr(b.text || b) : safeStr(b);
      const isAlt = i % 2 === 0;

      // Card background
      s.addShape('roundRect', {
        x: 0.55, y: yPos, w: 12.2, h: cardH,
        fill: { color: isAlt ? 'FFFFFF' : 'F1F5FE' },
        rectRadius: 0.1,
        line: { color: 'E5E9F2', width: 0.5 },
      });

      // Left accent marker
      s.addShape('roundRect', {
        x: 0.55, y: yPos, w: 0.25, h: cardH,
        fill: { color: i === 0 ? ctx.ACCENT : ctx.SECONDARY },
        rectRadius: 0.1,
        transparency: i === 0 ? 0 : 60,
      });

      // Bullet number
      s.addText(t(String(i + 1)), {
        x: 0.95, y: yPos, w: 0.4, h: cardH,
        fontSize: 11, bold: true, align: 'center', valign: 'middle',
        color: ctx.PRIMARY, fontFace: ctx.FONT_TITLE, transparency: 40,
      });

      // Bullet text
      s.addText(t(text), {
        x: 1.45, y: yPos + 0.05, w: 11.0, h: cardH - 0.1,
        fontSize: 15, color: '1E293B', fontFace: ctx.FONT_BODY,
        valign: 'middle', lineSpacing: 20,
      });
    });
  }

  addSlideNumber(s, ctx, false);
}

// ──────────────────────────────────────────────
// TWO-COLUMN SLIDE
// ──────────────────────────────────────────────
function buildTwoColumnSlide(s: any, slide: any, ctx: any) {
  s.background = { color: 'FFFFFF' };

  // Title with accent bar
  addAccentBar(s, 0.8, 0.6, 0.9, ctx.ACCENT);
  s.addText(t(safeStr(slide.title)), {
    x: 1.1, y: 0.5, w: 11.0, h: 1.0,
    fontSize: 30, bold: true, color: ctx.PRIMARY,
    fontFace: ctx.FONT_TITLE, valign: 'middle',
  });

  // Left column — tinted card
  s.addShape('roundRect', {
    x: 0.8, y: 1.8, w: 5.6, h: 5.0,
    fill: { color: ctx.ACCENT_LIGHT },
    rectRadius: 0.15,
  });
  addAccentBar(s, 0.8, 1.8, 5.0, ctx.ACCENT);
  s.addText(t(deepExtractText(slide.leftContent)), {
    x: 1.15, y: 2.1, w: 5.0, h: 4.4,
    fontSize: 14, color: '2D3436', fontFace: ctx.FONT_BODY,
    valign: 'top', wrap: true, lineSpacing: 24,
  });

  // Center divider dots
  for (let i = 0; i < 5; i++) {
    s.addShape('ellipse', {
      x: 6.58, y: 2.5 + i * 0.8, w: 0.08, h: 0.08,
      fill: { color: ctx.PRIMARY }, transparency: 70,
    });
  }

  // Right column — light card
  s.addShape('roundRect', {
    x: 6.9, y: 1.8, w: 5.6, h: 5.0,
    fill: { color: ctx.SECONDARY_LIGHT },
    rectRadius: 0.15,
  });
  addAccentBar(s, 6.9, 1.8, 5.0, ctx.SECONDARY);
  s.addText(t(deepExtractText(slide.rightContent)), {
    x: 7.25, y: 2.1, w: 5.0, h: 4.4,
    fontSize: 14, color: '2D3436', fontFace: ctx.FONT_BODY,
    valign: 'top', wrap: true, lineSpacing: 24,
  });

  addSlideNumber(s, ctx, false);
}

// ──────────────────────────────────────────────
// STATS SLIDE — Infographic dark
// ──────────────────────────────────────────────
function buildStatsSlide(s: any, slide: any, ctx: any) {
  s.background = { color: ctx.PRIMARY };

  // Dot-grid texture
  addDotGrid(s, 0.5, 0.5, 12.5, 6.5, 'FFFFFF');

  // Left accent stripe
  s.addShape('rect', { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: ctx.ACCENT } });

  // Title
  s.addText(t(safeStr(slide.title)), {
    x: 0.45, y: 0.25, w: 12.4, h: 0.85,
    fontSize: 28, bold: true, color: 'FFFFFF',
    fontFace: ctx.FONT_TITLE,
  });

  // Accent line under title
  s.addShape('rect', { x: 0.45, y: 1.1, w: 2.0, h: 0.05, fill: { color: ctx.ACCENT } });

  const stats = Array.isArray(slide.stats) ? slide.stats : [];
  const count = Math.min(stats.length, 4);
  if (count === 0) { addBrandingBar(s, ctx); addSlideNumber(s, ctx, true); return; }

  const gap = 0.35;
  const totalW = 12.43;
  const cardW = (totalW - gap * (count - 1)) / count;
  const cardColors = [ctx.ACCENT, ctx.SECONDARY, lighten(ctx.PRIMARY, 0.35), lighten(ctx.ACCENT, 0.25)];

  stats.slice(0, count).forEach((stat: any, i: number) => {
    const xPos = 0.45 + i * (cardW + gap);
    const cardColor = cardColors[i % cardColors.length];

    // Shadow
    s.addShape('roundRect', { x: xPos + 0.05, y: 1.35, w: cardW, h: 5.5, fill: { color: '000000' }, rectRadius: 0.2, transparency: 80 });
    // Card body
    s.addShape('roundRect', { x: xPos, y: 1.3, w: cardW, h: 5.5, fill: { color: lighten(ctx.PRIMARY, 0.08) }, rectRadius: 0.2 });
    // Top accent color band
    s.addShape('roundRect', { x: xPos, y: 1.3, w: cardW, h: 0.55, fill: { color: cardColor }, rectRadius: 0.2 });
    s.addShape('rect', { x: xPos, y: 1.55, w: cardW, h: 0.3, fill: { color: cardColor } });

    // Stat value — large, white, commanding
    s.addText(t(safeStr(stat.value)), {
      x: xPos, y: 2.1, w: cardW, h: 2.5,
      fontSize: 64, bold: true, color: 'FFFFFF',
      fontFace: ctx.FONT_TITLE, align: 'center', valign: 'middle',
      shadow: { type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.3 },
    });

    // Stat label
    s.addText(t(safeStr(stat.label)), {
      x: xPos + 0.15, y: 4.7, w: cardW - 0.3, h: 1.0,
      fontSize: 13, color: 'FFFFFF', fontFace: ctx.FONT_BODY,
      align: 'center', wrap: true, bold: true, transparency: 15,
    });

    // Stat context
    if (stat.context) {
      s.addShape('rect', { x: xPos + (cardW / 2) - 0.2, y: 5.8, w: 0.4, h: 0.02, fill: { color: cardColor } });
      s.addText(t(safeStr(stat.context)), {
        x: xPos + 0.1, y: 5.9, w: cardW - 0.2, h: 0.8,
        fontSize: 10, color: 'FFFFFF', fontFace: ctx.FONT_BODY,
        align: 'center', wrap: true, transparency: 45,
      });
    }
  });

  addBrandingBar(s, ctx);
  addSlideNumber(s, ctx, true);
}

// ──────────────────────────────────────────────
// QUOTE SLIDE — Editorial magazine style
// ──────────────────────────────────────────────
function buildQuoteSlide(s: any, slide: any, ctx: any) {
  // FIXED: use applyBgImage (path: not data:)
  applyBgImage(s, ctx, 45);

  if (!ctx.imgUrl) {
    addDecorativeCircle(s, 7.0, -1.5, 7.0, ctx.ACCENT, 90);
    addDotGrid(s, 7.0, 0, 6.5, 7.5, 'FFFFFF');
  }

  // Left gradient panel for text readability
  s.addShape('rect', { x: 0, y: 0, w: 7.5, h: 7.5, fill: { color: ctx.PRIMARY }, transparency: 20 });

  // Left accent stripe
  s.addShape('rect', { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: ctx.ACCENT } });

  // Giant quote mark — editorial style, more opacity
  s.addText(t('\u201C'), {
    x: 0.3, y: -0.3, w: 3.5, h: 3.5,
    fontSize: 220, color: ctx.ACCENT, fontFace: 'Georgia',
    transparency: 65,
  });

  // Quote text — right-aligned editorial convention
  s.addText(t(safeStr(slide.quote)), {
    x: 0.55, y: 2.2, w: 7.5, h: 3.5,
    fontSize: 28, italic: true, color: 'FFFFFF',
    fontFace: ctx.FONT_TITLE, align: 'left', valign: 'middle',
    wrap: true, lineSpacing: 42,
    shadow: { type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.4 },
  });

  if (slide.quoteAuthor) {
    s.addShape('rect', { x: 0.55, y: 5.9, w: 1.2, h: 0.05, fill: { color: ctx.ACCENT } });
    s.addText(t(safeStr(slide.quoteAuthor)), {
      x: 2.0, y: 5.7, w: 6.0, h: 0.5,
      fontSize: 15, bold: true, color: 'FFFFFF', transparency: 20,
      fontFace: ctx.FONT_BODY,
    });
  }

  addBrandingBar(s, ctx);
  addSlideNumber(s, ctx, true);
}

// ──────────────────────────────────────────────
// CHART SLIDE — Professional modern charts
// ──────────────────────────────────────────────
function buildChartSlide(s: any, slide: any, ctx: any) {
  s.background = { color: 'F8FAFB' };

  // Subtle background card for chart area
  s.addShape('roundRect', {
    x: 0.6, y: 1.6, w: 12.13, h: 5.5,
    fill: { color: 'FFFFFF' },
    line: { color: 'E8ECF0', width: 1 },
    rectRadius: 0.2,
    shadow: { type: 'outer', blur: 8, offset: 2, color: '00000010' },
  });

  // Title with accent bar
  addAccentBar(s, 0.8, 0.5, 0.8, ctx.ACCENT);
  s.addText(t(safeStr(slide.title)), {
    x: 1.1, y: 0.25, w: 11.0, h: 0.8,
    fontSize: 28, bold: true, color: ctx.PRIMARY,
    fontFace: ctx.FONT_TITLE,
  });

  if (slide.chartInsight) {
    s.addText(t(safeStr(slide.chartInsight)), {
      x: 1.1, y: 1.0, w: 11.0, h: 0.5,
      fontSize: 14, color: ctx.SECONDARY,
      fontFace: ctx.FONT_BODY,
    });
  }

  if (!Array.isArray(slide.chartData)) return;

  const chartType = slide.chartType === 'doughnut' ? 'doughnut' : 'bar';
  const labels = slide.chartData.map((d: any) => safeStr(d.label || 'Label'));
  const values = slide.chartData.map((d: any) => Number(d.value) || 0);
  const data = [{ name: 'Data', labels, values }];

  // Curated professional palette
  const chartColors = [
    ctx.ACCENT, ctx.PRIMARY, ctx.SECONDARY,
    '6366F1', '10B981', 'EC4899', '8B5CF6', '06B6D4',
  ];

  if (chartType === 'doughnut') {
    s.addChart(chartType, data, {
      x: 1.5, y: 1.9, w: 10.33, h: 5.0,
      holeSize: 55,
      showLegend: true, legendPos: 'r', legendFontSize: 11,
      legendFontFace: ctx.FONT_BODY, legendColor: '64748B',
      chartColors: chartColors.slice(0, labels.length),
      showPercent: true, showValue: false,
      dataLabelColor: 'FFFFFF', dataLabelFontSize: 11,
      dataLabelFontFace: ctx.FONT_BODY, dataLabelPosition: 'bestFit',
    });
  } else {
    s.addChart(chartType, data, {
      x: 1.0, y: 1.9, w: 11.33, h: 5.0,
      barDir: 'col',
      barGapWidthPct: 120,
      showLegend: false,
      chartColors: chartColors.slice(0, labels.length),
      showValue: true,
      dataLabelColor: '334155', dataLabelFontSize: 10,
      dataLabelFontFace: ctx.FONT_BODY, dataLabelPosition: 'outEnd',
      catAxisLabelColor: '64748B', catAxisLabelFontSize: 10,
      catAxisLabelFontFace: ctx.FONT_BODY,
      valAxisLabelColor: '94A3B8', valAxisLabelFontSize: 9,
      valGridLine: { color: 'F1F5F9', size: 1 },
      catGridLine: { style: 'none' },
    });
  }

  addSlideNumber(s, ctx, false);
}

// ──────────────────────────────────────────────
// IMAGE-TEXT SLIDE — Magazine spread
// ──────────────────────────────────────────────
function buildImageTextSlide(s: any, slide: any, ctx: any) {
  s.background = { color: 'F0F4F8' };

  const isEven = (slide.index || 1) % 2 === 0;
  const imgX = isEven ? 0 : 6.83;
  const txtX = isEven ? 6.83 : 0;

  // Full-height image side (FIXED: use path: imgUrl)
  if (ctx.imgUrl) {
    try {
      s.addImage({ path: ctx.imgUrl, x: imgX, y: 0, w: 6.5, h: 7.5 });
    } catch {
      s.addShape('rect', { x: imgX, y: 0, w: 6.5, h: 7.5, fill: { color: ctx.SECONDARY_LIGHT } });
    }
  } else {
    s.addShape('rect', { x: imgX, y: 0, w: 6.5, h: 7.5, fill: { color: ctx.SECONDARY_LIGHT } });
    addDotGrid(s, imgX + 0.5, 0.5, 5.5, 6.5, ctx.PRIMARY);
  }

  // Text side — dark card overlapping image slightly
  const cardX = isEven ? 6.33 : 0;
  s.addShape('rect', { x: cardX, y: 0, w: 7.0, h: 7.5, fill: { color: ctx.PRIMARY } });

  // Header band
  s.addShape('rect', { x: cardX, y: 0, w: 7.0, h: 0.08, fill: { color: ctx.ACCENT } });

  // Title
  s.addText(t(safeStr(slide.title)), {
    x: cardX + 0.5, y: 0.4, w: 6.2, h: 1.4,
    fontSize: 26, bold: true, color: 'FFFFFF',
    fontFace: ctx.FONT_TITLE, wrap: true, lineSpacing: 34,
  });

  // Accent divider
  s.addShape('rect', { x: cardX + 0.5, y: 1.9, w: 1.5, h: 0.05, fill: { color: ctx.ACCENT } });

  // Content text
  s.addText(t(safeStr(slide.content)), {
    x: cardX + 0.5, y: 2.1, w: 6.1, h: 4.9,
    fontSize: 15, color: 'FFFFFF', transparency: 15, fontFace: ctx.FONT_BODY,
    valign: 'top', wrap: true, lineSpacing: 26,
  });

  addSlideNumber(s, ctx, true);
}

// ──────────────────────────────────────────────
// CLOSING SLIDE — Cinematic ending
// ──────────────────────────────────────────────
function buildClosingSlide(s: any, slide: any, ctx: any) {
  // FIXED: applyBgImage uses path: imgUrl
  applyBgImage(s, ctx, 30);

  if (!ctx.imgUrl) {
    addDecorativeCircle(s, -2.0, -2.0, 7.0, ctx.ACCENT, 88);
    addDecorativeCircle(s, 9.0, 4.0, 6.0, ctx.SECONDARY, 90);
    addDotGrid(s, 0, 0, 13.33, 7.5, 'FFFFFF');
  }

  // Bottom gradient rise — text zone
  s.addShape('rect', { x: 0, y: 3.8, w: 13.33, h: 3.7, fill: { color: ctx.PRIMARY }, transparency: 15 });

  // Left accent stripe
  s.addShape('rect', { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: ctx.ACCENT } });

  // Accent line
  s.addShape('rect', { x: 4.5, y: 3.95, w: 4.33, h: 0.05, fill: { color: ctx.ACCENT } });

  // Title — large centered
  s.addText(t(safeStr(slide.title)), {
    x: 1.0, y: 4.1, w: 11.33, h: 2.0,
    fontSize: 48, bold: true, color: 'FFFFFF',
    fontFace: ctx.FONT_TITLE, align: 'center', valign: 'middle',
    shadow: { type: 'outer', blur: 8, offset: 3, color: '000000', opacity: 0.5 },
  });

  // Subtitle in outlined box (sophisticated, not filled)
  if (slide.subtitle) {
    s.addShape('roundRect', {
      x: 3.5, y: 6.2, w: 6.33, h: 0.65,
      fill: { color: 'FFFFFF', transparency: 100 },
      line: { color: 'FFFFFF', width: 1 },
      rectRadius: 0.3,
      transparency: 60,
    });
    s.addText(t(safeStr(slide.subtitle)), {
      x: 3.5, y: 6.2, w: 6.33, h: 0.65,
      fontSize: 14, color: 'FFFFFF', transparency: 20,
      fontFace: ctx.FONT_BODY, align: 'center', valign: 'middle',
    });
  }

  addBrandingBar(s, ctx);
  addSlideNumber(s, ctx, true);
}
