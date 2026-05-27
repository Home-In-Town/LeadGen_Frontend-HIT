import { useNavigate } from "react-router-dom";

const platforms = [
  {
    title: "WhatsApp",
    description: "Real-time two-way messaging with leads",
    icon: "forum",
    color: "from-emerald-500/20 to-emerald-500/5",
    accent: "bg-emerald-500",
    text: "text-emerald-500",
    border: "hover:border-emerald-500/30",
    glow: "group-hover:shadow-emerald-500/10",
    to: "/chat/whatsapp",
    status: "LIVE",
  },
  {
    title: "Email",
    description: "Professional lead communication over SMTP",
    icon: "mail",
    color: "from-blue-500/20 to-blue-500/5",
    accent: "bg-blue-500",
    text: "text-blue-500",
    border: "hover:border-blue-500/30",
    glow: "group-hover:shadow-blue-500/10",
    to: "/chat/email",
    status: "BETA",
  },
];

const PlatformCard = ({
  title,
  description,
  icon,
  color,
  accent,
  text,
  border,
  glow,
  to,
  status,
  disabled,
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => !disabled && navigate(to)}
      className={`group relative overflow-hidden rounded-[28px] border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl p-5 sm:p-6 text-left transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:-translate-y-2 hover:shadow-2xl ${border} ${glow} ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer"
      }`}
    >
      {/* BACKGROUND GLOW */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* DECORATIVE ORB */}
      <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-700" />

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col h-full">
        {/* TOP */}
        <div className="flex items-start justify-between mb-8">
          <div
            className={`w-14 h-14 rounded-2xl ${text} bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110`}
          >
            <span className="material-symbols-outlined text-[28px]">
              {icon}
            </span>
          </div>

          {status && (
            <div
              className={`px-3 h-8 rounded-full border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl flex items-center`}
            >
              <span
                className={`text-[9px] font-black uppercase tracking-[0.2em] ${text}`}
              >
                {status}
              </span>
            </div>
          )}
        </div>

        {/* TEXT */}
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            {title}
          </h3>

          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-[260px]">
            {description}
          </p>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${accent} animate-pulse`}
            />

            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Active Channel
            </span>
          </div>

          <div
            className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1`}
          >
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-300">
              arrow_forward
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default function ChatSelectionPage() {
  return (
    <div className="animate-fade-in min-h-[calc(100vh-120px)] px-4 sm:px-6 lg:px-8 py-6">
      {/* HERO */}
      <div className="max-w-6xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary mb-5">
          <span className="material-symbols-outlined text-[16px]">
            hub
          </span>

          <span className="text-[10px] font-black uppercase tracking-[0.25em]">
            Communication Hub
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white max-w-3xl mb-5">
          Choose Your Messaging Platform
        </h1>

        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
          Manage conversations, automate engagement, and communicate with
          leads across multiple channels in one unified workspace.
        </p>
      </div>

      {/* GRID */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <PlatformCard key={platform.title} {...platform} />
        ))}
      </div>

      {/* FOOTER */}
      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-slate-200 dark:border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
              Unified Communication Infrastructure
            </p>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Real-time sync • AI-powered workflows • Centralized messaging
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 h-11 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Systems Operational
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}