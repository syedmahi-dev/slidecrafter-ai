import React, { useEffect, useState } from 'react';
import { Check, LayoutTemplate, Palette, Download } from 'lucide-react';

interface LoadingOverlayProps {
  progress: number;
}

const stages = [
  { progressTrigger: 0, statusText: "Generating your presentation…", subText: "Crafting slides with AI magic", active: 1, done: [0] },
  { progressTrigger: 40, statusText: "Applying themes & visuals…", subText: "Choosing fonts and colors", active: 2, done: [0, 1] },
  { progressTrigger: 80, statusText: "Finalizing animations…", subText: "Almost there!", active: 3, done: [0, 1, 2] },
];

export function LoadingOverlay({ progress }: LoadingOverlayProps) {
  const [currentStage, setCurrentStage] = useState(stages[0]);

  useEffect(() => {
    // Find the highest stage that the current progress has passed
    const stage = [...stages].reverse().find(s => progress >= s.progressTrigger);
    if (stage) {
      setCurrentStage(stage);
    }
  }, [progress]);

  const icons = [Check, LayoutTemplate, Palette, Download];
  const labels = ['Outline', 'Slides', 'Styling', 'Export'];

  return (
    <div className="w-full flex items-center justify-center py-8">
      <div className="stage w-full max-w-2xl mx-auto rounded-3xl border border-border bg-surface/50 shadow-xl overflow-hidden relative">
        <div className="bg-grid"></div>

        <div className="particle p1"></div>
        <div className="particle p2"></div>
        <div className="particle p3"></div>
        <div className="particle p4"></div>
        <div className="particle p5"></div>
        <div className="particle p6"></div>

        <div className="brand text-accent">SlideCraft AI</div>

        <div className="slide-stack">
          <div className="slide slide-3 bg-accent/10 border-accent/20"></div>
          <div className="slide slide-2 bg-accent/20 border-accent/30"></div>
          <div className="slide slide-1 bg-accent border-accent shadow-xl">
            <div className="slide-line"></div>
            <div className="slide-line"></div>
            <div className="slide-line"></div>
            <div className="slide-line"></div>
            <div className="dot-row">
              <div className="dot active"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </div>

        <div className="status-text">{currentStage.statusText}</div>
        <div className="sub-text">{currentStage.subText}</div>

        <div className="progress-track">
          <div className="progress-bar bg-accent" style={{ width: `${Math.max(5, progress)}%`, animation: 'none', transition: 'width 0.8s ease-out' }}></div>
        </div>

        <div className="steps">
          {labels.map((label, i) => {
            const isDone = currentStage.done.includes(i);
            const isActive = currentStage.active === i;
            const statusClass = isDone ? 'done' : isActive ? 'active' : 'pending';
            const Icon = isDone ? Check : icons[i];

            return (
              <div key={i} className={`step ${statusClass}`}>
                <div className={`step-icon ${statusClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="step-label">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
