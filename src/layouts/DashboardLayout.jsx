import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileBottomNav from '../components/MobileBottomNav';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed]     = useState(false);
  const { status }                         = useAuth();
  const { theme }                          = useTheme();
  const isDark = theme === 'dark';

  if (status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#18191A]' : 'bg-white'}`}>
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl animate-spin" style={{ color: '#0866FF' }}>
            progress_activity
          </span>
          <p className="text-sm font-medium" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar  = () => setIsSidebarOpen(o => !o);
  const toggleCollapse = () => setIsCollapsed(c => !c);

  return (
    <div className={isDark ? 'dark' : ''}>
      <div
        className="relative min-h-screen flex font-display overflow-hidden transition-colors duration-300"
        style={{ background: isDark ? '#18191A' : '#F0F2F5', color: isDark ? '#E4E6EB' : '#1C1E21' }}
      >
        {/* sidebar backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
            onClick={toggleSidebar}
          />
        )}

        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar}
          isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />

        <div className={`relative z-10 flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-60'}`}>
          <Header onMenuClick={toggleSidebar} />
          <main className="flex-1 px-3 pt-4 pb-28 sm:px-5 sm:pt-5 sm:pb-8 md:px-7 overflow-auto">
            <div className="max-w-2xl mx-auto sm:max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
};

export default DashboardLayout;
