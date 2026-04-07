import { useNavigate } from 'react-router-dom';

const PlatformCard = ({ title, description, icon, color, to, badge, disabled }) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => !disabled && navigate(to)}
            className={`group bg-white border-2 ${disabled ? 'border-charcoal/5 opacity-60 cursor-not-allowed' : 'border-charcoal hover:bg-charcoal cursor-pointer'} p-2.5 sm:p-4 transition-all relative overflow-hidden flex flex-col justify-between min-h-[110px] sm:min-h-[135px] shadow-sm`}
        >
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                    <span className={`material-symbols-outlined ${disabled ? 'text-charcoal/20' : 'text-charcoal group-hover:text-white'} transition-colors text-xl sm:text-2xl`}>
                        {icon}
                    </span>
                    {badge && (
                        <div className="px-1 py-0.5 bg-primary/10 border border-primary/20 text-primary font-black uppercase tracking-widest text-[5px] sm:text-[7px] animate-pulse">
                            {badge}
                        </div>
                    )}
                </div>
                <h3 className={`text-sm sm:text-base font-black uppercase tracking-tight ${disabled ? 'text-charcoal/20' : 'text-charcoal group-hover:text-white'} transition-colors mb-0.5`}>
                    {title}
                </h3>
                <p className={`text-[7px] sm:text-[9px] font-bold ${disabled ? 'text-charcoal/10' : 'text-charcoal/40 group-hover:text-white/40'} transition-colors uppercase tracking-[0.2em] max-w-[110px] sm:max-w-[160px]`}>
                    {description}
                </p>
            </div>
            
            {!disabled && (
                <div className="relative z-10 flex items-center justify-between mt-1.5 sm:mt-2">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${color}`}></span>
                        <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest ${disabled ? 'text-charcoal/10' : 'text-charcoal/60 group-hover:text-white/60'} transition-colors`}>
                            {title}
                        </span>
                    </div>
                    <span className="material-symbols-outlined text-charcoal/20 group-hover:text-white/40 transition-all group-hover:translate-x-1 text-xs sm:text-sm">
                        arrow_forward
                    </span>
                </div>
            )}

            {/* Background design element */}
            <div className={`absolute -right-6 -bottom-6 w-20 h-20 sm:w-28 sm:h-28 ${disabled ? 'bg-charcoal/5' : 'bg-charcoal/5 group-hover:bg-white/5'} rotate-12 transition-all`}></div>
        </div>
    );
};

export default function ChatSelectionPage() {
    return (
        <div className="animate-fade-in font-display max-w-5xl mx-auto px-4">
            <div className="mb-5 sm:mb-8 text-center sm:text-left">
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-tighter leading-tight text-charcoal mb-0.5">
                    Choose Platform
                </h1>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <p className="text-charcoal/40 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em]">
                        Select a communication channel
                    </p>
                    <div className="h-[1px] w-6 bg-primary"></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-10 max-w-3xl">
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
        </div>
    );
}
