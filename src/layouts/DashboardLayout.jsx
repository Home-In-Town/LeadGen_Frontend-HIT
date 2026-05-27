import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const THEME_STORAGE_KEY = 'hit-landing-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme] = useState(getInitialTheme);
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#07080c]">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const isDark = theme === 'dark';

  return (
    <div className={`${isDark ? 'dark' : ''} min-h-screen`}>
      <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-[#07080c] dark:text-slate-100 flex font-display overflow-hidden transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 landing-gradient-mesh opacity-20 dark:opacity-35" aria-hidden />
        <div className="pointer-events-none absolute inset-0 landing-grid-bg opacity-15 dark:opacity-30" aria-hidden />

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={toggleSidebar}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        <div className={`relative z-10 flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-60'}`}>
          <Header onMenuClick={toggleSidebar} />
          <main className="flex-1 px-2 pt-2 pb-4 sm:px-4 sm:pt-4 sm:pb-6 md:px-6 md:pt-5 md:pb-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
