/**
 * TypingIndicator — shows animated typing dots when contact is typing
 * Props: { visible } — boolean controlling visibility
 *
 * Renders a small left-aligned bubble with 3 bouncing dots animation
 * Should look like WhatsApp's native typing indicator
 *
 * Requirements: 11.2, 11.3
 */

import React from 'react';

const TypingIndicator = ({ visible }) => {
    if (!visible) return null;

    return (
        <div className="flex items-end gap-2 mb-2 pl-2">
            <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-600">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    );
};

export default TypingIndicator;
