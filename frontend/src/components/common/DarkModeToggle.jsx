import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

// Apply saved theme immediately (runs once on import, before React)
const savedTheme = (() => {
  try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
})();
document.documentElement.setAttribute('data-theme', savedTheme);

const DarkModeToggle = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(savedTheme === 'dark');

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch {}
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark(d => !d)}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none text-xs font-semibold ${className}`}
      style={{
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(21,51,37,0.06)',
        borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(21,51,37,0.18)',
        color: isDark ? '#E2EDE5' : '#153325',
      }}
    >
      {isDark ? (
        <>
          <Moon className="w-3.5 h-3.5 text-[#B88B2A] fill-[#B88B2A]/20" />
          <span className="font-bold tracking-wide">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-[#B88B2A] fill-[#B88B2A]/20" />
          <span className="font-bold tracking-wide">Light</span>
        </>
      )}
    </button>
  );
};

export { DarkModeToggle };
export default DarkModeToggle;
