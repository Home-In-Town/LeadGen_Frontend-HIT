import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const IntegrationSelectorModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const integrations = [
    {
      id: "facebook",
      name: "Facebook Lead Ads",
      description: "Sync leads automatically",
      path: "/integrations/facebook",
      color: "from-blue-600 to-blue-400",
      border: "border-blue-500/20",
      text: "text-blue-600",
      iconBg: "bg-blue-500/10",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-full h-full"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: "google",
      name: "Google Ads",
      description: "Sync conversions automatically",
      path: "/integrations/google",
      color: "from-slate-900 to-slate-700",
      border: "border-slate-300",
      text: "text-slate-800",
      iconBg: "bg-slate-100",
      icon: (
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100]
      flex items-center justify-center
      p-4
      bg-black/40 dark:bg-black/60
      backdrop-blur-md
      animate-in fade-in duration-200">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div
        className="
          relative
          w-full
          max-w-2xl
          overflow-hidden
          rounded-[32px]
          border
          border-slate-200/70
          dark:border-white/10
          bg-white
          dark:bg-[#0b0d12]
          shadow-2xl
          animate-in
          zoom-in-95
          duration-200">

        {/* Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />

                <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                  Integrations
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                Connect Your Platforms
              </h2>

              <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                Integrate advertising and marketing platforms to automate
                lead collection and campaign performance tracking.
              </p>
            </div>

            <button
              onClick={onClose}
              className="
                w-11
                h-11
                rounded-2xl
                border
                border-slate-200 dark:border-white/10
                flex
                items-center
                justify-center
                text-slate-500 dark:text-slate-400
                transition-all
                duration-300
                hover:bg-slate-900 dark:hover:bg-white
                hover:text-white dark:hover:text-black
                hover:border-slate-900 dark:hover:border-white
              "
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {integrations.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className={`
                  group
                  relative
                  overflow-hidden
                  rounded-[28px]
                  border
                  ${item.border}
                  bg-slate-50/70 dark:bg-white/[0.04]
                  p-6
                  text-left
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-xl dark:hover:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]
                `}
              >
                {/* Gradient */}
                <div
                  className={`
                    absolute
                    top-0
                    right-0
                    w-40
                    h-40
                    rounded-full
                    blur-3xl
                    opacity-10
                    bg-gradient-to-br
                    ${item.color}
                  `}
                />

                <div className="relative z-10">
                  <div
                    className={`
                      w-16
                      h-16
                      rounded-2xl
                      ${item.iconBg}
                      flex
                      items-center
                      justify-center
                      mb-5
                      ${item.text}
                    `}
                  >
                    <div className="w-8 h-8">{item.icon}</div>
                  </div>

                  <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                    {item.name}
                  </h3>

                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 mb-6">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Connect Platform
                    </span>

                    <div
                      className="
                        w-10
                        h-10
                        rounded-full
                        border
                        border-slate-200 dark:border-white/10
                        flex
                        items-center
                        justify-center
                        text-slate-500 dark:text-slate-400
                        transition-all
                        duration-300
                        group-hover:bg-slate-900 dark:group-hover:bg-white
                        group-hover:text-white dark:group-hover:text-black
                        group-hover:border-slate-900 dark:group-hover:border-white
                      "
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500 font-mono">
              More Marketing Integrations Coming Soon
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IntegrationSelectorModal;