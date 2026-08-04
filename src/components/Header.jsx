import { Link, useNavigate } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME, APP_TAGLINE, LOGO_PATH, BRAND_GRADIENT, IS_PHASE_1 } from '../config/phase';

const Header = ({ onMenuClick }) => {
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark            = theme === 'dark';
  const userName          = user?.name || '';
  const initial           = userName.charAt(0).toUpperCase() || 'U';

  const C = {
    bg:        isDark ? '#161B27'  : '#FFFFFF',
    border:    isDark ? '#2D3748'  : '#E2E8F0',
    icon:      isDark ? '#94A3B8'  : '#64748B',
    iconHover: isDark ? '#E2E8F0'  : '#1E1B3A',
    iconBg:    isDark ? '#1E2A3A'  : '#F0F2F8',
    text:      isDark ? '#E2E8F0'  : '#1E1B3A',
    divider:   isDark ? '#2D3748'  : '#E2E8F0',
    btnBg:     isDark ? '#252F40'  : '#F0F2F8',
  };

  return (
    <header className="sticky top-0 z-40 flex-shrink-0 transition-colors duration-300"
      style={{ background: C.bg, borderBottom: `1px solid ${C.border}`,
               boxShadow: isDark ? '0 1px 0 #2D3748' : '0 1px 0 #E2E8F0, 0 2px 8px rgba(30,27,58,0.04)' }}>
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 gap-3">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-[10px] transition-all cursor-pointer border-none"
            style={{ background: C.btnBg, color: C.icon }}
            onMouseEnter={e => { e.currentTarget.style.color = C.iconHover; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.icon; }}
            aria-label="Toggle sidebar">
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          <Link to="/dashboard" className="no-underline flex items-center gap-2.5">
            {IS_PHASE_1 ? (
              <img src={LOGO_PATH} alt={APP_NAME} className="w-8 h-8 rounded-[10px]" />
            ) : (
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
                <span className="material-symbols-outlined text-white text-[17px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
              </div>
            )}
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[14px] font-black tracking-tight" style={{ color: C.text }}>
                {IS_PHASE_1 ? (
                  <><span style={{ color: '#F47B20' }}>WebMagnet</span>Media</>
                ) : (
                  <>One<span style={{ color: '#6366F1' }}>Employee</span></>
                )}
              </span>
              <span className="text-[10px] font-medium" style={{ color: C.icon }}>{APP_TAGLINE}</span>
            </div>
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1.5">

          {/* theme toggle */}
          <button onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-[10px] cursor-pointer border-none transition-all"
            style={{ background: C.btnBg, color: C.icon }}
            onMouseEnter={e => { e.currentTarget.style.color = '#6366F1'; e.currentTarget.style.background = isDark ? '#2D3A55' : '#EEF2FF'; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.icon;   e.currentTarget.style.background = C.btnBg; }}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <span className="material-symbols-outlined text-[19px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* notification */}
          <div className="flex items-center justify-center w-9 h-9 rounded-[10px] relative"
            style={{ background: C.btnBg }}>
            <NotificationCenter />
          </div>

          {/* divider */}
          <div className="w-px h-5 mx-1" style={{ background: C.divider }} />

          {/* profile */}
          <button onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-2 py-1 rounded-[10px] cursor-pointer border-none transition-all"
            style={{ background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = C.btnBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Profile">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] text-white flex-shrink-0"
              style={{ background: BRAND_GRADIENT }}>
              {initial}
            </div>
            <span className="hidden sm:block text-[13px] font-semibold max-w-[90px] truncate" style={{ color: C.text }}>
              {userName}
            </span>
            <span className="material-symbols-outlined text-[15px]" style={{ color: C.icon }}>expand_more</span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;
