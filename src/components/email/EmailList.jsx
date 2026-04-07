import React from 'react';

const EmailList = ({ folder, emails, activeId, onEmailSelect, loading, onRefresh, search, onSearch, onMenuClick, isMobile }) => {

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000) { // Less than 24h
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className={`${isMobile ? 'w-full' : 'w-[280px] lg:w-[320px]'} border-r border-charcoal/5 flex flex-col h-full bg-white grow shrink-0 min-w-0 overflow-hidden`}>
            {/* Header / Search */}
            {/* Header / Search */}
            <div className="p-2 sm:p-3 border-b border-charcoal/5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {isMobile && (
                            <button 
                                onClick={onMenuClick}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-charcoal/10 transition-colors -ml-1"
                            >
                                <span className="material-symbols-outlined text-[18px] text-charcoal">menu</span>
                            </button>
                        )}
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal opacity-60">
                            {folder || 'Inbox'}
                        </h2>
                    </div>
                    <button 
                        onClick={onRefresh}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-charcoal/10 transition-colors"
                    >
                        <span className={`material-symbols-outlined text-[16px] text-charcoal/30 ${loading ? 'animate-spin' : ''}`}>
                            refresh
                        </span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-charcoal/20 group-focus-within:text-charcoal transition-colors">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search emails..."
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full bg-charcoal/[0.03] border border-charcoal/5 rounded-lg py-1.5 pl-8 pr-3 text-[9px] font-black text-charcoal placeholder:text-charcoal/20 focus:ring-1 focus:ring-charcoal/10 transition-all outline-none"
                    />
                </div>
            </div>

            {/* List Body */}
            <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar">
                {loading ? (
                    <div className="p-10 text-center animate-pulse">
                        <p className="text-[9px] font-black uppercase tracking-widest text-charcoal/20">Loading...</p>
                    </div>
                ) : emails.length === 0 ? (
                    <div className="p-20 text-center">
                        <span className="material-symbols-outlined text-4xl text-charcoal/5 mb-4 italic">mail_lock</span>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-charcoal/20">No emails found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-charcoal/5">
                        {emails.map((email) => {
                            const leadName = email.leadId ? `${email.leadId.first_name} ${email.leadId.last_name || ''}` : email.to;
                            const isSelected = activeId === email._id;
                            const isUnread = email.status === 'inbox' && !email.isRead;

                            return (
                                <button
                                    key={email._id}
                                    onClick={() => onEmailSelect(email._id)}
                                    className={`w-full text-left p-2.5 sm:p-3 flex flex-col gap-0.5 transition-all group relative overflow-hidden ${
                                        isSelected ? 'bg-charcoal/[0.04]' : 'bg-white hover:bg-charcoal/[0.01]'
                                    }`}
                                >
                                    {/* Unread indicator */}
                                    {isUnread && (
                                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.2 h-1.2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                                    )}

                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                        <p className={`text-[9px] uppercase tracking-[0.05em] truncate ${
                                            isUnread ? 'font-black text-charcoal' : 'font-bold text-charcoal/40'
                                        }`}>
                                            {leadName}
                                        </p>
                                        <p className="text-[8px] font-black uppercase tracking-tighter text-charcoal/20 tabular-nums shrink-0">
                                            {formatTime(email.createdAt)}
                                        </p>
                                    </div>

                                    <h3 className={`text-[11px] truncate transition-colors duration-300 leading-tight ${
                                        isUnread ? 'font-black text-charcoal' : 'font-bold text-charcoal/70'
                                    }`}>
                                        {email.subject}
                                    </h3>
                                    
                                    <p className="text-[9px] font-medium text-charcoal/30 truncate leading-relaxed group-hover:text-charcoal/60 transition-colors">
                                        {email.snippet || "No preview available..."}
                                    </p>

                                    {/* Selection Overlay Decor */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-0 w-0.5 h-full bg-charcoal animate-in slide-in-from-left duration-300" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailList;
