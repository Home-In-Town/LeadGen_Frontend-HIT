import { formatTime } from '../../utils/leadUtils';

/**
 * Link Activity / Portfolio channel card for the lead detail view.
 */
const LinkActivitySection = ({ leadData, isHighlighted }) => {
    return (
        <div className={`bg-white border-2 p-6 transition-all duration-500 group relative
          ${isHighlighted ? 'border-primary ring-4 ring-primary/20 scale-[1.02] shadow-lg z-10' : 'border-charcoal'} 
          hover:border-primary`}>
            {isHighlighted && (
                <div className="absolute -top-3 -right-3 bg-primary text-charcoal px-2 py-1 text-[8px] font-black uppercase tracking-tighter animate-pulse border-2 border-charcoal">Updated</div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-charcoal/40 group-hover:text-primary">link</span>
                    Portfolio
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-1 tracking-widest
                  ${leadData.linkActivity?.opened ? 'bg-primary text-white' : 'bg-surface-subtle text-charcoal/30'}`}>
                    {leadData.linkActivity?.opened ? 'ACTIVE' : 'IDLE'}
                </span>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                    <span>Opened Link</span>
                    <span className={leadData.linkActivity?.opened ? 'text-emerald-500' : 'text-charcoal/20'}>
                        {leadData.linkActivity?.opened ? 'YES' : 'NO'}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
                    <span>Form Submitted</span>
                    <span className={leadData.linkActivity?.submittedForm ? 'text-emerald-500' : 'text-charcoal/20'}>
                        {leadData.linkActivity?.submittedForm ? 'YES' : 'NO'}
                    </span>
                </div>
                {leadData.linkActivity?.timeSpentSeconds > 0 && (
                    <div className="pt-4 border-t border-charcoal/5 flex justify-between items-end">
                        <p className="text-[8px] font-black uppercase text-charcoal/30">Total Duration</p>
                        <p className="font-mono text-lg font-black">{formatTime(leadData.linkActivity.timeSpentSeconds)}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkActivitySection;
