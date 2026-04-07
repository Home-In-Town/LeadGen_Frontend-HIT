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
            <div className={`p-2 sm:p-2.5 border-b border-charcoal/5 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-20 ${isMobile ? 'safe-top' : ''}`}>
                <div className="flex items-center gap-1">
                    {isMobile && (
                        <button 
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-charcoal/10 transition-colors mr-1"
                        >
                            <span className="material-symbols-outlined text-[18px] text-charcoal">arrow_back</span>
                        </button>
                    )}
                    {!isMobile && onClose && (
                          <button 
                              onClick={onClose}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-charcoal/10 transition-colors mr-1"
                          >
                              <span className="material-symbols-outlined text-[16px] text-charcoal">arrow_back</span>
                          </button>
                    )}
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-charcoal/5 transition-colors group">
                        <span className="material-symbols-outlined text-[16px] text-charcoal/30 group-hover:text-charcoal transition-colors">archive</span>
                    </button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-charcoal/5 transition-colors group">
                        <span className="material-symbols-outlined text-[16px] text-charcoal/30 group-hover:text-charcoal transition-colors">report</span>
                    </button>
                    <button 
                        onClick={() => onDelete(email._id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors group"
                    >
                        <span className="material-symbols-outlined text-[16px] text-charcoal/30 group-hover:text-red-500 transition-colors">delete</span>
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onReply(email)}
                        className="bg-charcoal text-white rounded-md px-2 py-1 flex items-center gap-1.5 hover:shadow-md hover:shadow-charcoal/10 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[12px]">reply</span>
                        <span className="text-[7.5px] font-black uppercase tracking-widest hidden sm:inline">Reply</span>
                    </button>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-grow overflow-y-auto custom-scrollbar bg-[#fdfdfd]">
                <div className="max-w-[700px] mx-auto p-4 sm:p-6 pt-5 w-full">
                    {/* Header Info */}
                    <div className="mb-4">
                        <span className="bg-charcoal/5 px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest text-charcoal/40 mb-2 inline-block">
                            {email.folder || 'Inbox'}
                        </span>
                        
                        <h1 className="text-[16px] sm:text-[18px] font-black text-charcoal leading-tight mb-4 tracking-tight">
                            {email.subject}
                        </h1>

                        <div className="flex items-start justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-white border border-charcoal/5 shadow-sm">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-charcoal text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-charcoal/20 shrink-0">
                                    {email.to.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-0 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-charcoal truncate">
                                            {email.leadId ? `${email.leadId.first_name} ${email.leadId.last_name || ''}` : email.to}
                                        </p>
                                        <p className="text-[8px] font-black text-charcoal/20 hidden sm:inline">&lt;{email.to}&gt;</p>
                                    </div>
                                    <p className="text-[8px] font-black text-charcoal/40 flex items-center gap-1">
                                        to me 
                                        <span className="w-0.5 h-0.5 rounded-full bg-charcoal/20" />
                                        {new Date(email.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                            
                            {email.leadId && (
                                <Link 
                                    to={`/lead/${email.leadId._id || email.leadId.id}`}
                                    className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 group shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[12px]">person</span>
                                    <span className="text-[7.5px] font-black uppercase tracking-widest leading-none">View</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Email Body */}
                    <div 
                        className="email-content-view text-[13px] leading-[1.6] text-charcoal/80 font-medium selection:bg-charcoal selection:text-white"
                        dangerouslySetInnerHTML={renderBody}
                    />

                    {/* Footer / Quick Actions */}
                    <div className="mt-8 pt-4 border-t border-charcoal/5 flex flex-wrap gap-2.5 pb-10">
                        <button 
                            onClick={() => onReply(email)}
                            className="border border-charcoal/10 rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-charcoal/5 transition-all group"
                        >
                            <span className="material-symbols-outlined text-charcoal/30 group-hover:text-charcoal transition-colors text-[14px]">reply</span>
                            <span className="text-[8.5px] font-black uppercase tracking-[0.15em] text-charcoal">Reply</span>
                        </button>
                        <button className="border border-charcoal/10 rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-charcoal/5 transition-all group">
                            <span className="material-symbols-outlined text-charcoal/30 group-hover:text-charcoal transition-colors text-[14px]">forward</span>
                            <span className="text-[8.5px] font-black uppercase tracking-[0.15em] text-charcoal">Forward</span>
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
