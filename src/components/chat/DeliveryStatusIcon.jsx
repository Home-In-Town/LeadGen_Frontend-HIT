/**
 * DeliveryStatusIcon — renders WhatsApp-style delivery ticks
 * Props: { status } where status is one of: 'sent', 'delivered', 'read', 'failed', or null/undefined
 * 
 * - null/undefined → render nothing
 * - 'sent' → single grey tick ✓
 * - 'delivered' → double grey ticks ✓✓
 * - 'read' → double blue ticks ✓✓ (blue color)
 * - 'failed' → red error icon ✕
 */

import React from 'react';

const DeliveryStatusIcon = ({ status }) => {
    if (!status) return null;

    if (status === 'failed') {
        return (
            <span className="inline-flex items-center ml-1" title="Failed to send">
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.5 9.5l-1 1L8 9l-2.5 2.5-1-1L7 8 4.5 5.5l1-1L8 7l2.5-2.5 1 1L9 8l2.5 2.5z"/>
                </svg>
            </span>
        );
    }

    const isRead = status === 'read';
    const isDouble = status === 'delivered' || status === 'read';
    const color = isRead ? 'text-blue-500' : 'text-slate-400';

    return (
        <span className={`inline-flex items-center ml-1 ${color}`} title={status}>
            {isDouble ? (
                <svg className="w-4 h-4" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 5.5l3 3 5-7" />
                    <path d="M5 5.5l3 3 5-7" />
                </svg>
            ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 12 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 5.5l3 3 6-7" />
                </svg>
            )}
        </span>
    );
};

export default DeliveryStatusIcon;
