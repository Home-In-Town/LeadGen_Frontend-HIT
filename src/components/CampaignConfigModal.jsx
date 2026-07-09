/**
 * CampaignConfigModal.jsx
 * Per-campaign automation settings: AI prompt, WA template, email template, channel toggles.
 *
 * Design rules:
 *  - AI Prompt tab  : prompt is used automatically when non-empty (no separate enable toggle)
 *  - WhatsApp tab   : selecting a template means it's active; blank = use default
 *  - Email tab      : selecting a template means it's active; blank = don't send email
 *  - Automation tab : 3 master on/off toggles (Call / WhatsApp / Email)
 *    → WhatsApp toggle is LOCKED (off + disabled) when WhatsApp is not connected
 *    → Email toggle is LOCKED (off + disabled) when Email is not connected
 *  - One Save button at the bottom saves ALL tabs at once — no need to re-save per tab
 */
import React, { useState, useEffect } from 'react';
import {
    updateFBCampaignConfig,
    listWATemplates,
    listEmailTemplates,
    getChannelStatus,
} from '../api';
import { useNotifications } from '../context/NotificationContext';

const cardClass =
    'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

/**
 * Toggle — on/off switch.
 * When locked=true: always shows as off, disabled, with a tooltip explaining why.
 */
function Toggle({ enabled, onChange, label, description, locked, lockedReason }) {
    return (
        <div className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all ${
            locked
                ? 'border-slate-200/50 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] opacity-60'
                : 'border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]'
        }`}>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
                    {locked && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-full">
                            <span className="material-symbols-outlined text-[11px]">lock</span>
                            Not connected
                        </span>
                    )}
                </div>
                {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
                {locked && lockedReason && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">{lockedReason}</p>
                )}
            </div>
            <button
                type="button"
                onClick={() => !locked && onChange(!enabled)}
                disabled={locked}
                title={locked ? lockedReason : undefined}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                    locked
                        ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed'
                        : enabled
                            ? 'bg-blue-600 cursor-pointer'
                            : 'bg-slate-300 dark:bg-slate-600 cursor-pointer'
                }`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    !locked && enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
            </button>
        </div>
    );
}

const CampaignConfigModal = ({ campaign, onClose, onSaved }) => {
    const { addToast } = useNotifications();

    // ── form state — pre-filled from campaign doc ──────────────────────────
    const [aiPrompt,          setAiPrompt]          = useState(campaign.aiPrompt || '');
    const [waTemplateName,    setWaTemplateName]    = useState(campaign.waTemplateName || '');
    const [emailTemplateName, setEmailTemplateName] = useState(campaign.emailTemplateName || '');

    // Automation master toggles (Automation tab only)
    const [autoCall,  setAutoCall]  = useState(campaign.autoCallEnabled  !== false);
    const [autoWa,    setAutoWa]    = useState(campaign.autoWaEnabled    !== false);
    const [autoEmail, setAutoEmail] = useState(campaign.autoEmailEnabled === true);

    // Channel connectivity status — controls which toggles are locked
    const [channelStatus, setChannelStatus] = useState({ voice: true, whatsapp: null, email: null });

    const [waTemplates,    setWaTemplates]    = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [saving,         setSaving]         = useState(false);
    const [activeTab,      setActiveTab]      = useState('ai');

    useEffect(() => {
        listWATemplates().then(r => setWaTemplates(r.data?.data || r.data || [])).catch(() => setWaTemplates([]));
        listEmailTemplates().then(r => setEmailTemplates(r.data?.data || [])).catch(() => {});
        // Fetch channel connectivity status
        getChannelStatus()
            .then(r => {
                if (r.data?.success) {
                    setChannelStatus({ voice: true, whatsapp: r.data.whatsapp, email: r.data.email });
                    // If WhatsApp is not connected, force autoWa OFF
                    if (!r.data.whatsapp) setAutoWa(false);
                    // If Email is not connected, force autoEmail OFF
                    if (!r.data.email) setAutoEmail(false);
                }
            })
            .catch(() => {
                setChannelStatus({ voice: true, whatsapp: null, email: null });
            });
    }, []);

    /** Single save — persists every tab's state in one request */
    const handleSave = async () => {
        setSaving(true);
        try {
            await updateFBCampaignConfig(campaign.campaignId, {
                aiPrompt,
                aiPromptEnabled: aiPrompt.trim().length > 0,
                waTemplateName,
                waTemplateEnabled: waTemplateName.trim().length > 0,
                emailTemplateName,
                emailTemplateEnabled: emailTemplateName.trim().length > 0,
                autoCallEnabled:  autoCall,
                autoWaEnabled:    channelStatus.whatsapp === false ? false : autoWa,
                autoEmailEnabled: channelStatus.email    === false ? false : autoEmail,
            });
            addToast('Campaign settings saved.', 'success');
            if (onSaved) onSaved();
            onClose();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to save settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'ai',       label: 'AI Prompt', icon: 'smart_toy' },
        { id: 'whatsapp', label: 'WhatsApp',   icon: 'chat' },
        { id: 'email',    label: 'Email',      icon: 'mail' },
        { id: 'auto',     label: 'Automation', icon: 'bolt' },
    ];

    const waLocked    = channelStatus.whatsapp === false;
    const emailLocked = channelStatus.email    === false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`${cardClass} w-full max-w-2xl max-h-[90vh] flex flex-col`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 dark:border-white/10">
                    <div className="min-w-0">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">Campaign Settings</h2>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{campaign.campaignName}</p>
                    </div>
                    <button onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 flex-shrink-0">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 px-4 pt-3 border-b border-slate-200/70 dark:border-white/10 pb-0">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-[0.15em] rounded-t-xl transition-all mb-[-1px]
                                ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white border border-blue-600'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {activeTab === 'ai' && (
                        <div className="space-y-3">
                            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-500 text-[16px] mt-0.5">info</span>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    This prompt is <strong>automatically appended</strong> to the base voice settings for every call from this campaign — as long as the field is not empty. No toggle needed.
                                </p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Campaign AI Prompt</label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    maxLength={3000}
                                    rows={9}
                                    placeholder="E.g.: This campaign is for Aaditya Residency in Nagpur. Focus on 2BHK units starting ₹45L."
                                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all resize-none"
                                />
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-[10px] text-slate-400">Leave empty to use only the base voice prompt.</p>
                                    <p className="text-[10px] text-slate-400">{aiPrompt.length}/3000</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <div className="space-y-3">
                            {waLocked ? (
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex items-start gap-2">
                                    <span className="material-symbols-outlined text-amber-500 text-[16px] mt-0.5">warning</span>
                                    <div>
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">WhatsApp not connected</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                            Connect a WhatsApp number in <strong>WhatsApp Setup</strong> to enable this channel.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-start gap-2">
                                    <span className="material-symbols-outlined text-emerald-500 text-[16px] mt-0.5">info</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Selecting a template here <strong>overrides the default</strong> WhatsApp message for leads from this campaign.
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">WhatsApp Template</label>
                                <select
                                    value={waTemplateName}
                                    onChange={e => setWaTemplateName(e.target.value)}
                                    disabled={waLocked}
                                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${waLocked ? 'border-slate-200/50 bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500'}`}
                                >
                                    <option value="">— Use default template —</option>
                                    {waTemplates.map(t => <option key={t.name || t.id} value={t.name}>{t.name}</option>)}
                                </select>
                                {!waLocked && waTemplateName && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-bold">✓ &quot;{waTemplateName}&quot; will be sent for leads from this campaign.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'email' && (
                        <div className="space-y-3">
                            {emailLocked ? (
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex items-start gap-2">
                                    <span className="material-symbols-outlined text-amber-500 text-[16px] mt-0.5">warning</span>
                                    <div>
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Email not connected</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                            Connect Gmail or Outlook in <strong>Integrations</strong> to enable email automation.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-start gap-2">
                                    <span className="material-symbols-outlined text-violet-500 text-[16px] mt-0.5">info</span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Selecting a template here <strong>sends that email</strong> to new leads from this campaign.
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Email Template</label>
                                <select
                                    value={emailTemplateName}
                                    onChange={e => setEmailTemplateName(e.target.value)}
                                    disabled={emailLocked}
                                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${emailLocked ? 'border-slate-200/50 bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500'}`}
                                >
                                    <option value="">— No email (leave blank to skip) —</option>
                                    {emailTemplates.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
                                </select>
                                {!emailLocked && emailTemplateName && (
                                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 font-bold">✓ &quot;{emailTemplateName}&quot; will be emailed to leads from this campaign.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'auto' && (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 mb-2">
                                Master on/off switches. Channels requiring an integration are locked until connected.
                            </p>
                            <Toggle enabled={autoCall} onChange={setAutoCall} label="AI Voice Call" description="Automatically call new leads from this campaign using the AI agent." />
                            <Toggle enabled={autoWa} onChange={setAutoWa} label="WhatsApp Message" description="Automatically send a WhatsApp message to new leads from this campaign." locked={waLocked} lockedReason="Connect a WhatsApp number in WhatsApp Setup to enable this." />
                            <Toggle enabled={autoEmail} onChange={setAutoEmail} label="Email" description="Automatically send an email to new leads (requires email connected + template selected)." locked={emailLocked} lockedReason="Connect Gmail or Outlook in Integrations to enable this." />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200/70 dark:border-white/10">
                    <button onClick={handleSave} disabled={saving} className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-[0.2em] py-3 transition-all">
                        {saving ? 'Saving…' : 'Save Settings'}
                    </button>
                    <button onClick={onClose} className="rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignConfigModal;
