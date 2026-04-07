import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../context/AuthContext';

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const roleColors = {
    builder: 'text-primary bg-primary/5 border-primary/20',
    agent: 'text-blue-500 bg-blue-500/5 border-blue-500/20',
    admin: 'text-charcoal/60 bg-charcoal/5 border-charcoal/20',
    service_user: 'text-primary bg-primary/5 border-primary/20'
  };

  const userName = user?.name || '';


  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-charcoal/5 font-display flex-shrink-0">
      <div className="mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-charcoal/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-charcoal">menu</span>
          </button>

          <Link to="/dashboard" className="lg:hidden no-underline">
            <span className="text-[13px] font-black tracking-tighter uppercase text-charcoal leading-none">
              Lead Portal
            </span>
          </Link>

          <h1 className="hidden lg:block text-[11px] font-black uppercase tracking-[0.2em] text-charcoal/40 m-0">
            {location.pathname.split('/').pop() || 'Dashboard'}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationCenter />

          <div className="flex items-center gap-2 border-l border-charcoal/10 pl-3 sm:pl-4 h-7">
            <div className="flex flex-col items-end justify-center">
              <div className={`mb-0.5 px-1 py-0.5 border font-mono text-[6.5px] font-bold uppercase tracking-widest leading-none ${roleColors[user?.role] || roleColors.admin}`}>
                {user?.role}
              </div>
              <div className="text-[8px] font-black uppercase tracking-tight text-charcoal/80 leading-none">
                {userName}
              </div>
            </div>

            <div className="w-7 h-7 bg-charcoal text-white flex items-center justify-center font-black text-[9px] uppercase">
              {userName ? userName.charAt(0) : 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
