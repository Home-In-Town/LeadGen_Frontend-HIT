import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

const IntegrationSelectorModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const integrations = [
    {
      id: 'facebook',
      name: 'Facebook Lead Ads',
      description: 'Sync leads automatically',
      path: '/integrations/facebook',
      color: '#1877F2',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      id: 'google',
      name: 'Google Ads',
      description: 'Sync conversions automatically',
      path: '/integrations/google',
      color: '#000000',
      icon: (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-charcoal/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white border-2 border-charcoal shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 sm:p-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 sm:mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tighter leading-tight">
              Select Integration
            </h2>
            <p className="text-charcoal/40 text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5">
              Choose a platform to connect
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-charcoal hover:bg-charcoal hover:text-white transition-colors p-1 border-2 border-transparent hover:border-charcoal flex items-center justify-center"
          >
            <span className="material-symbols-outlined font-black">close</span>
          </button>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {integrations.map((item) => (
            <div 
              key={item.id}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className="group bg-white border-2 p-3 sm:p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center justify-center min-h-[90px] sm:min-h-[110px] hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              style={{ borderColor: item.color }}
            >
              <div className="relative z-10">
                <div className="flex justify-center mb-2">
                  <div 
                    className="w-7 h-7 border-[1.5px] rounded-sm p-1.5 flex items-center justify-center transition-colors group-hover:bg-charcoal group-hover:text-white"
                    style={{ borderColor: item.color, color: item.color }}
                  >
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-charcoal mb-0.5">
                  {item.name}
                </h3>
                <p className="text-[8px] font-bold text-charcoal/40 uppercase tracking-tight">
                  {item.description}
                </p>
              </div>

              {/* Hover background effect */}
              <div 
                className="absolute -right-4 -bottom-4 w-20 h-20 opacity-[0.03] group-hover:opacity-[0.08] rotate-12 transition-all duration-300 pointer-events-none"
                style={{ backgroundColor: item.color }}
              />
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-charcoal/5 flex justify-center">
          <p className="text-[7px] font-black uppercase tracking-[0.2em] text-charcoal/30">
            More platforms coming soon
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IntegrationSelectorModal;
