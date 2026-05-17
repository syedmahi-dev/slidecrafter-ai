import React, { useState } from 'react';
import { Download, Sparkles } from 'lucide-react';

interface PreviewPaneProps {
  slideData: any;
  onDownload: () => void;
  isDownloading: boolean;
  engine: string;
}

const safeText = (val: any): string => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        const icon = item.icon ? `${item.icon} ` : '';
        const text = item.text || item.content || item.label || item.value || '';
        if (text) return `${icon}${safeText(text)}`;
        if (item.title) return safeText(item.title);
        return safeText(Object.values(item).join(' '));
      }
      return String(item);
    }).filter(Boolean).join('\n');
  }
  if (typeof val === 'object') {
    if (val.text) return safeText(val.text);
    if (val.content) return safeText(val.content);
    const parts: string[] = [];
    if (val.title) parts.push(safeText(val.title));
    if (val.subtitle) parts.push(safeText(val.subtitle));
    if (Array.isArray(val.bullets)) parts.push(safeText(val.bullets));
    if (Array.isArray(val.points)) parts.push(safeText(val.points));
    if (val.description) parts.push(safeText(val.description));
    if (parts.length > 0) return parts.join('\n');
    return Object.values(val).map(v => safeText(v)).filter(Boolean).join(' ');
  }
  return String(val);
};

function lightenHex(hex: string, amount: number): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${[lr, lg, lb].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

// ─── CSS BAR CHART ──────────────────────────────
function CSSBarChart({ data, primaryColor, secondaryColor, accentColor }: {
  data: any[]; primaryColor: string; secondaryColor: string; accentColor: string;
}) {
  const maxVal = Math.max(...data.map((d: any) => Number(d.value) || 0), 1);
  const colors = [accentColor, primaryColor, secondaryColor, '#6366F1', '#10B981', '#EC4899', '#8B5CF6', '#06B6D4'];
  const total = data.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);

  return (
    <div className="flex flex-col h-full w-full px-4 pb-2 pt-3">
      {/* Grid lines */}
      <div className="flex-1 relative flex items-end gap-[6px]">
        {[0.25, 0.5, 0.75, 1].map((frac, i) => (
          <div key={i} className="absolute left-0 right-0 border-t border-dashed" style={{ bottom: `${frac * 100}%`, borderColor: `${primaryColor}10` }} />
        ))}
        {data.slice(0, 8).map((d: any, i: number) => {
          const val = Number(d.value) || 0;
          const pct = Math.max((val / maxVal) * 100, 5);
          const color = colors[i % colors.length];
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end min-w-0 relative z-10">
              <span className="text-[8px] font-bold mb-0.5" style={{ color }}>{val}</span>
              <div className="w-[85%] rounded-t-lg relative overflow-hidden transition-all duration-500"
                style={{ height: `${pct}%`, backgroundColor: color, minHeight: '4px', boxShadow: `0 -2px 8px ${color}20` }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)' }} />
              </div>
            </div>
          );
        })}
      </div>
      {/* X-axis */}
      <div className="flex gap-[6px] mt-1.5 pt-1.5 border-t" style={{ borderColor: `${primaryColor}15` }}>
        {data.slice(0, 8).map((d: any, i: number) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[7px] font-semibold truncate block" style={{ color: `${primaryColor}80` }}>{safeText(d.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CSS DOUGHNUT CHART ─────────────────────────
function CSSDoughnutChart({ data, primaryColor, secondaryColor, accentColor }: {
  data: any[]; primaryColor: string; secondaryColor: string; accentColor: string;
}) {
  const total = data.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0) || 1;
  const colors = [accentColor, primaryColor, secondaryColor, '#6366F1', '#10B981', '#EC4899'];
  let accumulated = 0;
  const stops: string[] = [];
  data.forEach((d: any, i: number) => {
    const pct = ((Number(d.value) || 0) / total) * 100;
    const color = colors[i % colors.length];
    stops.push(`${color} ${accumulated}% ${accumulated + pct}%`);
    accumulated += pct;
  });

  return (
    <div className="flex items-center justify-center gap-5 h-full w-full px-4">
      <div className="relative shrink-0" style={{
        width: '100px', height: '100px', borderRadius: '50%',
        background: `conic-gradient(${stops.join(', ')})`,
        boxShadow: `0 4px 16px ${primaryColor}15`,
      }}>
        <div className="absolute rounded-full" style={{
          top: '22%', left: '22%', width: '56%', height: '56%',
          backgroundColor: '#FAFBFC',
          boxShadow: 'inset 0 1px 6px rgba(0,0,0,0.06)',
        }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold" style={{ color: primaryColor }}>{total}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 min-w-0 overflow-hidden">
        {data.slice(0, 6).map((d: any, i: number) => {
          const val = Number(d.value) || 0;
          const pct = Math.round((val / total) * 100);
          return (
            <div key={i} className="flex items-center gap-2 text-[9px] min-w-0">
              <span className="w-2.5 h-2.5 rounded-[3px] shrink-0 shadow-sm" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="truncate font-medium" style={{ color: `${primaryColor}99` }}>{safeText(d.label)}</span>
              <span className="ml-auto shrink-0 font-bold tabular-nums" style={{ color: colors[i % colors.length] }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI IMAGE ───────────────────────────────────
function AIImage({ prompt, alt }: { prompt: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true`;
  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden rounded-xl">
      {!loaded && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          <div className="absolute flex flex-col items-center gap-1.5">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            <span className="text-[9px] font-semibold text-gray-400">Generating...</span>
          </div>
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-300"><span className="text-xl">⬚</span></div>
      ) : (
        <img src={url} alt={alt} className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)} onError={() => setError(true)} />
      )}
    </div>
  );
}

// ─── SLIDE NUMBER BADGE ─────────────────────────
function SlideNum({ num, total, light }: { num: number; total: number; light: boolean }) {
  return (
    <div className={`absolute bottom-2.5 right-3.5 text-[9px] font-bold tracking-widest ${light ? 'text-white/30' : 'text-gray-300'}`}>
      {String(num).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </div>
  );
}

// ─── MAIN PREVIEW PANE ──────────────────────────
export function PreviewPane({ slideData, onDownload, isDownloading }: PreviewPaneProps) {
  if (!slideData || !Array.isArray(slideData.slides)) return null;

  const { theme } = slideData;
  const primaryColor = theme?.primaryColor || '#1B2A4A';
  const secondaryColor = theme?.secondaryColor || '#64748B';
  const accentColor = theme?.accentColor || '#F59E0B';
  const titleFont = theme?.fontTitle || 'Montserrat, DM Sans, sans-serif';
  const bodyFont = theme?.fontBody || 'Open Sans, Plus Jakarta Sans, sans-serif';
  const total = slideData.slides.length;

  const accentLight = lightenHex(accentColor, 0.88);
  const secondaryLight = lightenHex(secondaryColor, 0.88);

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 flex flex-col gap-6 slide-preview-container pb-24">
      {/* Header & Download */}
      <div className="glass-panel flex flex-col md:flex-row items-center justify-between gap-6 mb-8 p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl" />
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: accentColor }} />
        <div className="flex-1 relative z-10">
          <h2 className="text-3xl font-black text-text tracking-tight flex items-center gap-3">
            <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
            {safeText(slideData.title || 'Slide Preview')}
          </h2>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5 shadow-sm">
              <span className="text-xs font-bold text-text-muted tracking-wide uppercase">Palette</span>
              <div className="flex gap-1 ml-1">
                {[primaryColor, secondaryColor, accentColor].map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full shadow-inner ring-1 ring-white/10" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="bg-background/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5 shadow-sm flex items-center gap-2">
              <span className="text-xs font-bold text-text-muted tracking-wide uppercase">Typography</span>
              <span className="text-xs font-semibold text-text">{safeText(theme?.fontTitle?.split(',')[0] || 'Default')}</span>
            </div>
            <div className="bg-background/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5 shadow-sm flex items-center gap-2">
              <span className="text-xs font-bold text-text-muted tracking-wide uppercase">Length</span>
              <span className="text-xs font-semibold text-text">{total} slides</span>
            </div>
          </div>
        </div>
        <button onClick={onDownload} disabled={isDownloading}
          className="px-8 py-4 text-white rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] relative z-10 border border-white/10"
          style={{ backgroundColor: accentColor }}>
          {isDownloading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Download className="w-5 h-5" />}
          Export PPTX
        </button>
      </div>

      {/* Slide Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {slideData.slides.map((slide: any, idx: number) => {
          const isDark = slide.type === 'title' || slide.type === 'closing' || slide.type === 'quote' || slide.type === 'stats';
          const slideNum = idx + 1;

          // ─ TITLE SLIDE ─
          if (slide.type === 'title') {
            return (
              <div key={idx} className="relative overflow-hidden aspect-video rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group"
                style={{ backgroundColor: primaryColor }}>
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.12 }} />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full" style={{ backgroundColor: secondaryColor, opacity: 0.1 }} />
                <div className="relative flex flex-col justify-end h-full p-6">
                  <h3 className="text-2xl font-black text-white leading-snug mb-2" style={{ fontFamily: titleFont }}>{safeText(slide.title)}</h3>
                  <div className="w-12 h-0.5 mb-2" style={{ backgroundColor: accentColor }} />
                  {slide.subtitle && <p className="text-sm font-medium opacity-60 text-white" style={{ fontFamily: bodyFont }}>{safeText(slide.subtitle)}</p>}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ backgroundColor: accentColor }} />
                </div>
                <SlideNum num={slideNum} total={total} light={true} />
              </div>
            );
          }

          // ─ CONTENT SLIDE ─
          if (slide.type === 'content') {
            return (
              <div key={idx} className="relative overflow-hidden aspect-video rounded-2xl shadow-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
                <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.04 }} />
                <div className="flex flex-col h-full p-5">
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                    <div className="w-1 h-7 rounded-full" style={{ backgroundColor: accentColor }} />
                    <h3 className="text-lg font-bold truncate" style={{ color: primaryColor, fontFamily: titleFont }}>{safeText(slide.title)}</h3>
                  </div>
                  <div className="w-16 h-px mb-3" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
                  {Array.isArray(slide.bullets) && (
                    <ul className="space-y-2 overflow-hidden flex-1">
                      {slide.bullets.slice(0, 5).map((b: any, i: number) => {
                        const text = typeof b === 'object' && b !== null ? safeText(b.text || b) : safeText(b);
                        return (
                          <li key={i} className="flex gap-2.5 text-xs items-start" style={{ fontFamily: bodyFont }}>
                            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                              style={{ backgroundColor: i === 0 ? accentColor : `${primaryColor}10`, color: i === 0 ? 'white' : primaryColor }}>
                              {i + 1}
                            </span>
                            <span className="pt-0.5 leading-relaxed line-clamp-2 text-gray-700">{text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <SlideNum num={slideNum} total={total} light={false} />
              </div>
            );
          }

          // ─ TWO-COLUMN SLIDE ─
          if (slide.type === 'two-column') {
            return (
              <div key={idx} className="relative overflow-hidden aspect-video rounded-2xl shadow-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
                <div className="flex flex-col h-full p-5">
                  <div className="flex items-center gap-2 mb-3 shrink-0">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
                    <h3 className="text-base font-bold truncate" style={{ color: primaryColor, fontFamily: titleFont }}>{safeText(slide.title)}</h3>
                  </div>
                  <div className="flex gap-2.5 flex-1 min-h-0">
                    <div className="flex-1 p-3 rounded-xl overflow-hidden relative" style={{ backgroundColor: accentLight, borderLeft: `3px solid ${accentColor}` }}>
                      <p className="text-[11px] leading-relaxed text-gray-700 line-clamp-6" style={{ fontFamily: bodyFont }}>{safeText(slide.leftContent)}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1.5 px-0.5">
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.2 }} />)}
                    </div>
                    <div className="flex-1 p-3 rounded-xl overflow-hidden" style={{ backgroundColor: secondaryLight, borderLeft: `3px solid ${secondaryColor}` }}>
                      <p className="text-[11px] leading-relaxed text-gray-700 line-clamp-6" style={{ fontFamily: bodyFont }}>{safeText(slide.rightContent)}</p>
                    </div>
                  </div>
                </div>
                <SlideNum num={slideNum} total={total} light={false} />
              </div>
            );
          }

          // ─ STATS SLIDE ─
          if (slide.type === 'stats' && Array.isArray(slide.stats)) {
            const statColors = [accentColor, secondaryColor, lightenHex(primaryColor, 0.3), lightenHex(accentColor, 0.3)];
            return (
              <div key={idx} className="relative overflow-hidden aspect-video rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group"
                style={{ backgroundColor: primaryColor }}>
                <div className="flex flex-col h-full p-5">
                  <h3 className="text-base font-bold text-white mb-1 shrink-0" style={{ fontFamily: titleFont }}>{safeText(slide.title)}</h3>
                  <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: accentColor }} />
                  <div className={`grid gap-2 flex-1 ${slide.stats.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {slide.stats.slice(0, 4).map((s: any, i: number) => (
                      <div key={i} className="rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: statColors[i % statColors.length] }}>
                        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at top right, white, transparent)' }} />
                        <div className="text-xl font-black relative z-10" style={{ color: primaryColor }}>{safeText(typeof s === 'object' ? s.value : s)}</div>
                        <div className="text-[9px] font-semibold mt-0.5 text-center truncate w-full relative z-10" style={{ color: `${primaryColor}CC` }}>
                          {typeof s === 'object' ? safeText(s.label) : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <SlideNum num={slideNum} total={total} light={true} />
              </div>
            );
          }

          // ─ QUOTE SLIDE ─
          if (slide.type === 'quote') {
            return (
              <div key={idx} className="relative overflow-hidden aspect-video rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group"
                style={{ backgroundColor: primaryColor }}>
                <div className="absolute top-4 -right-6 w-28 h-28 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.08 }} />
                <div className="flex flex-col justify-center h-full p-6 relative">
                  <div className="text-6xl leading-none opacity-20 mb-1" style={{ color: accentColor, fontFamily: 'Georgia, serif' }}>"</div>
                  <p className="text-sm font-semibold italic leading-relaxed text-white line-clamp-4 mb-3" style={{ fontFamily: titleFont }}>
                    {safeText(slide.quote)}
                  </p>
                  {slide.quoteAuthor && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-px" style={{ backgroundColor: accentColor }} />
                      <span className="text-[11px] font-bold" style={{ color: secondaryColor }}>{safeText(slide.quoteAuthor)}</span>
                    </div>
                  )}
                </div>
                <SlideNum num={slideNum} total={total} light={true} />
              </div>
            );
          }

          // ─ CHART SLIDE ─
          if (slide.type === 'chart' && Array.isArray(slide.chartData)) {
            return (
              <div key={idx} className="relative overflow-hidden aspect-video rounded-2xl shadow-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
                <div className="flex flex-col h-full p-5">
                  <div className="flex items-center gap-2 mb-2 shrink-0">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
                    <h3 className="text-base font-bold truncate" style={{ color: primaryColor, fontFamily: titleFont }}>{safeText(slide.title)}</h3>
                  </div>
                  <div className="flex-1 rounded-xl overflow-hidden border" style={{ borderColor: `${primaryColor}10`, backgroundColor: `${primaryColor}03` }}>
                    {slide.chartType === 'doughnut'
                      ? <CSSDoughnutChart data={slide.chartData} primaryColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} />
                      : <CSSBarChart data={slide.chartData} primaryColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} />}
                  </div>
                </div>
                <SlideNum num={slideNum} total={total} light={false} />
              </div>
            );
          }

          // ─ IMAGE-TEXT SLIDE ─
          if (slide.type === 'image-text') {
            const isEven = slideNum % 2 === 0;
            return (
              <div key={idx} className="relative overflow-hidden aspect-video rounded-2xl shadow-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
                <div className="flex flex-col h-full p-5">
                  <div className="flex items-center gap-2 mb-2 shrink-0">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
                    <h3 className="text-base font-bold truncate" style={{ color: primaryColor, fontFamily: titleFont }}>{safeText(slide.title)}</h3>
                  </div>
                  <div className={`flex gap-2.5 flex-1 min-h-0 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="flex-1 rounded-xl overflow-hidden">
                      {slide.imagePrompt || slide.imageKeywords ? (
                        <AIImage prompt={safeText(slide.imagePrompt || slide.imageKeywords)} alt={safeText(slide.title)} />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center"><span className="text-gray-300 text-sm">⬚</span></div>
                      )}
                    </div>
                    <div className="flex-1 p-3 rounded-xl overflow-hidden" style={{ backgroundColor: accentLight, borderLeft: `3px solid ${accentColor}40` }}>
                      <p className="text-[11px] leading-relaxed text-gray-700 line-clamp-6" style={{ fontFamily: bodyFont }}>{safeText(slide.content)}</p>
                    </div>
                  </div>
                </div>
                <SlideNum num={slideNum} total={total} light={false} />
              </div>
            );
          }

          // ─ CLOSING SLIDE ─
          if (slide.type === 'closing') {
            return (
              <div key={idx} className="relative overflow-hidden aspect-video rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group"
                style={{ backgroundColor: primaryColor }}>
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.1 }} />
                <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full" style={{ backgroundColor: secondaryColor, opacity: 0.08 }} />
                <div className="relative flex flex-col items-center justify-center h-full p-6 text-center">
                  <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: titleFont, letterSpacing: '1px' }}>{safeText(slide.title)}</h3>
                  <div className="w-16 h-0.5 mb-3" style={{ backgroundColor: accentColor }} />
                  {slide.subtitle && <p className="text-sm font-medium text-white/50" style={{ fontFamily: bodyFont }}>{safeText(slide.subtitle)}</p>}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ backgroundColor: accentColor }} />
                </div>
                <SlideNum num={slideNum} total={total} light={true} />
              </div>
            );
          }

          // ─ FALLBACK ─
          return (
            <div key={idx} className="relative overflow-hidden aspect-video rounded-2xl shadow-lg bg-white border border-gray-100 p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <h3 className="text-base font-bold mb-2" style={{ color: primaryColor, fontFamily: titleFont }}>{safeText(slide.title)}</h3>
              <p className="text-xs text-gray-600">{safeText(slide.subtitle || slide.content || '')}</p>
              <SlideNum num={slideNum} total={total} light={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
