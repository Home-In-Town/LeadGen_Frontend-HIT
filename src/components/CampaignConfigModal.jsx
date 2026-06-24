/**
 * CampaignConfigModal.jsx
 * Per-campaign automation settings: AI prompt, WA template, email template, toggles.
 */
import React, { useState, useEffect } from 'react';
import {
    updateFBCampaignConfig,
    listWATemplates,
    listEmailTemplates,
} from '../api';
import { useNotifications } from '../context/NotificationContext';

const cardClass =
    'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

function Toggle({ enabled, onChange, label, description }) {
    return (
        <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
                {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                    ${enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                    ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}

const CampaignConfigModal = ({ campaign, onClose, onSaved }) => {
    const { addToast } = useNotifications();

    // Form state — pre-fill from campaign
    const [aiPrompt,         setAiPrompt]         = useState(campaign.aiPrompt || '');
    const [aiPromptEnabled,  setAiPromptEnabled]  = useState(campaign.aiPromptEnabled || false);
    const [waTemplateName,   setWaTemplateName]   = useState(campaign.waTemplateName || '');
    const [waEnabled,        setWaEnabled]        = useState(campaign.waTemplateEnabled || false);
    const [emailTemplateName,setEmailTemplateName]= useState(campaign.emailTemplateName || '');
    const [emailEnabled,     setEmailEnabled]     = useState(campaign.emailTemplateEnabled || false);
    const [autoCall,         setAutoCall]         = useState(campaign.autoCallEnabled !== false);
    const [autoWa,           setAutoWa]           = useState(campaign.autoWaEnabled !== false);
    const [autoEmail,        setAutoEmail]        = useState(campaign.autoEmailEnabled || false);

    const [waTemplates,    setWaTemplates]    = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [saving,         setSaving]         = useState(false);
    const [activeTab,      setActiveTab]      = useState('ai');

    useEffect(() => {
        // Load available templates on mount
        listWATemplates().then(r => setWaTemplates(r.data?.data || r.data || [])).catch(() => setWaTemplates([]));
        listEmailTemplates().then(r => setEmailTemplates(r.data?.data || [])).catch(() => {});
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateFBCampaignConfig(campaign.campaignId, {
                aiPrompt,
                aiPromptEnabled,
                waTemplateName,
                waTemplateEnabled: waEnabled,
                emailTemplateName,
                emailTemplateEnabled: emailEnabled,
                autoCallEnabled: autoCall,
                autoWaEnabled: autoWa,
                autoEmailEnabled: autoEmail,
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
        { id: 'ai',       label: 'AI Prompt',    icon: 'smart_toy' },
        { id: 'whatsapp', label: 'WhatsApp',      icon: 'chat' },
        { id: 'email',    label: 'Email',         icon: 'mail' },
        { id: 'auto',     label: 'Automation',    icon: 'bolt' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`${cardClass} w-full max-w-2xl max-h-[90vh] flex flex-col`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 dark:border-white/10">
                    <div className="min-w-0">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
                            Campaign Settings
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{campaign.campaignName}</p>
                    </div>
                    <button onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 flex-shrink-0">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 px-4 pt-3 border-b border-slate-200/70 dark:border-white/10">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all
                                ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {/* AI Prompt tab */}
                    {activeTab === 'ai' && (
                        <div className="space-y-4">
                            <Toggle
                                enabled={aiPromptEnabled}
                                onChange={setAiPromptEnabled}
                                label="Enable Campaign AI Prompt"
                                description="When enabled, this prompt is appended to your base voice settings for leads from this campaign."
                            />
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
                                    Campaign AI Prompt
                                </label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    maxLength={3000}
                                    rows={8}
                                    placeholder="E.g.: This campaign is for Aaditya Residency project in Nagpur. Focus on 2BHK units starting ₹45L. Key USPs: RERA approved, ready possession, near metro."
                                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all resize-none"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 text-right">{aiPrompt.length}/3000</p>
                            </div>
                        </div>
                    )}

                    {/* WhatsApp tab */}
                    {activeTab === 'whatsapp' && (
                        <div className="space-y-4">
                            <Toggle
                                enabled={waEnabled}
                                onChange={setWaEnabled}
                                label="Use Campaign WhatsApp Template"
                                description="Overrides your default template for leads from this campaign."
                            />
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
                                    WhatsApp Template
                                </label>
                                <select
                                    value={waTemplateName}
                                    onChange={e => setWaTemplateName(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                                >
                                    <option value="">— Use default template —</option>
                                    {waTemplates.map(t => (
                                        <option key={t.name || t.id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                                {waTemplates.length === 0 && (
                                    <p className="text-xs text-slate-400 mt-1">No templates found. Create templates in WhatsApp Setup.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Email tab */}
                    {activeTab === 'email' && (
                        <div className="space-y-4">
                            <Toggle
                                enabled={emailEnabled}
                                onChange={setEmailEnabled}
                                label="Use Campaign Email Template"
                                description="Sends this email template automatically when a lead arrives from this campaign."
                            />
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
                                    Email Template
                                </label>
                                <select
                                    value={emailTemplateName}
                                    onChange={e => setEmailTemplateName(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                                >
                                    <option value="">— Select email template —</option>
                                    {emailTemplates.map(t => (
                                        <option key={t._id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                                {emailTemplates.length === 0 && (
                                    <p className="text-xs text-slate-400 mt-1">No templates yet. Create one in Email Templates.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Automation tab */}
                    {activeTab === 'auto' && (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 mb-2">Control which automation channels fire when a new lead arrives from this campaign.</p>
                            <Toggle
                                enabled={autoCall}
                                onChange={setAutoCall}
                                label="AI Voice Call"
                                description="Automatically call leads from this campaign using the AI agent."
                            />
                            <Toggle
                                enabled={autoWa}
                                onChange={setAutoWa}
                                label="WhatsApp Message"
                                description="Automatically send a WhatsApp welcome message to new leads."
                            />
                            <Toggle
                                enabled={autoEmail}
                                onChange={setAutoEmail}
                                label="Email"
                                description="Automatically send an email to new leads (requires email connection)."
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200/70 dark:border-white/10">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-[0.2em] py-3 transition-all"
                    >
                        {saving ? 'Saving…' : 'Save Settings'}
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignConfigModal;
