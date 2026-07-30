import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { label: 'Home',       icon: 'home',              path: '/dashboard'              },
  { label: 'Facebook',   icon: 'data_exploration',  path: '/integrations/facebook'  },
  { label: 'WhatsApp',   icon: 'chat',              path: '/chat/whatsapp'          },
  { label: 'Voice',      icon: 'call',              path: '/call-logs'              },
];

const MobileBottomNav = () => {
  const location      = useLocation();
  const navigate      = useNavigate();
  const { theme }     = useTheme();
  const isDark        = theme === 'dark';

  const isActive = (path) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 sm:hidden rounded-[22px] transition-colors duration-300"
      style={{
        background: isDark ? '#161B27' : '#FFFFFF',
        border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)'
          : '0 8px 32px rgba(30,27,58,0.12), 0 2px 8px rgba(30,27,58,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 flex-1 py-2 px-1 rounded-[16px] transition-all duration-200 cursor-pointer border-none min-w-0"
              style={{
                background: active
                  ? isDark ? 'rgba(99,102,241,0.20)' : '#EEF2FF'
                  : 'transparent',
                boxShadow: active ? '0 2px 0 0 rgba(99,102,241,0.3)' : 'none',
              }}
              aria-label={item.label}>
              <span className="material-symbols-outlined text-[22px] transition-all duration-150"
                style={{
                  color: active ? '#6366F1' : isDark ? '#4B5563' : '#94A3B8',
                  fontVariationSettings: active ? "'FILL' 1,'wght' 700" : "'FILL' 0,'wght' 400",
                }}>
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold leading-none truncate"
                style={{ color: active ? '#6366F1' : isDark ? '#4B5563' : '#94A3B8', maxWidth: '100%' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
