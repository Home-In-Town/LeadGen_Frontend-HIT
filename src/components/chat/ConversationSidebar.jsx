/**
 * ConversationSidebar — WhatsApp-style sidebar with header, search, and conversation list
 *
 * Props:
 * - conversations: array of { lead: { id, first_name, last_name, phone_number }, latestMessage: { content, createdAt }, unreadCount }
 * - activeLeadId: string | null
 * - onSelect: (leadId) => void
 * - loading: boolean
 * - searchQuery: string
 * - onSearchChange: (query) => void
 * - bulkMode: boolean
 * - selectedLeadIds: Set
 * - onToggleBulkMode: () => void
 * - onToggleSelect: (leadId) => void
 * - onLoadMore: () => void
 * - hasMore: boolean
 * - integrationHealth: 'healthy' | 'degraded' | 'disconnected'
 * - onNewChat: () => void
 */

import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import ConversationItem from './ConversationItem';

function getHealthBadge(status) {
    switch (status) {
        case 'healthy':
            return { color: 'bg-green-400', label: 'Connected' };
        case 'degraded':
            return { color: 'bg-amber-400', label: 'Degraded' };
        case 'disconnected':
            return { color: 'bg-red-400', label: 'Disconnected' };
        default:
            return { color: 'bg-slate-400', label: 'Unknown' };
    }
}

const ConversationSidebar = ({
    conversations = [],
    activeLeadId = null,
    onSelect,
    loading = false,
    searchQuery = '',
    onSearchChange,
    bulkMode = false,
    selectedLeadIds = new Set(),
    onToggleBulkMode,
    onToggleSelect,
    onLoadMore,
    hasMore = false,
    integrationHealth = 'healthy',
    onNewChat,
}) => {
    // Client-side search filtering (case-insensitive name or phone match)
    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();
        const firstName = (conv.lead?.first_name || '').toLowerCase();
        const lastName = (conv.lead?.last_name || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const phone = (conv.lead?.phone_number || '').toLowerCase();
        return fullName.includes(query) || firstName.includes(query) || lastName.includes(query) || phone.includes(query);
    });

    const healthBadge = getHealthBadge(integrationHealth);

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10">
            {/* WhatsApp-green header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#075E54] text-white flex-shrink-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-base font-semibold">WhatsApp</h1>
                    {/* Integration status badge */}
                    <div className="flex items-center gap-1.5" title={healthBadge.label}>
                        <span className={`w-2 h-2 rounded-full ${healthBadge.color}`} />
                        <span className="text-[10px] text-white/70">{healthBadge.label}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Bulk Select toggle */}
                    <button
                        onClick={onToggleBulkMode}
                        className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            bulkMode
                                ? 'bg-white text-[#075E54] font-semibold'
                                : 'bg-white/20 hover:bg-white/30 text-white'
                        }`}
                        title={bulkMode ? 'Exit bulk select' : 'Bulk select'}
                    >
                        {bulkMode ? 'Done' : 'Select'}
                    </button>
                    {/* New Chat button */}
                    <button
                        onClick={onNewChat}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
                        title="New Chat"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>New</span>
                    </button>
                </div>
            </div>

            {/* Search input */}
            <div className="px-3 py-2 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder="Search by name or phone"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-white placeholder-slate-400"
                    />
                </div>
            </div>

            {/* Conversation list (virtualized with react-virtuoso for 10K+ performance) */}
            <div className="flex-1 overflow-hidden">
                {filteredConversations.length === 0 && !loading && (
                    <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                        {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                    </div>
                )}

                {filteredConversations.length > 0 && (
                    <Virtuoso
                        data={filteredConversations}
                        endReached={() => {
                            if (hasMore && !searchQuery) onLoadMore?.();
                        }}
                        overscan={200}
                        itemContent={(index, conversation) => (
                            <ConversationItem
                                key={conversation.lead?.id || conversation.lead?._id}
                                conversation={conversation}
                                isActive={activeLeadId === (conversation.lead?.id || conversation.lead?._id)}
                                onClick={() => onSelect?.(conversation.lead?.id || conversation.lead?._id)}
                                bulkMode={bulkMode}
                                isSelected={selectedLeadIds.has(conversation.lead?.id || conversation.lead?._id)}
                                onToggleSelect={() => onToggleSelect?.(conversation.lead?.id || conversation.lead?._id)}
                            />
                        )}
                        components={{
                            Footer: () => hasMore && !searchQuery ? (
                                <div className="flex items-center justify-center py-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Loading more...
                                    </div>
                                </div>
                            ) : null
                        }}
                    />
                )}

                {/* Loading indicator for initial load */}
                {loading && conversations.length === 0 && (
                    <div className="flex items-center justify-center h-32">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Loading conversations...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationSidebar;
