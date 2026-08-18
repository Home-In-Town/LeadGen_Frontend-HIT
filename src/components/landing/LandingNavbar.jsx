import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { APP_NAME, LOGO_PATH, IS_PHASE_1 } from '../../config/phase';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#integrations', label: 'Integrations' },
  { href: '#testimonials', label: 'Customers' },
];

const LandingNavbar = ({ onLogin }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${isDark ? 'bg-[#1C1E21]/95 border-b border-[#3A3B3C]' : 'bg-white/95 border-b border-[#E4E6EB]'} backdrop-blur-lg`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8 lg:px-12">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          {IS_PHASE_1 ? (
            <img src={LOGO_PATH} alt={APP_NAME} className="h-8 w-8 rounded-lg" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0866FF]">
              <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            </div>
          )}
          <span className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#1C1E21]'}`}>
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`px-3.5 py-2 text-[14px] font-medium rounded-lg transition-colors ${isDark ? 'text-[#B0B3B8] hover:text-white hover:bg-white/8' : 'text-[#65676B] hover:text-[#1C1E21] hover:bg-[#F0F2F5]'}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={`hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${isDark ? 'text-[#B0B3B8] hover:bg-white/10 hover:text-white' : 'text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1C1E21]'}`}
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined text-[18px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>

          <button
            type="button"
            onClick={onLogin}
            className={`text-[14px] font-semibold px-4 py-2 rounded-lg transition-colors ${isDark ? 'text-[#B0B3B8] hover:text-white' : 'text-[#1C1E21] hover:bg-[#F0F2F5]'}`}
          >
            Log in
          </button>

          <button
            type="button"
            onClick={onLogin}
            className="text-[14px] font-semibold px-5 py-2 rounded-lg bg-[#0866FF] text-white transition-all hover:bg-[#0654D4] active:scale-[0.98]"
          >
            Get started free
          </button>

          {/* Mobile menu */}
          <button
            type="button"
            className={`inline-flex p-2 rounded-lg md:hidden ${isDark ? 'text-[#B0B3B8]' : 'text-[#65676B]'}`}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="material-symbols-outlined text-[22px]">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className={`border-t px-5 py-4 md:hidden ${isDark ? 'border-[#3A3B3C] bg-[#1C1E21]' : 'border-[#E4E6EB] bg-white'}`}>
          <nav className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-lg text-[14px] font-medium ${isDark ? 'text-[#E4E6EB] hover:bg-white/5' : 'text-[#1C1E21] hover:bg-[#F0F2F5]'}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 pt-3 border-t border-[#E4E6EB] dark:border-[#3A3B3C] flex flex-col gap-2">
              <button onClick={() => { setMobileOpen(false); onLogin(); }}
                className="w-full py-3 rounded-lg text-[14px] font-semibold bg-[#0866FF] text-white">
                Get started free
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
