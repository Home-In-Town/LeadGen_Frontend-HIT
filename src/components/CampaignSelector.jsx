/**
 * CampaignSelector.jsx
 *
 * Dropdown for selecting an optional Facebook campaign to link to a CSV upload.
 * Shows each campaign's name, status, and which automation channels are enabled.
 * Passes the selected campaignId (or null) to parent via onChange.
 *
 * Props:
 *   value           - selected campaignId or null
 *   onChange        - callback(campaignId | null)
 *   channelStatus   - { voice: bool, whatsapp: bool, email: bool } from /channel-status
 *                     When a channel is false (not connected), its badge is shown as locked.
 */

import { useState, useEffect } from 'react';
import { listFbCampaignsForUpload } from '../api';

// Small badge showing which channels are active for a campaign
// Dims/locks badges for channels that are not connected at the owner level
function ChannelBadges({ c, channelStatus }) {
    const waConnected    = channelStatus?.whatsapp !== false;
    const emailConnected = channelStatus?.email    !== false;

    return (
        <span className="flex items-center gap-1 flex-shrink-0">
            {c.autoCallEnabled !== false && (
                <span title="Voice call enabled" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold">
                    📞
                </span>
            )}
            {c.autoWaEnabled !== false && (
                <span
                    title={waConnected ? 'WhatsApp enabled' : 'WhatsApp not connected — will be skipped'}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        waConnected
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 line-through opacity-60'
                    }`}
                >
                    💬{!waConnected && ' 🔒'}
                </span>
            )}
            {c.autoEmailEnabled === true && (
                <span
                    title={emailConnected ? 'Email enabled' : 'Email not connected — will be skipped'}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        emailConnected
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 line-through opacity-60'
                    }`}
                >
                    ✉️{!emailConnected && ' 🔒'}
                </span>
            )}
        </span>
    );
}

export default function CampaignSelector({ value, onChange, channelStatus }) {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    useEffect(() => {
        listFbCampaignsForUpload()
            .then(res => setCampaigns(res.data?.campaigns || []))
            .catch(() => setError('Could not load Facebook campaigns'))
            .finally(() => setLoading(false));
    }, []);

    const selected = campaigns.find(c => c.campaignId === value);

    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Link to Facebook Campaign <span className="font-normal text-slate-400">(optional)</span>
            </label>

            {loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-slate-300 border-t-primary rounded-full" />
                    Loading campaigns…
                </div>
            ) : error ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">{error}</p>
            ) : (
                <div className="relative">
                    <select
                        value={value || ''}
                        onChange={e => onChange(e.target.value || null)}
                        className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">— None (use defaults: call + WhatsApp) —</option>
                        {campaigns.map(c => (
                            <option key={c.campaignId} value={c.campaignId}>
                                {c.campaignName || c.campaignId}
                            </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-slate-400">
                        expand_more
                    </span>
                </div>
            )}

            {/* Show selected campaign's channel config */}
            {selected && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Automation:</span>
                    <ChannelBadges c={selected} channelStatus={channelStatus} />
                    {selected.aiPromptEnabled && selected.aiPrompt && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold">
                            Custom AI prompt
                        </span>
                    )}
                    {selected.waTemplateEnabled && selected.waTemplateName && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={selected.waTemplateName}>
                            WA: {selected.waTemplateName}
                        </span>
                    )}
                </div>
            )}

            {!selected && !loading && (
                <p className="mt-1 text-[11px] text-slate-400">
                    When linked, automation channels and templates from the Facebook campaign config will be used.
                </p>
            )}
        </div>
    );
}
