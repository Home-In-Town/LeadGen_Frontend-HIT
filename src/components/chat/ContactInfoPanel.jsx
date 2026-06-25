/**
 * ContactInfoPanel — Collapsible right-side panel showing CRM lead details
 *
 * Props:
 * - lead: { id, first_name, last_name, phone_number, email, source, createdAt, score, status, statusReason, voiceCallData, campaignName, sourceForm }
 * - onAddNote: (noteText: string) => void
 * - onNavigateToProfile: () => void
 * - collapsed: boolean
 * - onToggleCollapse: () => void
 */

import React, { useState } from 'react';

/**
 * Returns the color class and label for a lead score.
 * - score >= 70 → green (HOT)
 * - score 40-69 → amber (WARM)
 * - score < 40 → red (COLD)
 */
export function getScoreColor(score) {
    if (score >= 70) return { color: 'text-green-600', bg: 'bg-green-100', label: 'HOT' };
    if (score >= 40) return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'WARM' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'COLD' };
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
}

const ContactInfoPanel = ({ lead, onAddNote, onNavigateToProfile, collapsed, onToggleCollapse }) => {
    const [noteText, setNoteText] = useState('');

    if (!lead) return null;

    const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';
    const scoreInfo = getScoreColor(lead.score ?? 0);

    const handleSaveNote = () => {
        const trimmed = noteText.trim();
        if (!trimmed) return;
        onAddNote(trimmed);
        setNoteText('');
    };

    // Collapsed state — render a slim toggle handle
    if (collapsed) {
        return (
            <div className="flex items-center justify-center border-l border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
                <button
                    onClick={onToggleCollapse}
                    className="p-2 text-slate-500 hover:text-emerald-600 transition-colors"
                    aria-label="Expand contact info panel"
                    title="Show contact info"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className="w-80 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Contact Info</h3>
                <button
                    onClick={onToggleCollapse}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    aria-label="Collapse contact info panel"
                    title="Hide contact info"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Lead Name & Score */}
            <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5">
                <p className="text-base font-semibold text-slate-900 dark:text-white">{name}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${scoreInfo.bg} ${scoreInfo.color}`}>
                        <span className={`w-2 h-2 rounded-full ${scoreInfo.color === 'text-green-600' ? 'bg-green-500' : scoreInfo.color === 'text-amber-600' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                        {lead.score ?? 0} — {scoreInfo.label}
                    </span>
                </div>
            </div>

            {/* Contact Details */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 space-y-2">
                <DetailRow label="Phone" value={lead.phone_number} />
                <DetailRow label="Email" value={lead.email} />
                <DetailRow label="Source" value={lead.source} />
                <DetailRow label="Created" value={formatDate(lead.createdAt)} />
            </div>

            {/* Status */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 space-y-2">
                <DetailRow label="Status" value={lead.status} />
                {lead.statusReason && <DetailRow label="Reason" value={lead.statusReason} />}
            </div>

            {/* AI Call Results */}
            {lead.voiceCallData && (
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">AI Call Results</p>
                    <div className="space-y-2">
                        <DetailRow label="Interest" value={lead.voiceCallData.interest} />
                        <DetailRow label="Budget" value={lead.voiceCallData.budget} />
                        <DetailRow label="Timeline" value={lead.voiceCallData.timeline} />
                    </div>
                </div>
            )}

            {/* Campaign Metadata */}
            {(lead.campaignName || lead.sourceForm) && (
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Campaign</p>
                    <div className="space-y-2">
                        {lead.campaignName && <DetailRow label="Campaign" value={lead.campaignName} />}
                        {lead.sourceForm && <DetailRow label="Source Form" value={lead.sourceForm} />}
                    </div>
                </div>
            )}

            {/* View Full Profile Link */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                <button
                    onClick={onNavigateToProfile}
                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors"
                >
                    View Full Profile →
                </button>
            </div>

            {/* Quick Note */}
            <div className="px-4 py-3 mt-auto">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Quick Note</p>
                <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <button
                    onClick={handleSaveNote}
                    disabled={!noteText.trim()}
                    className="mt-2 w-full px-3 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                    Save Note
                </button>
            </div>
        </div>
    );
};

/** Small helper for key-value detail rows */
function DetailRow({ label, value }) {
    return (
        <div className="flex items-start gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 w-16 flex-shrink-0">{label}</span>
            <span className="text-xs text-slate-700 dark:text-slate-300 break-all">{value || '—'}</span>
        </div>
    );
}

export default ContactInfoPanel;
