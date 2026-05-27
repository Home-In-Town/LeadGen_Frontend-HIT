import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../context/AuthContext';

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();

  const roleColors = {
    builder: 'text-primary bg-primary/10 border-primary/25',
    agent: 'text-blue-500 bg-blue-500/10 border-blue-500/25',
    admin: 'text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-white/5 border-slate-300/60 dark:border-white/15',
    service_user: 'text-primary bg-primary/10 border-primary/25'
  };

  const userName = user?.name || '';
  const currentSection = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';

  const THEME_STORAGE_KEY = 'hit-landing-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';

  const saved = localStorage.getItem(THEME_STORAGE_KEY);

  if (saved === 'dark' || saved === 'light') {
    return saved;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const [theme, setTheme] = useState(getInitialTheme);

useEffect(() => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}, [theme]);

const toggleTheme = () => {
  setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
};


  return (
    <header className="sticky top-0 z-40 bg-white/65 dark:bg-slate-950/45 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 font-display flex-shrink-0 transition-colors duration-300">
      <div className="mx-auto w-full px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-slate-700 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <Link to="/dashboard" className="lg:hidden no-underline flex items-center gap-2">
            <img
              src="/vite.svg"
              alt="OneEmployee Logo"
              className="h-10 w-10 object-contain"
            />
            <span className="text-[12px] font-black tracking-tight uppercase text-slate-900 dark:text-white leading-none">
              One Employee
            </span>
          </Link>

          <div className="hidden lg:flex flex-col min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 m-0">
              Workspace
            </p>
            <h1 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white capitalize m-0 truncate">
              {currentSection.replace(/-/g, ' ')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="
              relative
              inline-flex
              items-center
              justify-center
              h-10
              w-10
              rounded-[12px]
              border
              border-slate-200/80
              dark:border-white/10
              bg-white/75
              dark:bg-white/[0.04]
              backdrop-blur-sm
              shadow-sm
              text-slate-700
              dark:text-slate-200
              hover:text-primary
              hover:bg-slate-100
              dark:hover:bg-white/10
              transition-all
              duration-300
              cursor-pointer
              group
            "
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            <span 
              className="
                material-symbols-outlined
                text-[20px]
                transition-transform
                duration-300
                group-hover:rotate-12
              "
            >
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
        </button>
        
          <div className="bg-transparent border-none shadow-none p-0">
            <NotificationCenter />
          </div>

          <div className="flex items-center gap-2 rounded-[12px] border border-slate-200/80 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] pl-2 pr-2.5 py-1.5 backdrop-blur-sm shadow-sm">
            <div className="flex flex-col items-end justify-center leading-none">
              <div className={`mb-1 px-1.5 py-0.5 border rounded-full font-mono text-[7px] font-bold uppercase tracking-widest ${roleColors[user?.role] || roleColors.admin}`}>
                {user?.role}
              </div>
              <div className="text-[9px] font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                {userName}
              </div>
            </div>

            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 flex items-center justify-center font-black text-[10px] uppercase shadow-sm">
              {userName ? userName.charAt(0) : 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
