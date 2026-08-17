/**
 * IntegrationStatusBadge — Connection health indicator for the sidebar header
 *
 * Props:
 *   status: 'healthy' | 'degraded' | 'disconnected'
 *   details: { phoneNumber?: string, lastWebhookAt?: string, pendingQueueDepth?: number } | null
 *
 * Behavior:
 * - Displays a small colored dot: green for healthy, amber for degraded, red for disconnected
 * - On click, opens a dropdown/popover showing integration details:
 *   - Connected phone number
 *   - API health status label
 *   - Last webhook received timestamp
 *   - Pending queue depth
 * - Clicking outside closes the popover
 *
 * Validates: Requirements 17.1, 17.3
 */

import React, { useState, useRef, useEffect } from 'react';

const STATUS_CONFIG = {
    healthy: {
        dotColor: 'bg-green-500',
        label: 'Healthy',
        labelColor: 'text-green-700',
        ringColor: 'ring-green-300',
    },
    degraded: {
        dotColor: 'bg-amber-500',
        label: 'Degraded',
        labelColor: 'text-amber-700',
        ringColor: 'ring-amber-300',
    },
    disconnected: {
        dotColor: 'bg-red-500',
        label: 'Disconnected',
        labelColor: 'text-red-700',
        ringColor: 'ring-red-300',
    },
};

const IntegrationStatusBadge = ({ status = 'disconnected', details = null }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;

    // Close popover on outside click
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // Close on Escape key
    useEffect(() => {
        if (!open) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open]);

    const formatTimestamp = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleString();
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="relative inline-flex" ref={containerRef}>
            {/* Clickable dot button */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="relative flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label={`Integration status: ${config.label}`}
                aria-expanded={open}
                aria-haspopup="true"
                title={`WhatsApp Integration: ${config.label}`}
            >
                <span
                    className={`w-2.5 h-2.5 rounded-full ${config.dotColor} ring-2 ${config.ringColor}`}
                />
            </button>

            {/* Popover dropdown */}
            {open && (
                <div
                    className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden"
                    role="dialog"
                    aria-label="Integration status details"
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                            <span className={`text-sm font-medium ${config.labelColor}`}>
                                {config.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Integration Status</p>
                    </div>

                    {/* Details */}
                    <div className="px-4 py-3 space-y-2.5 text-sm">
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 text-xs">Phone Number</span>
                            <span className="text-slate-800 text-xs font-medium text-right">
                                {details?.phoneNumber || 'Not connected'}
                            </span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 text-xs">API Health</span>
                            <span className={`text-xs font-medium ${config.labelColor}`}>
                                {config.label}
                            </span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 text-xs">Last Webhook</span>
                            <span className="text-slate-800 text-xs font-medium text-right">
                                {formatTimestamp(details?.lastWebhookAt)}
                            </span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 text-xs">Queue Depth</span>
                            <span className="text-slate-800 text-xs font-medium">
                                {details?.pendingQueueDepth != null
                                    ? details.pendingQueueDepth
                                    : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntegrationStatusBadge;
