import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import IntegrationSelectorModal from './IntegrationSelectorModal';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const hitLinked = user?.hitLinked || false;
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    type: 'default'
  });
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // All groups expanded by default
    return { DASHBOARD: true, 'LEAD MANAGEMENT': true, COMMUNICATION: true, AUTOMATION: true };
  });
  const [expandedItems, setExpandedItems] = useState({});

  const toggleGroup = (label) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleItem = (path) => {
    setExpandedItems(prev => ({ ...prev, [path]: !prev[path] }));
  };
  
  const isActive = (path) => 
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  const menuGroups = [
    {
      label: 'DASHBOARD',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
      ],
    },
    {
      label: 'LEAD MANAGEMENT',
      items: [
        { name: 'CRM', path: '/crm', icon: 'assignment' },
        { name: 'Users', path: '/users', icon: 'group' },
        ...(hitLinked
          ? [{ name: 'Projects', path: '/projects', icon: 'apartment' }]
          : []
        ),
        { name: 'Campaigns', path: '/campaigns', icon: 'campaign' },
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { name: 'WhatsApp', path: '/chat/whatsapp', icon: 'chat', children: [
          { name: 'Setup', path: '/whatsapp-setup', icon: 'settings' },
          { name: 'Templates', path: '/whatsapp-templates', icon: 'description' },
        ]},
        { name: 'Email', path: '/chat/email', icon: 'mail', children: [
          { name: 'Templates', path: '/email-templates', icon: 'description' },
        ]},
        { name: 'Voice Calls', path: '/call-logs', icon: 'record_voice_over' },
      ],
    },
    {
      label: 'AUTOMATION',
      items: [
        { name: 'Lead Automation', path: '/lead-automation', icon: 'settings_suggest' },
        { name: 'Facebook Ads', path: '/integrations/facebook', icon: 'data_exploration' },
        { name: 'Google Ads', path: '/integrations/google', icon: 'ads_click' },
      ],
    },
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
    <aside className={`fixed left-0 top-0 h-screen bg-white/75 dark:bg-slate-950/70 border-r border-slate-200/70 dark:border-white/10 backdrop-blur-xl flex flex-col z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-20' : 'w-60'}`}>
      
      {/* Brand */}
      {/* border-b border-slate-200/70 dark:border-white/10 */}
      <div className={` flex items-center transition-all duration-300 ${isCollapsed ? 'p-0 justify-center h-16 sm:h-20' : 'p-4 sm:p-5 justify-between'}`}>
        {!isCollapsed ? (
          <>
            <Link to="/dashboard" className="no-underline flex items-center gap-2 overflow-hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/25">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  One Employee
                </span>
                <span className="text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  CRM Workspace
                </span>
              </div>
            </Link>
            <div className="flex gap-2">
              <button 
                onClick={onToggleCollapse}
                className="hidden lg:flex p-2 rounded-[10px] hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                title="Minimize Sidebar"
              >
                <span className="material-symbols-outlined text-xl">menu_open</span>
              </button>
              <button onClick={onClose} className="lg:hidden p-1.5 rounded-[10px] hover:bg-slate-900/5 dark:hover:bg-white/10">
                <span className="material-symbols-outlined text-slate-700 dark:text-slate-200 text-lg">close</span>
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={onToggleCollapse}
            className="p-4 hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center w-full h-full"
            title="Maximize Sidebar"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 sm:py-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <ul className="list-none p-0 m-0 px-2">
          {menuGroups.map((group, groupIndex) => (
            <li key={group.label} className="list-none">
              {/* Section Header (expanded) / Separator (collapsed) */}
              {isCollapsed ? (
                groupIndex > 0 && (
                  <div className="h-px mx-3 my-2 bg-slate-200/70 dark:bg-white/10" />
                )
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between px-4 pb-1 cursor-pointer bg-transparent border-none ${groupIndex === 0 ? 'pt-0' : 'pt-4'}`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                    {group.label}
                  </span>
                  <span className={`material-symbols-outlined text-[14px] text-slate-400 dark:text-slate-500 transition-transform duration-200 ${expandedGroups[group.label] ? 'rotate-0' : '-rotate-90'}`}>
                    expand_more
                  </span>
                </button>
              )}

              {/* Group Items */}
              <ul className={`list-none p-0 m-0 space-y-1 transition-all duration-200 overflow-hidden ${!isCollapsed && !expandedGroups[group.label] ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                {group.items.map((item) => (
                  <li key={item.path} onClick={(e) => { if (!item.children) { onClose(); if (item.openModal) setIsIntegrationModalOpen(true); } }}>
                    {item.children ? (
                      // Expandable parent item with children
                      <div>
                        <div className="flex items-center">
                          <Link
                            to={item.path}
                            onClick={onClose}
                            className={`flex-1 flex items-center transition-all duration-300 no-underline whitespace-nowrap group ${
                              isCollapsed
                                ? 'justify-center px-4 py-3 sm:py-3.5 rounded-[12px]'
                                : 'gap-3 px-4 py-2.5 sm:py-3 rounded-l-[12px] uppercase tracking-[0.12em] text-[9px] sm:text-[10px] font-black'
                            } ${
                              isActive(item.path) || item.children.some(c => isActive(c.path))
                                ? 'bg-gradient-to-r from-primary to-emerald-600 text-white shadow-md shadow-primary/25'
                                : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10'
                            }`}
                          >
                            <span className={`material-symbols-outlined transition-all duration-300 ${isCollapsed ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
                              {item.icon}
                            </span>
                            {!isCollapsed && (
                              <span className="opacity-100 transition-opacity duration-300 delay-100 uppercase">
                                {item.name}
                              </span>
                            )}
                            {isCollapsed && (
                              <div className="absolute left-20 ml-2 px-3 py-1 rounded-[10px] bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-xl">
                                {item.name}
                              </div>
                            )}
                          </Link>
                          {!isCollapsed && (
                            <button
                              type="button"
                              onClick={() => toggleItem(item.path)}
                              className={`p-2 rounded-r-[12px] transition-all duration-200 cursor-pointer border-none ${
                                isActive(item.path) || item.children.some(c => isActive(c.path))
                                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-600 text-white/80 hover:text-white'
                                  : 'bg-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                            >
                              <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${expandedItems[item.path] ? 'rotate-0' : '-rotate-90'}`}>
                                expand_more
                              </span>
                            </button>
                          )}
                        </div>
                        {/* Sub-items */}
                        {!isCollapsed && (
                          <ul className={`list-none p-0 m-0 pl-4 space-y-0.5 transition-all duration-200 overflow-hidden ${expandedItems[item.path] ? 'max-h-[200px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            {item.children.map((child) => (
                              <li key={child.path} onClick={onClose}>
                                <Link
                                  to={child.path}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-[10px] no-underline whitespace-nowrap uppercase tracking-[0.12em] text-[9px] sm:text-[10px] font-black transition-all duration-300 ${
                                    isActive(child.path)
                                      ? 'bg-gradient-to-r from-primary to-emerald-600 text-white shadow-md shadow-primary/25'
                                      : 'text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-base sm:text-lg transition-all duration-300">
                                    {child.icon}
                                  </span>
                                  <span className="opacity-100 transition-opacity duration-300 delay-100 uppercase">
                                    {child.name}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : item.placeholder ? (
                      <button
                        type="button"
                        className={`flex items-center transition-all duration-300 no-underline whitespace-nowrap group ${
                          isCollapsed
                            ? 'justify-center px-4 py-3 sm:py-3.5 rounded-[12px]'
                            : 'gap-3 px-4 py-2.5 sm:py-3 rounded-[12px] uppercase tracking-[0.12em] text-[9px] sm:text-[10px] font-black'
                        } ${
                          'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10'
                        }`}
                        title={item.name}
                      >
                        <span className={`material-symbols-outlined transition-all duration-300 ${isCollapsed ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <span className="opacity-100 transition-opacity duration-300 delay-100 uppercase">
                            {item.name}
                          </span>
                        )}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-20 ml-2 px-3 py-1 rounded-[10px] bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-xl">
                            {item.name}
                          </div>
                        )}
                      </button>
                    ) : (
                      <Link
                        to={item.path}
                        className={`flex items-center transition-all duration-300 no-underline whitespace-nowrap group ${
                          isCollapsed
                            ? 'justify-center px-4 py-3 sm:py-3.5 rounded-[12px]'
                            : 'gap-3 px-4 py-2.5 sm:py-3 rounded-[12px] uppercase tracking-[0.12em] text-[9px] sm:text-[10px] font-black'
                        } ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-primary to-emerald-600 text-white shadow-md shadow-primary/25'
                            : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <span className={`material-symbols-outlined transition-all duration-300 ${isCollapsed ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <span className="opacity-100 transition-opacity duration-300 delay-100 uppercase">
                            {item.name}
                          </span>
                        )}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-20 ml-2 px-3 py-1 rounded-[10px] bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-xl">
                            {item.name}
                          </div>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`border-t border-slate-200/70 dark:border-white/10 transition-all duration-300 ${isCollapsed ? 'p-1.5 sm:p-2 space-y-1' : 'p-3 sm:p-4 space-y-2'}`}>

        <button
          onClick={() => openConfirmation('logout')}
          className={`w-full flex items-center justify-center transition-all rounded-[12px] border cursor-pointer hover:bg-red-50 dark:hover:bg-red-500/10 group relative ${isCollapsed ? 'p-2.5 sm:p-3 border-transparent text-red-500' : 'gap-2.5 px-3 sm:px-4 py-2 sm:py-3 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] font-black text-red-500 border-red-100 dark:border-red-500/20'}`}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">logout</span>
          {!isCollapsed && <span>Logout</span>}
          {isCollapsed && (
            <div className="absolute left-20 px-3 py-1 rounded-[10px] bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
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

      <IntegrationSelectorModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;
