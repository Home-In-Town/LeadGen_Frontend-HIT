/**
 * WhatsApp channel card for the lead detail view.
 */
const WhatsAppSection = ({ leadData, isHighlighted }) => {
    return (
        <div className={`bg-white border-2 p-6 transition-all duration-500 group relative
          ${isHighlighted ? 'border-primary ring-4 ring-primary/20 scale-[1.02] shadow-lg z-10' : 'border-charcoal'} 
          hover:border-primary`}>
            {isHighlighted && (
                <div className="absolute -top-3 -right-3 bg-primary text-charcoal px-2 py-1 text-[8px] font-black uppercase tracking-tighter animate-pulse border-2 border-charcoal">Updated</div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">chat</span>
                    WhatsApp
                </h3>
                {leadData.whatsappResult ? (
                    <span className="text-[10px] font-black uppercase bg-charcoal text-white px-2 py-1 tracking-widest">
                        {leadData.whatsappResult}
                    </span>
                ) : leadData.whatsappData?.status === 'sent' ? (
                    <span className="text-[10px] font-black uppercase bg-primary text-white px-2 py-1 tracking-widest">SENT</span>
                ) : (
                    <span className="text-[10px] font-black uppercase bg-surface-subtle text-charcoal/30 px-2 py-1 tracking-widest border border-charcoal/5">PENDING</span>
                )}
            </div>

            <div className="space-y-4">
                {leadData.whatsappResult === "YES" && <p className="text-sm font-bold text-emerald-600">✅ Lead expressed interest.</p>}
                {leadData.whatsappResult === "NO" && <p className="text-sm font-bold text-red-600">❌ Lead rejected or opted out.</p>}
                {leadData.whatsappData?.status === 'sent' && !leadData.whatsappResult && <p className="text-sm text-charcoal/60">Waiting for reply to template...</p>}
                {leadData.whatsappData?.error && <p className="text-xs text-red-500 italic">Error: {leadData.whatsappData.error}</p>}

                <div className="pt-4 border-t border-charcoal/5 flex justify-between items-center gap-2">
                    <div className="space-y-1">
                        {leadData.whatsappData?.messageSid && (
                            <p className="font-mono text-[9px] uppercase text-charcoal/30 line-clamp-1">ID: {leadData.whatsappData.messageSid.slice(0, 16)}...</p>
                        )}
                        {leadData.whatsappData?.sentAt && (
                            <p className="font-mono text-[9px] uppercase text-charcoal/30">Sent: {new Date(leadData.whatsappData.sentAt).toLocaleString()}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppSection;
