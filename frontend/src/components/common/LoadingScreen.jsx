import React, { useState, useEffect } from 'react';

const ABRA_EXPEDITION_NOTES = [
  'Mapping 27 municipalities & protected highlands...',
  'Tracing emerald travertine pools of Kaparkan, Tineg...',
  'Connecting with certified local guides & accredited homestays...',
  'Honoring centuries of living Itneg backstrap weaving traditions...',
  'Navigating the scenic riverbanks of the Abra River valley...',
  'Opening your Cordillera digital travel journal...'
];

const LoadingScreen = ({ onFinish, minDuration = 1400 }) => {
  const [noteIndex, setNoteIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(true);

  // Rotate cultural & travel notes
  useEffect(() => {
    const noteInterval = setInterval(() => {
      setNoteIndex((prev) => (prev + 1) % ABRA_EXPEDITION_NOTES.length);
    }, 450);
    return () => clearInterval(noteInterval);
  }, []);

  // Smooth progress animation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 18) + 12;
        return Math.min(prev + increment, 100);
      });
    }, 180);

    return () => clearInterval(progressInterval);
  }, []);

  // Complete and trigger fade-out
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
      setFadeOut(true);
      const unmountTimer = setTimeout(() => {
        setMounted(false);
        if (onFinish) onFinish();
      }, 700); // matches CSS fade duration
      return () => clearTimeout(unmountTimer);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onFinish]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#153325] text-[#FAF7F2] select-none transition-opacity duration-700 ease-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(rgba(184, 139, 42, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Subtle Background Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-[#B88B2A]/10 blur-3xl pointer-events-none" />

      {/* Central Visual Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center animate-fadeIn">

        {/* ── Official Abraventure Crest ── */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-8 flex items-center justify-center">
          {/* Subtle Rotating Compass Ring */}
          <div className="absolute -inset-2 rounded-full border border-[#B88B2A]/40 border-dashed animate-spin" style={{ animationDuration: '32s' }} />

          {/* Official Logo Image */}
          <img
            src="/abraventure-logo.png"
            alt="Abraventure Official Logo"
            className="w-full h-full rounded-full object-cover shadow-2xl border-2 border-[#B88B2A]/60 animate-pulse"
            style={{ animationDuration: '3s' }}
          />
        </div>

        {/* ── Brand Title ── */}
        <div className="space-y-2 mb-6">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-[#D4A942] block">
            Province of Abra · Cordillera
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-[0.18em] text-[#FAF7F2] uppercase">
            ABRAVENTURE
          </h1>
          <p className="font-serif italic text-xs sm:text-sm text-[#F3ECE0]/80">
            The Abra Travel Journal
          </p>
        </div>

        {/* ── Animated Gold Shimmer Progress Bar ── */}
        <div className="w-56 sm:w-64 h-[3px] bg-white/10 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-[#B88B2A] via-[#D4A942] to-[#B88B2A] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ── Rotating Expedition Note ── */}
        <div className="h-8 flex items-center justify-center">
          <p className="text-[11px] sm:text-xs text-[#FAF7F2]/75 font-sans font-normal tracking-wide transition-all duration-300">
            {ABRA_EXPEDITION_NOTES[noteIndex]}
          </p>
        </div>

      </div>

      {/* ── Official Government Masthead Footer ── */}
      <div className="absolute bottom-6 text-center text-[10px] uppercase font-bold tracking-widest text-[#FAF7F2]/40">
        Provincial Tourism Office · 27 Municipalities
      </div>
    </div>
  );
};

export default LoadingScreen;
