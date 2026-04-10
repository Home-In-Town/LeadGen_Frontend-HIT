import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    type: 'default'
  });
  
  const isActive = (path) => 
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
    { name: 'CRM', path: '/crm', icon: 'assignment' },
    { name: 'Chat', path: '/chat', icon: 'chat' },
    { name: 'Users', path: '/users', icon: 'person' },
    { name: 'Automation', path: '/lead-automation', icon: 'settings_suggest' },
    { name: 'Integrations', path: '/integrations', icon: 'integration_instructions' },
  ];



  // Handler for direct logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };


  const openConfirmation = (type) => {
    if (type === 'logout') {
      setModalConfig({
        isOpen: true,
        title: 'Sign Out?',
        message: 'Are you sure you want to end your current session?',
        confirmText: 'Logout',
        onConfirm: handleLogout,
        type: 'danger'
      });
    }
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-charcoal/5 flex flex-col z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-20' : 'w-60'}`}>
      
      {/* Brand */}
      <div className={`border-b border-charcoal/5 flex items-center transition-all duration-300 ${isCollapsed ? 'p-0 justify-center h-16 sm:h-20' : 'p-4 sm:p-6 justify-between'}`}>
        {!isCollapsed ? (
          <>
            <Link to="/dashboard" className="no-underline flex items-center gap-2 overflow-hidden">
              <span className="text-base sm:text-lg font-black tracking-tighter uppercase text-charcoal whitespace-nowrap">
                One Employee
              </span>
            </Link>
            <div className="flex gap-2">
              <button 
                onClick={onToggleCollapse}
                className="hidden lg:flex p-2 hover:bg-charcoal/5 transition-colors cursor-pointer text-charcoal/40 hover:text-charcoal"
                title="Minimize Sidebar"
              >
                <span className="material-symbols-outlined text-xl">menu_open</span>
              </button>
              <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-charcoal/5">
                <span className="material-symbols-outlined text-charcoal text-lg">close</span>
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={onToggleCollapse}
            className="p-4 hover:bg-charcoal/5 transition-colors cursor-pointer text-charcoal/40 hover:text-charcoal flex items-center justify-center w-full h-full"
            title="Maximize Sidebar"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 sm:py-8 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <ul className="list-none p-0 m-0 space-y-0.5 sm:space-y-1">
          {menuItems.map((item) => (
            <li key={item.path} onClick={onClose}>
              <Link
                to={item.path}
                className={`flex items-center transition-all duration-300 no-underline whitespace-nowrap group ${isCollapsed ? 'justify-center px-4 py-3 sm:py-4' : 'gap-3 px-5 sm:px-6 py-2.5 sm:py-3.5 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] font-black'} ${
                  isActive(item.path)
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-charcoal/40 hover:text-charcoal/80 hover:bg-charcoal/5'
                }`}
              >
                <span className={`material-symbols-outlined transition-all duration-300 ${isCollapsed ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                   <span className="opacity-100 transition-opacity duration-300 delay-100 uppercase">{item.name}</span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-20 ml-2 px-3 py-1 bg-charcoal text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-xl">
                    {item.name}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`border-t border-charcoal/5 transition-all duration-300 ${isCollapsed ? 'p-1.5 sm:p-2 space-y-1' : 'p-3 sm:p-4 space-y-2'}`}>

        <button
          onClick={() => openConfirmation('logout')}
          className={`w-full flex items-center justify-center transition-all border cursor-pointer hover:bg-red-50 group relative ${isCollapsed ? 'p-2.5 sm:p-3 border-transparent' : 'gap-2.5 px-3 sm:px-4 py-2 sm:py-3 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] font-black text-red-500 border-red-50'}`}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">logout</span>
          {!isCollapsed && <span>Logout</span>}
          {isCollapsed && (
            <div className="absolute left-20 px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Logout
            </div>
          )}
        </button>
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
      />
    </aside>
  );
};

export default Sidebar;
