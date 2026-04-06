import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const EmailDetail = ({ email, onClose, onDelete, onReply, isMobile }) => {
    
    // Memoize the sanitized body (or use dangerous HTML if you trust the source)
    const renderBody = useMemo(() => {
        if (!email?.body) return null;
        return { __html: email.body };
    }, [email?.body]);

    if (!email) {
        return (
            <div className="flex-grow bg-[#fafafa] flex flex-col items-center justify-center p-20 text-center select-none">
                <div className="w-16 h-16 rounded-3xl bg-charcoal/5 flex items-center justify-center mb-6 animate-pulse">
                    <span className="material-symbols-outlined text-charcoal/20 text-3xl">mail</span>
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-charcoal/20">
                    Select an email to read
                </h3>
            </div>
        );
    }

    return (
        <div className={`flex-grow bg-white flex flex-col h-full shadow-2xl z-10 ${isMobile ? 'fixed inset-0 z-[100]' : ''}`}>
            {/* Toolbar */}
            <div className={`p-4 sm:p-6 border-b border-charcoal/5 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-20 ${isMobile ? 'safe-top' : ''}`}>
                <div className="flex items-center gap-1 sm:gap-2">
                    {isMobile && (
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-charcoal/10 transition-colors mr-1"
                        >
                            <span className="material-symbols-outlined text-[20px] text-charcoal">arrow_back</span>
                        </button>
                    )}
                    {!isMobile && onClose && (
                         <button 
                             onClick={onClose}
                             className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-charcoal/10 transition-colors mr-2"
                         >
                             <span className="material-symbols-outlined text-[20px] text-charcoal">arrow_back</span>
                         </button>
                    )}
                    <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center hover:bg-charcoal/5 transition-colors group">
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-charcoal/30 group-hover:text-charcoal transition-colors">archive</span>
                    </button>
                    <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center hover:bg-charcoal/5 transition-colors group">
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-charcoal/30 group-hover:text-charcoal transition-colors">report</span>
                    </button>
                    <button 
                        onClick={() => onDelete(email._id)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center hover:bg-red-50 transition-colors group"
                    >
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-charcoal/30 group-hover:text-red-500 transition-colors">delete</span>
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onReply(email)}
                        className="bg-charcoal text-white rounded-xl px-4 py-2 flex items-center gap-2 hover:shadow-lg hover:shadow-charcoal/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[16px]">reply</span>
                        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Reply</span>
                    </button>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-grow overflow-y-auto custom-scrollbar bg-[#fdfdfd]">
                <div className="max-w-[800px] mx-auto p-10 pt-16 w-full">
                    {/* Header Info */}
                    <div className="mb-12">
                        <span className="bg-charcoal/5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-charcoal/40 mb-4 inline-block">
                            {email.folder || 'Inbox'}
                        </span>
                        
                        <h1 className="text-[28px] font-black text-charcoal leading-tight mb-8">
                            {email.subject}
                        </h1>

                        <div className="flex items-start justify-between gap-6 p-6 rounded-3xl bg-white border border-charcoal/5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-charcoal text-white flex items-center justify-center text-[14px] font-black shadow-lg shadow-charcoal/20">
                                    {email.to.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <p className="text-[12px] font-black text-charcoal">
                                            {email.leadId ? `${email.leadId.first_name} ${email.leadId.last_name || ''}` : email.to}
                                        </p>
                                        <p className="text-[10px] font-black text-charcoal/20">&lt;{email.to}&gt;</p>
                                    </div>
                                    <p className="text-[10px] font-black text-charcoal/40 flex items-center gap-1.5">
                                        to me 
                                        <span className="w-1 h-1 rounded-full bg-charcoal/20" />
                                        {new Date(email.createdAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                            
                            {email.leadId && (
                                <Link 
                                    to={`/lead/${email.leadId._id || email.leadId.id}`}
                                    className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 group"
                                >
                                    <span className="material-symbols-outlined text-[16px]">person</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">View Lead</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Email Body */}
                    <div 
                        className="email-content-view text-[14px] leading-[1.8] text-charcoal/80 font-medium selection:bg-charcoal selection:text-white"
                        dangerouslySetInnerHTML={renderBody}
                    />

                    {/* Footer / Quick Actions */}
                    <div className="mt-20 pt-10 border-t border-charcoal/5 flex flex-wrap gap-4 pb-20">
                        <button 
                            onClick={() => onReply(email)}
                            className="border border-charcoal/10 rounded-2xl px-6 py-4 flex items-center gap-3 hover:bg-charcoal/5 transition-all group"
                        >
                            <span className="material-symbols-outlined text-charcoal/30 group-hover:text-charcoal transition-colors">reply</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal">Reply</span>
                        </button>
                        <button className="border border-charcoal/10 rounded-2xl px-6 py-4 flex items-center gap-3 hover:bg-charcoal/5 transition-all group">
                            <span className="material-symbols-outlined text-charcoal/30 group-hover:text-charcoal transition-colors">forward</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal">Forward</span>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .email-content-view p { margin-bottom: 1.5em; }
                .email-content-view a { color: #2563eb; text-decoration: underline; }
                .email-content-view h1, h2, h3 { color: #1a1a1a; margin-top: 2em; margin-bottom: 1em; font-weight: 900; }
                .email-content-view ul, ol { margin-bottom: 2em; padding-left: 1.5em; }
                .email-content-view li { margin-bottom: 0.5em; }
            `}</style>
        </div>
    );
};

export default EmailDetail;
