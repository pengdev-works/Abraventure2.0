import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'dark'; // Dark mode is primary default
  } catch {
    return 'dark';
  }
};

const resolveTheme = (preference) => {
  if (preference === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
};

// Apply saved theme immediately on script evaluation
const initialPreference = getInitialTheme();
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', resolveTheme(initialPreference));
}

const DarkModeToggle = ({ className = '' }) => {
  const [themeMode, setThemeMode] = useState(initialPreference);

  useEffect(() => {
    const applyTheme = () => {
      const active = resolveTheme(themeMode);
      document.documentElement.setAttribute('data-theme', active);
    };

    applyTheme();
    try {
      localStorage.setItem('theme', themeMode);
    } catch {}

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [themeMode]);

  // Cycle: dark -> light -> system -> dark
  const handleCycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  return (
    <button
      type="button"
      onClick={handleCycleTheme}
      title={`Current: ${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} Mode (Click to switch)`}
      aria-label={`Current theme: ${themeMode}. Click to toggle.`}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none text-xs font-semibold backdrop-blur-sm ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-app)',
        color: 'var(--text-primary)',
      }}
    >
      {themeMode === 'dark' && (
        <>
          <Moon className="w-3.5 h-3.5 text-[var(--color-gold)] fill-[var(--color-gold)]/20" />
          <span className="font-bold tracking-wide">Dark</span>
        </>
      )}
      {themeMode === 'light' && (
        <>
          <Sun className="w-3.5 h-3.5 text-[var(--color-gold)] fill-[var(--color-gold)]/20" />
          <span className="font-bold tracking-wide">Light</span>
        </>
      )}
      {themeMode === 'system' && (
        <>
          <Monitor className="w-3.5 h-3.5 text-[var(--color-gold)]" />
          <span className="font-bold tracking-wide">Auto</span>
        </>
      )}
    </button>
  );
};

export { DarkModeToggle };
export default DarkModeToggle;
