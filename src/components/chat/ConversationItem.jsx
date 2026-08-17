/**
 * ConversationItem — Single conversation row in the sidebar
 * 
 * Props:
 * - conversation: { lead: { id, first_name, last_name, phone_number }, latestMessage: { content, createdAt, sender }, unreadCount }
 * - isActive: boolean (currently selected)
 * - onClick: () => void
 * - bulkMode: boolean
 * - isSelected: boolean
 * - onToggleSelect: () => void
 */

import React from 'react';
import { formatSidebarTime } from './utils/formatTime';
import { getDirection } from './utils/messageGrouping';

function getInitials(firstName, lastName) {
    const f = (firstName || '')[0] || '';
    const l = (lastName || '')[0] || '';
    return (f + l).toUpperCase() || '?';
}

function getAvatarColor(name) {
    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500'];
    const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
    return colors[idx];
}

const ConversationItem = ({ conversation, isActive, onClick, bulkMode, isSelected, onToggleSelect }) => {
    const { lead, latestMessage, unreadCount } = conversation;
    const name = `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() || lead?.phone_number || 'Unknown';
    const initials = getInitials(lead?.first_name, lead?.last_name);
    const avatarColor = getAvatarColor(name);
    const lastMsg = latestMessage?.content || 'No messages yet';
    const lastTime = formatSidebarTime(latestMessage?.createdAt);
    const isOutbound = latestMessage?.sender ? getDirection(latestMessage.sender) === 'outbound' : false;

    return (
        <div
            onClick={bulkMode ? onToggleSelect : onClick}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-slate-100 dark:border-white/5
                ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'}
                ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
        >
            {/* Bulk mode checkbox */}
            {bulkMode && (
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 flex-shrink-0"
                />
            )}

            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor}`}>
                {initials}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{name}</p>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">{lastTime}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {isOutbound && <span className="text-slate-400">You: </span>}
                        {lastMsg}
                    </p>
                    {unreadCount > 0 && !isActive && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationItem;
