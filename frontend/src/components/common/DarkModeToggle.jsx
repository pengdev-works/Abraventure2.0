import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const getStoredTheme = () => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return getSystemTheme();
};

// Immediate execution during bundle evaluation
if (typeof document !== 'undefined') {
  const current = getStoredTheme();
  document.documentElement.setAttribute('data-theme', current);
  if (current === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

const DarkModeToggle = ({ className = '', showLabel = true }) => {
  const [theme, setTheme] = useState(getStoredTheme);

  const applyTheme = (nextTheme) => {
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', nextTheme);
    } catch {}
    setTheme(nextTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  // Sync with OS preference changes if the user hasn't saved an explicit preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      const hasManualChoice = !!localStorage.getItem('theme');
      if (!hasManualChoice) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }
  }, []);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none text-xs font-semibold shadow-2xs hover:shadow-xs active:scale-95 ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-app)',
        color: 'var(--text-primary)',
      }}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-[var(--color-gold)] transition-transform duration-300 rotate-0 hover:rotate-45" />
          {showLabel && <span className="font-medium tracking-wide">Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-[var(--color-gold)] transition-transform duration-300" />
          {showLabel && <span className="font-medium tracking-wide">Dark</span>}
        </>
      )}
    </button>
  );
};

export { DarkModeToggle };
export default DarkModeToggle;
