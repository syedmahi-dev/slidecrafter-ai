import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Presentation } from 'lucide-react';
import { ConfigurationPanel, type GenerateConfig } from './components/ConfigurationPanel';
import { PreviewPane } from './components/PreviewPane';
import { LoadingOverlay } from './components/LoadingOverlay';
import { generateSlideContent } from './lib/gemini';
import { generateSlideContentGitHub } from './lib/github-models';
import { buildPresentationBrowser } from './lib/engine-js';

gsap.registerPlugin(useGSAP);

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinearProgress({ percent, status }: { percent: number; status: string }) {
  const fillWidth = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full flex flex-col items-center gap-6 py-6 px-4">
      <div className="w-full max-w-md relative">
        <div className="flex justify-between items-end mb-3">
          <span className="text-sm font-semibold text-text">{status}</span>
          <span className="text-xl font-black text-accent">{Math.round(percent)}%</span>
        </div>
        
        {/* Progress Track */}
        <div className="h-2 w-full bg-surface border border-border rounded-full overflow-hidden shadow-inner relative">
          {/* Progress Fill */}
          <div 
            className="h-full bg-accent rounded-full relative"
            style={{ 
              width: `${fillWidth}%`, 
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 10px var(--color-accent-glow)' 
            }}
          >
            {/* Subtle shimmering highlight */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>
      <p className="text-xs text-text-muted">Engineering your presentation architecture...</p>
    </div>
  );
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [slideData, setSlideData] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<string>('pptxgenjs');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState({ percent: 0, status: '' });

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.hero-content', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' })
      .from('.bento-item', { y: 40, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)' }, '-=0.4');
  }, { scope: containerRef });

  const handleGenerate = async (config: GenerateConfig) => {
    setIsGenerating(true);
    setSlideData(null);
    setErrorMsg(null);
    setSelectedEngine(config.engine);
    setProgress({ percent: 5, status: 'Connecting to AI...' });

    try {
      setProgress({ percent: 15, status: 'Generating slide content...' });

      let data;
      if (config.provider === 'github') {
        data = await generateSlideContentGitHub(config.apiKey, config.topic, config.slides, config.githubModel);
      } else {
        data = await generateSlideContent(config.apiKey, config.topic, config.slides);
      }

      setProgress({ percent: 50, status: 'AI content received!' });

      if (!data || !Array.isArray(data.slides)) {
        throw new Error("AI returned invalid data (slides is not an array). Try generating again.");
      }

      // Simulate image preparation progress
      const totalSlides = data.slides.length;
      for (let i = 0; i < totalSlides; i++) {
        setProgress({
          percent: 50 + Math.round((i / totalSlides) * 40),
          status: `Preparing slide ${i + 1} of ${totalSlides}...`,
        });
        // Small delay for visual feedback
        await new Promise(r => setTimeout(r, 100));
      }

      setProgress({ percent: 95, status: 'Finalizing presentation...' });
      setSlideData(data);

      setProgress({ percent: 100, status: 'Done!' });

      // Animate the preview pane appearing
      setTimeout(() => {
        gsap.from('.slide-preview-container', { y: 50, opacity: 0, duration: 0.6, ease: 'power3.out' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during generation.');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress({ percent: 0, status: '' });
      }, 600);
    }
  };

  const handleDownload = async () => {
    if (!slideData) return;
    setIsDownloading(true);
    setErrorMsg(null);

    try {
      if (selectedEngine === 'pptxgenjs') {
        await buildPresentationBrowser(slideData, slideData.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'presentation');
      } else {
        const response = await fetch('/api/build-python', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slideData)
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Python build failed');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (slideData.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'presentation') + '.pptx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during download.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen p-6 md:p-12 lg:p-24 flex flex-col bg-background text-text selection:bg-accent selection:text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <header className="hero-content flex items-center justify-between w-full max-w-5xl mx-auto mb-16 relative z-10">
        <div className="flex items-center gap-4">
          <div className="bg-surface p-3 rounded-xl border border-white/5 shadow-xl text-accent relative group overflow-hidden">
            <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Presentation className="w-8 h-8 relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">SlideCrafter <span className="text-accent">AI</span></h1>
            <p className="text-sm font-medium text-text-muted uppercase tracking-widest text-[10px] mt-1">Agency-Grade Generation Engine</p>
          </div>
        </div>

        <a 
          href="https://github.com/syedmahi-dev/slidecrafter-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-gray-50 text-text hover:text-accent rounded-xl border border-border shadow-md transition-all duration-300 group"
          title="View GitHub Repository"
        >
          <GithubIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-xs font-semibold hidden sm:inline">Open Source</span>
        </a>
      </header>

      <main className="flex-grow flex flex-col w-full items-center relative z-10">
        <div className="hero-content text-center max-w-3xl mb-8">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">
            Generate presentations that <br/><span className="text-accent bg-none bg-transparent drop-shadow-[0_4px_15px_rgba(199,62,33,0.3)]">command the room.</span>
          </h2>
          <p className="text-lg text-text-muted font-medium max-w-2xl mx-auto leading-relaxed">
            Stop making boring slides. Describe your topic and our AI will architect an elegant, agency-quality deck in seconds.
          </p>
        </div>

        <ConfigurationPanel onGenerate={handleGenerate} isGenerating={isGenerating} />

        {/* Progress Loading Animation */}
        {isGenerating && (
          <div className="w-full max-w-5xl mx-auto mt-8 mb-4">
            <LoadingOverlay progress={progress.percent} />
          </div>
        )}

        {errorMsg && (
          <div className="w-full max-w-5xl mx-auto mt-4 p-4 bg-red-100 text-red-700 rounded-xl border border-red-300 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        <PreviewPane slideData={slideData} onDownload={handleDownload} isDownloading={isDownloading} engine={selectedEngine} />
      </main>
      
      <footer className="hero-content w-full max-w-5xl mx-auto mt-24 mb-8 text-center text-sm font-medium text-text-muted">
        Built by <a href="https://github.com/syedmahi-dev/slidecrafter-ai" target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:underline">syedmahi-dev</a>
      </footer>
    </div>
  );
}

export default App;
