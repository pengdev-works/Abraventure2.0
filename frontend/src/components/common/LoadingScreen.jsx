import React, { useState, useEffect } from 'react';

const ABRA_EXPEDITION_NOTES = [
  'Mapping 27 municipalities & protected Cordillera highlands...',
  'Tracing emerald travertine pools of Kaparkan, Tineg...',
  'Connecting with certified local guides & accredited homestays...',
  'Honoring centuries of living Itneg backstrap weaving traditions...',
  'Navigating the scenic riverbanks of the Abra River valley...',
  'Opening your Cordillera digital travel journal...'
];

const LoadingScreen = ({ onFinish, minDuration = 1800 }) => {
  const [noteIndex, setNoteIndex] = useState(0);
  const [progress, setProgress] = useState(18);
  const [isReady, setIsReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(true);

  // Rotate expedition notes
  useEffect(() => {
    const noteInterval = setInterval(() => {
      setNoteIndex((prev) => (prev + 1) % ABRA_EXPEDITION_NOTES.length);
    }, 450);
    return () => clearInterval(noteInterval);
  }, []);

  // Smooth progress calculation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 15) + 10;
        return Math.min(prev + increment, 100);
      });
    }, 140);

    return () => clearInterval(progressInterval);
  }, []);

  // Climax sequence when loading finishes, then transition to homepage
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setProgress(100);
      setIsReady(true);

      // Trigger homepage reveal animation after climax display
      const revealTimer = setTimeout(() => {
        setFadeOut(true);
        const unmountTimer = setTimeout(() => {
          setMounted(false);
          if (onFinish) onFinish();
        }, 750); // Matches CSS dissolve duration
        return () => clearTimeout(unmountTimer);
      }, 700); // Climax pulse & ready state duration before dissolving

      return () => clearTimeout(revealTimer);
    }, minDuration);

    return () => clearTimeout(minTimer);
  }, [minDuration, onFinish]);

  const handleSkip = () => {
    setIsReady(true);
    setFadeOut(true);
    setTimeout(() => {
      setMounted(false);
      if (onFinish) onFinish();
    }, 300);
  };

  if (!mounted) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#071912] text-[var(--color-cream-100)] select-none transition-all duration-750 ease-out cursor-pointer ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: 'radial-gradient(rgba(201, 154, 46, 0.12) 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
      }}
      title="Click anywhere to skip directly to home"
    >
      {/* Dynamic Ambient Glow Behind Logo */}
      <div
        className={`absolute w-[520px] h-[360px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isReady
            ? 'bg-gradient-to-r from-[var(--color-gold-500)]/30 via-emerald-400/25 to-[var(--color-gold-500)]/30 scale-125'
            : 'bg-[var(--color-gold-500)]/15 scale-100 animate-pulse-aura'
        }`}
      />

      {/* Ripple Wave on Finish */}
      {isReady && (
        <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-[var(--color-gold)]/60 animate-portal-expand pointer-events-none" />
      )}

      {/* Central Visual Container */}
      <div
        className={`relative z-10 flex flex-col items-center max-w-xl px-6 text-center transition-all duration-700 ease-out ${
          isReady ? 'transform -translate-y-2' : ''
        }`}
      >
        {/* Top Tagline */}
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-[var(--color-gold)]/30 backdrop-blur-xs text-[10px] sm:text-xs font-sans font-bold tracking-[0.25em] text-[var(--color-gold-400)] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-ping" />
          <span>Province of Abra · Cordillera</span>
        </div>

        {/* ── Official Abraventure Logo Hero Reveal ── */}
        <div className="relative w-full max-w-[340px] sm:max-w-[460px] md:max-w-[500px] my-2 group">
          {/* Subtle Golden Sheen Light Sweep across the landscape & wordmark */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-20">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-logo-glint" />
          </div>

          {/* Latest Abraventure Logo Image */}
          <img
            src="/abraventure-logo.png"
            alt="Abraventure Official Logo with Province Seal and Mountain Landscape"
            className={`w-full h-auto object-contain filter transition-all duration-500 ${
              isReady
                ? 'drop-shadow-[0_16px_36px_rgba(201,154,46,0.45)] scale-[1.03]'
                : 'drop-shadow-[0_12px_28px_rgba(0,0,0,0.65)] hover:scale-102'
            }`}
          />
        </div>

        {/* Subtitle / Department Descriptor */}
        <p className="font-serif italic text-xs sm:text-sm text-[var(--color-cream-300)]/85 mt-2 mb-6 tracking-wide">
          Official Digital Tourism Platform · The Abra Travel Journal
        </p>

        {/* ── Animated Gold-Emerald Progress Bar & Percentage ── */}
        <div className="w-64 sm:w-80 flex flex-col items-center gap-2 mb-4">
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-[var(--color-gold-300)] font-semibold px-1">
            <span className="uppercase tracking-widest text-[9px] text-[var(--color-cream-200)]/60">
              {isReady ? 'Synchronized' : 'Exploring'}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="w-full h-[4px] bg-white/10 rounded-full overflow-hidden p-[1px] relative">
            <div
              className={`h-full rounded-full transition-all duration-200 ease-out ${
                isReady
                  ? 'bg-gradient-to-r from-[var(--color-gold-400)] via-white to-[var(--color-gold-400)] shadow-[0_0_14px_#E0B94F]'
                  : 'bg-gradient-to-r from-[var(--color-forest-500)] via-[var(--color-gold-400)] to-[var(--color-gold-300)] shadow-[0_0_8px_rgba(201,154,46,0.5)]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Status / Rotating Expedition Note / Ready Badge ── */}
        <div className="min-h-9 flex items-center justify-center">
          {isReady ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-gold)]/20 border border-[var(--color-gold)] text-[var(--color-gold-300)] font-sans font-bold text-xs uppercase tracking-widest animate-fadeInScale shadow-[0_0_20px_rgba(201,154,46,0.3)]">
              <span>✦ Welcome to Abra · Entering Platform ✦</span>
            </div>
          ) : (
            <p className="text-[11px] sm:text-xs text-[var(--color-cream-200)]/80 font-sans tracking-wide transition-all duration-300">
              {ABRA_EXPEDITION_NOTES[noteIndex]}
            </p>
          )}
        </div>

        {/* Skip hint */}
        <span className="text-[9px] text-[var(--color-cream-200)]/35 tracking-widest uppercase mt-3 hover:text-[var(--color-gold)] transition-colors">
          Tap anywhere to continue
        </span>
      </div>

      {/* ── Official Government Masthead Footer ── */}
      <div className="absolute bottom-5 text-center px-4">
        <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-cream-200)]/45">
          Republic of the Philippines · Provincial Tourism Office · 27 Municipalities
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
