/**
 * WhatsAppSetupPage.jsx
 *
 * Step-by-step guide for connecting WhatsApp via wa.homeintown.in.
 * Allows users to paste credentials directly from this page.
 */

import { useState } from 'react';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    'https://lead-filteration-backend-624770114041.asia-south1.run.app';

const ownersApi = axios.create({
    baseURL: `${API_BASE_URL}/api/owners`,
    withCredentials: true,
});

const WA_PORTAL_URL = 'https://wa.homeintown.in/auth/login';

// ── Step Card ────────────────────────────────────────────────────────────────

function StepCard({ number, title, description, action }) {
    return (
        <div className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 shadow-sm">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                <span className="text-sm font-black text-[#25D366]">{number}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
                {action && <div className="mt-3">{action}</div>}
            </div>
        </div>
    );
}

// ── Connection Status Badge ──────────────────────────────────────────────────

function StatusBadge({ connected }) {
    if (connected === null) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
            connected
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {connected ? 'Connected' : 'Not Connected'}
        </span>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppSetupPage() {
    const { addToast } = useNotifications();

    const [vendorUid, setVendorUid] = useState('');
    const [apiKey, setApiKey]       = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [showVendorUid, setShowVendorUid] = useState(false);
    const [saving, setSaving]       = useState(false);
    const [connected, setConnected] = useState(null); // null | true | false

    const cardClass = 'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

    const inputClass = 'w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-300 outline-none transition-all focus:border-[#25D366] focus:bg-white dark:focus:bg-[#1e293b] pr-12';

    // Load existing credentials on mount
    useState(() => {
        ownersApi.get('/integrations')
            .then(res => {
                const wa = res.data.whatsapp || {};
                if (wa.vendorUid) setVendorUid(wa.vendorUid);
                if (wa.apiKey)    setApiKey(wa.apiKey);
                if (wa.vendorUid && wa.apiKey) setConnected(true);
            })
            .catch(() => {});
    });

    const handleSave = async (e) => {
        e.preventDefault();
        if (!vendorUid.trim() || !apiKey.trim()) {
            addToast('Both Vendor UID and API Key are required', 'warning');
            return;
        }

        try {
            setSaving(true);
            await ownersApi.put('/integrations/whatsapp', { vendorUid, apiKey });
            setConnected(true);
            addToast('WhatsApp credentials saved successfully!', 'success');
        } catch (err) {
            console.error(err);
            addToast('Failed to save credentials. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm('Remove WhatsApp credentials? Outreach will stop working.')) return;
        try {
            await ownersApi.put('/integrations/whatsapp', { vendorUid: '', apiKey: '' });
            setVendorUid('');
            setApiKey('');
            setConnected(false);
            addToast('WhatsApp credentials removed', 'success');
        } catch {
            addToast('Failed to remove credentials', 'error');
        }
    };

    return (
        <div className="animate-fade-in pb-10">
            <div className="mx-auto max-w-3xl px-4">

                {/* ── Header ──────────────────────────────────────────── */}
                <div className={`${cardClass} mb-6 p-6 md:p-8`}>
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl">chat</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                    WhatsApp Setup
                                </h1>
                                <StatusBadge connected={connected} />
                            </div>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                Connect via wa.homeintown.in
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Steps ───────────────────────────────────────────── */}
                <div className={`${cardClass} mb-6 p-6 md:p-8`}>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5">
                        How to get your credentials
                    </h2>
                    <div className="space-y-3">
                        <StepCard
                            number="1"
                            title="Open the WhatsApp portal"
                            description="Click the button below to open wa.homeintown.in in a new tab. Log in or create your account there."
                            action={
                                <a
                                    href={WA_PORTAL_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow hover:bg-[#20b858] transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                    Open wa.homeintown.in
                                </a>
                            }
                        />

                        <StepCard
                            number="2"
                            title="Generate your API credentials"
                            description="After logging in, go to Settings → API Keys (or Credentials). Generate a new Vendor UID and API Key."
                        />

                        <StepCard
                            number="3"
                            title="Copy and paste below"
                            description="Copy the Vendor UID and API Key from the portal and paste them into the fields below. Click Save."
                        />
                    </div>
                </div>

                {/* ── Credentials Form ────────────────────────────────── */}
                <div className={`${cardClass} p-6 md:p-8`}>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">
                        Paste your credentials
                    </h2>

                    <form onSubmit={handleSave} className="space-y-5">

                        {/* Vendor UID */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                                Vendor UID
                            </label>
                            <div className="relative">
                                <input
                                    type={showVendorUid ? 'text' : 'password'}
                                    value={vendorUid}
                                    onChange={e => setVendorUid(e.target.value)}
                                    placeholder="Paste your Vendor UID here"
                                    className={inputClass}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowVendorUid(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {showVendorUid ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* API Key */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                                API Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="Paste your API Key here"
                                    className={inputClass}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {showApiKey ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 pt-1">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-md hover:bg-[#20b858] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {saving
                                    ? <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full" /> Saving…</>
                                    : <><span className="material-symbols-outlined text-base">save</span> Save Credentials</>
                                }
                            </button>

                            {connected && (
                                <button
                                    type="button"
                                    onClick={handleDisconnect}
                                    className="flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-[#1e293b] px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                                >
                                    <span className="material-symbols-outlined text-base">link_off</span>
                                    Disconnect
                                </button>
                            )}
                        </div>

                    </form>

                    {/* Help note */}
                    <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 p-4">
                        <span className="material-symbols-outlined text-slate-400 text-base flex-shrink-0 mt-0.5">info</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Your credentials are stored securely and only used to send WhatsApp messages on your behalf.
                            They are never shared with other users.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
