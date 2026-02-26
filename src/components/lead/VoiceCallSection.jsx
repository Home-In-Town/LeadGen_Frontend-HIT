/**
 * AI Voice Call channel card for the lead detail view.
 */
const VoiceCallSection = ({ leadData, isHighlighted, onRefresh, isRefreshing }) => {
    return (
        <div className={`bg-white border-2 p-6 transition-all duration-500 group relative
          ${isHighlighted ? 'border-primary ring-4 ring-primary/20 scale-[1.02] shadow-lg z-10' : 'border-charcoal'} 
          hover:border-primary`}>
            {isHighlighted && (
                <div className="absolute -top-3 -right-3 bg-primary text-charcoal px-2 py-1 text-[8px] font-black uppercase tracking-tighter animate-pulse border-2 border-charcoal">Updated</div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">record_voice_over</span>
                    AI Agent
                </h3>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 tracking-widest truncate max-w-[80px]
                        ${leadData.voiceCallData?.status?.toLowerCase() === 'failed' ? 'bg-red-600 text-white' :
                          leadData.voiceCallData?.status?.toLowerCase() === 'completed' || leadData.voiceCallData?.status?.toLowerCase() === 'analytics' ? 'bg-emerald-600 text-white' :
                          'bg-charcoal text-white'}`}>
                        {leadData.voiceCallData?.status?.toLowerCase() === 'failed'
                            ? (leadData.voiceCallData?.failReason === 'unanswered_or_declined' ? 'NO ANSWER' : 'FAILED')
                            : (leadData.voiceCallData?.status || 'INIT')}
                    </span>
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-1 hover:bg-surface-subtle cursor-pointer transition-colors"
                        title="Refresh Call"
                    >
                        <span className={`material-symbols-outlined text-sm font-black ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {leadData.voiceCallData?.status?.toLowerCase() === 'failed' ? (
                    <p className="text-sm font-bold text-red-600">
                        ❌ {leadData.voiceCallData?.failReason === 'unanswered_or_declined'
                            ? 'Call was not answered or was declined by the lead.'
                            : 'Call failed to connect.'}
                    </p>
                ) : leadData.aiCallResult ? (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-surface-subtle border border-charcoal/5">
                            <p className="text-[8px] font-black uppercase text-charcoal/30">Interest</p>
                            <p className="text-[10px] font-bold uppercase">{leadData.aiCallResult.interest || 'N/A'}</p>
                        </div>
                        <div className="p-2 bg-surface-subtle border border-charcoal/5">
                            <p className="text-[8px] font-black uppercase text-charcoal/30">Budget</p>
                            <p className="text-[10px] font-bold uppercase">{leadData.aiCallResult.budget || 'N/A'}</p>
                        </div>
                    </div>
                ) : <p className="text-sm text-charcoal/60">Gathering conversation data...</p>}

                {leadData.voiceCallData?.recordingLink && (
                    <a
                        href={leadData.voiceCallData.recordingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-charcoal transition-colors group"
                    >
                        <span className="material-symbols-outlined text-sm font-black">play_circle</span>
                        Listen Recording
                    </a>
                )}

                {leadData.voiceCallData?.transcript && (
                    <details className="cursor-pointer group">
                        <summary className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 hover:text-charcoal list-none flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm font-black transition-transform group-open:rotate-180">expand_more</span>
                            Full Transcript
                        </summary>
                        <p className="pt-2 text-[11px] leading-relaxed text-charcoal/60 italic border-l-2 border-charcoal/5 pl-3 mt-1 uppercase">
                            {leadData.voiceCallData.transcript}
                        </p>
                    </details>
                )}
            </div>
        </div>
    );
};

export default VoiceCallSection;
