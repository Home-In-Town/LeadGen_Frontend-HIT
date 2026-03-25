import React from 'react';

const EmailList = ({ folder, emails, activeId, onEmailSelect, loading, onRefresh, search, onSearch }) => {

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
        <div className="w-[450px] border-r border-charcoal/5 flex flex-col h-full bg-white grow shrink-0">
            {/* Header / Search */}
            <div className="p-6 border-b border-charcoal/5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[14px] font-black uppercase tracking-[0.3em] text-charcoal">
                        {folder || 'Inbox'}
                    </h2>
                    <button 
                        onClick={onRefresh}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-charcoal/10 transition-colors"
                    >
                        <span className={`material-symbols-outlined text-[18px] text-charcoal/40 ${loading ? 'animate-spin' : ''}`}>
                            refresh
                        </span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-charcoal/20 group-focus-within:text-charcoal transition-colors">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search emails..."
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full bg-charcoal/[0.03] border-none rounded-xl py-3 pl-10 pr-4 text-[11px] font-black text-charcoal placeholder:text-charcoal/20 focus:ring-1 focus:ring-charcoal transition-all outline-none"
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
                                    className={`w-full text-left p-6 flex flex-col gap-1 transition-all group relative overflow-hidden ${
                                        isSelected ? 'bg-charcoal/5' : 'bg-white hover:bg-charcoal/[0.01]'
                                    }`}
                                >
                                    {/* Unread indicator */}
                                    {isUnread && (
                                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/40" />
                                    )}

                                    <div className="flex items-center justify-between gap-4">
                                        <p className={`text-[11px] uppercase tracking-wider truncate shrink-0 ${
                                            isUnread ? 'font-black text-charcoal' : 'font-bold text-charcoal/60'
                                        }`}>
                                            {leadName}
                                        </p>
                                        <p className="text-[10px] font-black text-charcoal/20 tabular-nums">
                                            {formatTime(email.createdAt)}
                                        </p>
                                    </div>

                                    <h3 className={`text-[12px] truncate group-hover:text-charcoal transition-colors ${
                                        isUnread ? 'font-black text-charcoal' : 'font-medium text-charcoal/70'
                                    }`}>
                                        {email.subject}
                                    </h3>
                                    
                                    <p className="text-[11px] font-medium text-charcoal/30 truncate leading-relaxed">
                                        {email.snippet || "No preview available..."}
                                    </p>

                                    {/* Selection Overlay Decor */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-0 w-1 h-full bg-charcoal" />
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
