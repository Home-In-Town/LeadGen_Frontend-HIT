import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = ({ showNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const roleColors = {
    builder: 'text-primary bg-primary/5 border-primary/20',
    agent: 'text-blue-500 bg-blue-500/5 border-blue-500/20',
    admin: 'text-charcoal/60 bg-charcoal/5 border-charcoal/20'
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('currentUser');
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-charcoal/10 font-display">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <div className="shrink-0">
          <Link to={showNav ? "/dashboard" : "/"} className="flex items-center gap-2 no-underline group">
            <span className="text-lg sm:text-xl font-black tracking-tighter uppercase text-charcoal group-hover:text-primary transition-colors">
              One Employee
            </span>
          </Link>
        </div>
        
        {showNav ? (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <ul className="flex items-center gap-6 list-none p-0 m-0">
                <li>
                  <Link 
                    to="/dashboard" 
                    className={`uppercase tracking-widest text-[10px] sm:text-[11px] font-black transition-all pb-1 border-b-2 ${isActive('/dashboard') ? 'text-primary border-primary' : 'text-charcoal/40 border-transparent hover:text-charcoal'}`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/history" 
                    className={`uppercase tracking-widest text-[10px] sm:text-[11px] font-black transition-all pb-1 border-b-2 ${isActive('/history') ? 'text-primary border-primary' : 'text-charcoal/40 border-transparent hover:text-charcoal'}`}
                  >
                    History
                  </Link>
                </li>
              </ul>

              <div className="flex items-center gap-4 sm:gap-6 border-l border-charcoal/10 pl-6 h-8 ml-4">
                <div className="text-right hidden sm:block">
                  <div className="text-[8px] font-black uppercase tracking-widest text-charcoal/30 leading-none mb-1">
                    Identified User
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-tight text-charcoal leading-none">
                    {user.name || 'System User'}
                  </div>
                </div>
                <div className={`px-2 py-1 border font-mono text-[8px] font-bold uppercase tracking-widest leading-none ${roleColors[user.role] || roleColors.admin}`}>
                  {user.role}
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-white border border-charcoal/20 px-3 py-1.5 font-black uppercase tracking-widest text-[9px] text-charcoal/60 hover:bg-charcoal hover:text-white cursor-pointer transition-all"
                >
                  Logout
                </button>
              </div>
            </nav>

            {/* Mobile/Tablet Menu Button */}
            <div className="lg:hidden flex items-center gap-4">
               <div className={`px-2 py-1 border font-mono text-[8px] font-bold uppercase tracking-widest leading-none ${roleColors[user.role] || roleColors.admin}`}>
                  {user.role}
               </div>
               <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 hover:bg-surface-subtle transition-colors cursor-pointer"
               >
                 <span className="material-symbols-outlined text-charcoal text-2xl">
                   {isMenuOpen ? 'close' : 'menu'}
                 </span>
               </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-primary"></span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-charcoal/40 ml-1">System Live</span>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      {showNav && isMenuOpen && (
        <div className="lg:hidden border-t border-charcoal/5 bg-white bg-opacity-95 backdrop-blur-sm animate-fade-in divide-y divide-charcoal/5">
          <nav className="flex flex-col p-4">
            <Link 
              to="/dashboard" 
              onClick={() => setIsMenuOpen(false)}
              className={`py-3 uppercase tracking-widest text-[11px] font-black transition-all ${isActive('/dashboard') ? 'text-primary' : 'text-charcoal/60'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/history" 
              onClick={() => setIsMenuOpen(false)}
              className={`py-3 uppercase tracking-widest text-[11px] font-black transition-all ${isActive('/history') ? 'text-primary' : 'text-charcoal/60'}`}
            >
              History
            </Link>
          </nav>
          
          <div className="p-4 bg-surface-subtle/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[8px] font-black uppercase tracking-widest text-charcoal/30 leading-none mb-1">
                  Active Identification
                </div>
                <div className="text-[11px] font-black uppercase tracking-tight text-charcoal leading-none">
                  {user.name || 'System User'}
                </div>
              </div>
              <div className={`px-2 py-1 border font-mono text-[8px] font-bold uppercase tracking-widest leading-none ${roleColors[user.role] || roleColors.admin}`}>
                {user.role}
              </div>
            </div>
            
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="w-full bg-charcoal text-white py-3 font-black uppercase tracking-widest text-[10px] border-2 border-charcoal hover:bg-primary transition-all cursor-pointer"
            >
              Terminate Session (Logout)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
