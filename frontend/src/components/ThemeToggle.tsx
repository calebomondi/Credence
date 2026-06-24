'use client';

import { useTheme } from '@/lib/theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full cursor-pointer border border-default flex items-center justify-center hover:bg-[var(--alpha-5)] transition-colors shrink-0"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
          <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 0v2M8 14v2M0 8h2M14 8h2M2.34 2.34l1.41 1.41M12.25 12.25l1.41 1.41M2.34 13.66l1.41-1.41M12.25 3.75l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
          <path d="M13 8.5A6 6 0 0 1 7.5 3c0-1.2.35-2.3.95-3.2A7 7 0 1 0 16.2 9.45c-.9.6-2 .95-3.2.95z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
