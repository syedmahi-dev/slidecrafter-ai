import { useState, useEffect } from 'react';
import { Presentation, Key, SlidersHorizontal, Sparkles, Layers, GitFork, Cpu, Palette } from 'lucide-react';
import { GITHUB_MODELS, type GitHubModelId } from '../lib/github-models';
import { THEME_PRESETS } from '../lib/theme-presets';

export interface GenerateConfig {
  topic: string;
  slides: number;
  apiKey: string;
  engine: 'pptxgenjs' | 'python-pptx';
  provider: 'gemini' | 'github';
  githubModel: GitHubModelId;
  themePreset: string;
}

interface ConfigurationPanelProps {
  onGenerate: (config: GenerateConfig) => void;
  isGenerating?: boolean;
}

export function ConfigurationPanel({ onGenerate, isGenerating = false }: ConfigurationPanelProps) {
  const [topic, setTopic] = useState('');
  const [slides, setSlides] = useState(8);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('slidecraft_api_key') || '');
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const [engine, setEngine] = useState<'pptxgenjs' | 'python-pptx'>(isLocal ? 'pptxgenjs' : 'pptxgenjs');
  const [provider, setProvider] = useState<'gemini' | 'github'>('gemini');
  const [githubModel, setGithubModel] = useState<GitHubModelId>('openai/gpt-4o-mini');
  const [themePreset, setThemePreset] = useState('auto');

  useEffect(() => {
    localStorage.setItem('slidecraft_api_key', apiKey);
  }, [apiKey]);

  const handleGenerate = () => {
    if (!topic || !apiKey) return;
    onGenerate({ topic, slides, apiKey, engine, provider, githubModel, themePreset });
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 bento-container pb-20">
      
      {/* 1. Main Prompt Input (Full Width for Long Context) */}
      <div className="glass-panel md:col-span-12 flex flex-col gap-5 p-8 bento-item group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl" />
        <div className="flex items-center gap-3 relative z-10">
          <Presentation className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-text">The Brief</h2>
        </div>
        
        <div className="flex flex-col gap-3 relative z-10">
          <label htmlFor="topic" className="text-sm font-semibold text-text-muted">
            What are we building today? Provide context, goals, and key points.
          </label>
          <textarea 
            id="topic"
            value={topic}
            maxLength={2000}
            rows={4}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., A 10-slide pitch deck for a Series A AI startup. Emphasize our 3.2x ROI and unique data moat..." 
            className="input-elegant resize-y min-h-[140px]"
          />
          <div className="text-right text-xs text-text-muted/60 font-medium font-mono">
            {topic.length} / 2000
          </div>
        </div>
      </div>

      {/* 2. AI Provider Selection */}
      <div className="glass-panel md:col-span-12 flex flex-col gap-5 p-8 bento-item">
        <div className="flex items-center gap-3 mb-1">
          <Cpu className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-text">Engine Selection</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gemini Option */}
          <label 
            className={`flex flex-col p-5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${provider === 'gemini' ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'border-border hover:border-accent/50 bg-background/50'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="radio" 
                name="provider" 
                value="gemini" 
                checked={provider === 'gemini'}
                onChange={() => setProvider('gemini')}
                className="w-4 h-4 text-accent focus:ring-accent accent-accent bg-surface border-border"
              />
              <span className="font-bold text-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Google Gemini
              </span>
            </div>
            <p className="text-xs text-text-muted ml-7 leading-relaxed">Gemini 2.5 Flash — High speed reasoning via Google AI Studio</p>
          </label>

          {/* GitHub Models Option */}
          <label 
            className={`flex flex-col p-5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${provider === 'github' ? 'border-accent bg-accent/10 shadow-sm' : 'border-border hover:border-accent/50 bg-background/50'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="radio" 
                name="provider" 
                value="github" 
                checked={provider === 'github'}
                onChange={() => setProvider('github')}
                className="w-4 h-4 text-accent focus:ring-accent accent-accent bg-surface border-border"
              />
              <span className="font-bold text-text flex items-center gap-2">
                <GitFork className="w-4 h-4" />
                GitHub Models
              </span>
            </div>
            <p className="text-xs text-text-muted ml-7 leading-relaxed">GPT-4o, o3-mini, Llama 4 — Premium inference via GitHub</p>
          </label>
        </div>

        {/* GitHub Model Selector (only when GitHub is selected) */}
        {provider === 'github' && (
          <div className="flex flex-col gap-4 mt-2 p-5 rounded-xl bg-background/80 border border-border">
            <label className="text-sm font-semibold text-text-muted uppercase tracking-widest text-[10px]">Model Architecture</label>
            
            {/* Group models by provider */}
            {['OpenAI', 'Meta', 'xAI', 'DeepSeek', 'Mistral'].map(providerName => {
              const providerModels = GITHUB_MODELS.filter(m => m.provider === providerName);
              if (providerModels.length === 0) return null;
              return (
                <div key={providerName} className="mb-2 last:mb-0">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2">{providerName}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {providerModels.map((m) => (
                      <label key={m.id}
                        className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all text-center group ${githubModel === m.id ? 'border-accent bg-accent/15 shadow-sm' : 'border-border hover:border-accent/40 bg-surface/50'}`}
                      >
                        <input 
                          type="radio" name="ghModel" value={m.id}
                          checked={githubModel === m.id}
                          onChange={() => setGithubModel(m.id as GitHubModelId)}
                          className="sr-only"
                        />
                        <span className={`font-bold text-sm transition-colors ${githubModel === m.id ? 'text-accent' : 'text-text-muted group-hover:text-text'}`}>{m.name}</span>
                        <span className={`text-[10px] mt-1 transition-colors ${githubModel === m.id ? 'text-text-muted font-medium' : 'text-text-muted/60'}`}>{m.description}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2.5. Creative Style Preset Selection */}
      <div className="glass-panel md:col-span-12 flex flex-col gap-5 p-8 bento-item">
        <div className="flex items-center gap-3 mb-1">
          <Palette className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-text">Visual Style Preset</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEME_PRESETS.map((preset) => {
            const isSelected = themePreset === preset.id;
            return (
              <label 
                key={preset.id}
                className={`flex flex-col p-5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${isSelected ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'border-border hover:border-accent/50 bg-background/50'}`}
              >
                <input 
                  type="radio" 
                  name="themePreset" 
                  value={preset.id}
                  checked={isSelected}
                  onChange={() => setThemePreset(preset.id)}
                  className="sr-only"
                />
                <div className="flex justify-between items-center mb-3">
                  <span className={`font-bold text-sm transition-colors ${isSelected ? 'text-accent' : 'text-text'}`}>
                    {preset.name}
                  </span>
                  
                  {/* Small preview color dots */}
                  <div className="flex gap-1.5">
                    {preset.colors ? (
                      preset.colors.map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-full border border-border/30" style={{ backgroundColor: c }} />
                      ))
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full border border-border/30" style={{ backgroundColor: preset.primary }} />
                        <div className="w-3 h-3 rounded-full border border-border/30" style={{ backgroundColor: preset.secondary }} />
                        <div className="w-3 h-3 rounded-full border border-border/30" style={{ backgroundColor: preset.accent }} />
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed font-medium">{preset.description}</p>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Configuration & Engine Selector */}
      <div className="glass-panel md:col-span-7 flex flex-col gap-6 p-8 bento-item">
        <div className="flex items-center gap-3 mb-2">
          <SlidersHorizontal className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-text">Parameters</h2>
        </div>
        
        <div className="flex flex-col gap-3 mb-2">
          <div className="flex justify-between items-end">
            <label htmlFor="slides" className="text-sm font-semibold text-text-muted">Slide Count</label>
            <span className="font-mono text-xl font-bold text-accent">{slides}</span>
          </div>
          <div className="relative pt-2 pb-4">
            <input 
              id="slides"
              type="range" 
              min="3" 
              max="20" 
              value={slides}
              onChange={(e) => setSlides(parseInt(e.target.value))}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label 
            className={`flex flex-col p-5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${engine === 'pptxgenjs' ? 'border-accent bg-accent/10 shadow-sm' : 'border-border hover:border-accent/50 bg-background/50'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="radio" 
                name="engine" 
                value="pptxgenjs" 
                checked={engine === 'pptxgenjs'}
                onChange={() => setEngine('pptxgenjs')}
                className="w-4 h-4 text-accent focus:ring-accent accent-accent bg-surface border-border"
              />
              <span className="font-bold text-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                pptxgenjs
              </span>
            </div>
            <p className="text-xs text-text-muted ml-7 leading-relaxed">Agency-grade visual design and layout fidelity.</p>
          </label>

          <label 
            className={`flex flex-col p-5 rounded-xl border transition-all ${!isLocal ? 'opacity-50 cursor-not-allowed bg-background/20 border-border' : 'cursor-pointer hover:scale-[1.02] ' + (engine === 'python-pptx' ? 'border-accent bg-accent/10 shadow-sm' : 'border-border hover:border-accent/50 bg-background/50')}`}
            title={!isLocal ? "Python compilation is only supported in local development environments." : ""}
          >
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="radio" 
                name="engine" 
                value="python-pptx" 
                checked={engine === 'python-pptx'}
                disabled={!isLocal}
                onChange={() => isLocal && setEngine('python-pptx')}
                className="w-4 h-4 text-accent focus:ring-accent accent-accent bg-surface border-border disabled:opacity-50"
              />
              <span className="font-bold text-text flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                python-pptx
                {!isLocal && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-border text-text-muted font-bold tracking-wider uppercase">Local Only</span>}
              </span>
            </div>
            <p className="text-xs text-text-muted ml-7 leading-relaxed">Robust Python compiler for data-heavy decks.</p>
          </label>
        </div>
      </div>

      {/* 4. API Key Configuration */}
      <div className="glass-panel md:col-span-5 flex flex-col gap-6 p-8 bento-item">
        <div className="flex items-center gap-3 mb-2">
          <Key className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-text">
            {provider === 'gemini' ? 'API Authentication' : 'GitHub Token'}
          </h2>
        </div>
        
        <div className="flex flex-col gap-3 flex-grow justify-center">
          <label htmlFor="apiKey" className="text-sm font-semibold text-text-muted">
            {provider === 'gemini' ? 'Google AI Studio API Key' : 'GitHub Personal Access Token'}
          </label>
          <input 
            id="apiKey"
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider === 'gemini' ? 'AIzaSy...' : 'ghp_xxxxxxxxxx...'} 
            className="input-elegant font-mono text-sm tracking-widest"
          />
          <p className="text-xs text-text-muted/70 mt-2 leading-relaxed">
            {provider === 'gemini' 
              ? 'Stored securely in your local browser session. Keys are never transmitted except directly to Google API.' 
              : <span>
                  Steps: <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-accent hover:text-white transition-colors underline font-medium">github.com/settings/tokens</a>
                  <br/>Generate new token (classic) → No scopes needed → Paste here.
                </span>
            }
          </p>
        </div>
      </div>

      {/* 5. Generate CTA */}
      <div className="md:col-span-12 flex flex-col justify-center items-center bento-item mt-6 relative group">
        <div className="absolute inset-0 bg-accent/20 blur-[40px] rounded-full group-hover:bg-accent/40 transition-colors duration-500" />
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !topic || !apiKey}
          className="relative w-full md:w-2/3 lg:w-1/2 py-6 rounded-2xl bg-accent text-white shadow-[0_8px_30px_rgba(199,62,33,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(199,62,33,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-5 border border-accent/20 z-10"
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white border-t-transparent"></div>
          ) : (
            <Sparkles className="w-8 h-8 text-white" />
          )}
          <div className="flex flex-col items-start">
            <span className="text-2xl font-black tracking-tight text-white">
              {isGenerating ? 'Compiling Presentation...' : 'Generate Presentation'}
            </span>
            <span className="text-white/80 text-xs mt-1 font-semibold tracking-wide uppercase">
              Engine: {provider === 'gemini' ? 'Gemini 2.5 Flash' : GITHUB_MODELS.find(m => m.id === githubModel)?.name}
            </span>
          </div>
        </button>
      </div>
      
    </div>
  );
}
