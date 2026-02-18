import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'builder',
      title: 'BUILDER',
      description: 'OWNER / DEVELOPER',
      icon: 'apartment',
      path: '/builder-login',
      accent: 'border-primary'
    },
    {
      id: 'agent',
      title: 'AGENT',
      description: 'SALES / HELP',
      icon: 'support_agent',
      path: '/agent-login',
      accent: 'border-blue-500'
    },
    {
      id: 'admin',
      title: 'ADMIN',
      description: 'SYSTEM CONTROL',
      icon: 'settings_accessibility',
      path: '/admin-login',
      accent: 'border-charcoal/20'
    }
  ];

  return (
    <div className="animate-fade-in bg-background-light min-h-[85vh] font-display text-charcoal flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-3">
            HELLO. CLICK YOUR ROLE:
          </h1>
          <div className="h-0.5 w-12 bg-primary mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => navigate(role.path)}
              className={`group flex flex-col items-center p-6 md:p-8 bg-white border-2 ${role.accent} hover:bg-surface-subtle transition-all cursor-pointer shadow-sm hover:shadow-lg`}
            >
              <span className="material-symbols-outlined text-5xl mb-4 group-hover:scale-110 transition-transform">
                {role.icon}
              </span>
              <h2 className="text-xl font-black uppercase tracking-tighter mb-1">
                {role.title}
              </h2>
              <p className="text-charcoal/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                {role.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-charcoal/20">
            One Employee // Universal Access Interface
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
