import React from 'react';

/**
 * Toggle between light and dark landing themes.
 * Parent owns state and wraps content with `.dark` when theme === 'dark'.
 */
const ThemeToggle = ({ theme, onChange }) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-primary/50 dark:hover:text-primary"
    >
      <span className="material-symbols-outlined text-[22px] transition-transform duration-300 group-hover:rotate-12">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
