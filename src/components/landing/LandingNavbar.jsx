import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const navLinks = [
  { href: '#features', label: 'Platform' },
  { href: '#integrations', label: 'Integrations' },
  { href: '#workflow', label: 'Automation' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#testimonials', label: 'Customers' },
];

const LandingNavbar = ({ onLogin }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 border-white/10 bg-[#0F172A]/90`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className={`flex items-center gap-3 font-semibold tracking-tight transition-colors text-white`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#6D28D9] text-white shadow-lg shadow-[#6D28D9]/25">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </span>

          <span className={`text-lg font-bold tracking-tight sm:text-xl text-white`}>
            OneEmployee
          </span>
      </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-[10px] px-3 py-2 text-sm font-medium transition-colors text-white/70 hover:bg-white/10 hover:text-white`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-[10px] transition-colors bg-white/10 text-white/70 hover:bg-white/20 hover:text-white`}
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button
            type="button"
            onClick={onLogin}
            className={`inline-flex rounded-[10px] border px-4 py-2 text-sm font-semibold transition-all border-white/20 bg-white/10 text-white hover:bg-white/20`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="hidden sm:inline-flex rounded-[10px] bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:bg-emerald-400"
          >
            Get started
          </button>
          <button
            type="button"
            className={`inline-flex rounded-[10px] p-2 md:hidden text-white/70`}
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
          className={`border-t px-4 py-4 backdrop-blur-xl md:hidden border-white/10 bg-[#0F172A]/95`}
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile primary">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-[10px] px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white`}
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
              className={`mt-2 rounded-[10px] border px-3 py-3 text-left text-sm font-semibold border-white/20 text-white`}
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
