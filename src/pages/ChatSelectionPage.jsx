import { useNavigate } from 'react-router-dom';

const PlatformCard = ({ title, description, icon, color, to, badge, disabled }) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => !disabled && navigate(to)}
            className={`group bg-white border-2 ${disabled ? 'border-charcoal/5 opacity-60 cursor-not-allowed' : 'border-charcoal hover:bg-charcoal cursor-pointer'} p-6 sm:p-8 transition-all relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm`}
        >
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <span className={`material-symbols-outlined ${disabled ? 'text-charcoal/20' : 'text-charcoal group-hover:text-white'} transition-colors text-4xl`}>
                        {icon}
                    </span>
                    {badge && (
                        <div className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary font-black uppercase tracking-widest text-[8px] sm:text-[9px] animate-pulse">
                            {badge}
                        </div>
                    )}
                </div>
                <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${disabled ? 'text-charcoal/20' : 'text-charcoal group-hover:text-white'} transition-colors mb-2`}>
                    {title}
                </h3>
                <p className={`text-[10px] sm:text-[11px] font-bold ${disabled ? 'text-charcoal/10' : 'text-charcoal/40 group-hover:text-white/40'} transition-colors uppercase tracking-[0.2em] max-w-[200px]`}>
                    {description}
                </p>
            </div>
            
            {!disabled && (
                <div className="relative z-10 flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${color}`}></span>
                        <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${disabled ? 'text-charcoal/10' : 'text-charcoal/60 group-hover:text-white/60'} transition-colors`}>
                            Connect via {title}
                        </span>
                    </div>
                    <span className="material-symbols-outlined text-charcoal/20 group-hover:text-white/40 transition-all group-hover:translate-x-1">
                        arrow_forward
                    </span>
                </div>
            )}

            {/* Background design element */}
            <div className={`absolute -right-6 -bottom-6 w-32 h-32 ${disabled ? 'bg-charcoal/5' : 'bg-charcoal/5 group-hover:bg-white/5'} rotate-12 transition-all`}></div>
        </div>
    );
};

export default function ChatSelectionPage() {
    return (
        <div className="animate-fade-in font-display max-w-5xl mx-auto px-4">
            <div className="mb-8 sm:mb-12 text-center sm:text-left">
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter leading-tight text-charcoal mb-2">
                    Choose Platform
                </h1>
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <p className="text-charcoal/40 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em]">
                        Select a communication channel
                    </p>
                    <div className="h-[1.5px] w-12 bg-primary"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-12">
                <PlatformCard 
                    title="WhatsApp"
                    description="Real-time two-way messaging with leads"
                    icon="forum"
                    color="bg-green-500"
                    to="/chat/whatsapp"
                />
                <PlatformCard 
                    title="Email"
                    description="Professional lead communication over SMTP"
                    icon="mail"
                    color="bg-blue-500"
                    to="/chat/email"
                />
            </div>

            {/* Hint Box */}
            <div className="bg-surface-subtle border border-charcoal/5 p-6 rounded-sm flex items-start gap-4">
                <span className="material-symbols-outlined text-charcoal/40 mt-0.5">info</span>
                <div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-charcoal m-0 mb-1">Architecture Note</h4>
                    <p className="text-[10px] font-bold text-charcoal/40 leading-relaxed uppercase tracking-wider">
                        The system uses a unified lead database. Switching platforms allows you to reach the same contact through different channels while maintaining lead history.
                    </p>
                </div>
            </div>
        </div>
    );
}
