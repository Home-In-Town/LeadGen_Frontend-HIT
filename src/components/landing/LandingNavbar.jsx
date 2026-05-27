import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { href: '#features', label: 'Platform' },
  { href: '#integrations', label: 'Integrations' },
  { href: '#workflow', label: 'Automation' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#testimonials', label: 'Customers' },
];

const LandingNavbar = ({ theme, onThemeChange, onLogin }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/75 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 font-semibold tracking-tight text-slate-900 transition-colors dark:text-white"
        >
          <img
            src="/vite.svg"
            alt="OneEmployee Logo"
            className="h-10 w-10 object-contain"
          />

          <span className="text-lg font-bold tracking-tight sm:text-xl">
            OneEmployee
          </span>
      </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-[10px] px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          <button
            type="button"
            onClick={onLogin}
            className="hidden rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30"
          >
            Get started
          </button>
          <button
            type="button"
            className="inline-flex rounded-[10px] p-2 text-slate-600 md:hidden dark:text-slate-300"
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
          
        </div>
        
      </div>

      {mobileOpen ? (
        <div
          id="landing-mobile-nav"
          className="border-t border-slate-200/60 bg-white/95 px-4 py-4 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/95"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile primary">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-[10px] px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onLogin();
              }}
              className="mt-2 rounded-[10px] border border-slate-200 px-3 py-3 text-left text-sm font-semibold text-slate-800 dark:border-white/10 dark:text-white"
            >
              Sign in
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
};

export default LandingNavbar;
