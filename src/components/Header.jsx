import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const roleColors = {
    builder: 'text-primary bg-primary/5 border-primary/20',
    agent: 'text-blue-500 bg-blue-500/5 border-blue-500/20',
    admin: 'text-charcoal/60 bg-charcoal/5 border-charcoal/20'
  };
  
  const userName = user.name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '');

  const handleLogout = () => {
    if (confirm('Exit to Sales Dashboard? This will end your session here.')) {
      localStorage.removeItem('currentUser');
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const redirectUrl = isLocal 
        ? 'http://localhost:3000/dashboard' 
        : 'https://www.homeintown.in/dashboard';
      window.location.href = redirectUrl;
    }
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-charcoal/5 font-display flex-shrink-0">
      <div className="mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-charcoal/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-charcoal">menu</span>
          </button>
          
          <Link to="/dashboard" className="lg:hidden no-underline">
            <span className="text-sm font-black tracking-tighter uppercase text-charcoal">
              One Employee
            </span>
          </Link>

          <h1 className="hidden lg:block text-[11px] font-black uppercase tracking-[0.2em] text-charcoal/40 m-0">
            {location.pathname.split('/').pop() || 'Dashboard'}
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <NotificationCenter />
          
          <div className="flex items-center gap-3 border-l border-charcoal/10 pl-6 h-8">
            <div className="flex flex-col items-end justify-center">
              <div className={`mb-0.5 px-1.5 py-0.5 border font-mono text-[7px] font-bold uppercase tracking-widest leading-none ${roleColors[user.role] || roleColors.admin}`}>
                {user.role}
              </div>
              <div className="text-[9px] font-black uppercase tracking-tight text-charcoal/80 leading-none">
                {userName}
              </div>
            </div>
            
            <div className="w-8 h-8 bg-charcoal text-white flex items-center justify-center font-black text-[10px] uppercase">
              {userName ? userName.charAt(0) : 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
