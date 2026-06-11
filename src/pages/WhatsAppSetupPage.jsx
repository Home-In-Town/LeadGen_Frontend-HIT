/**
 * WhatsAppSetupPage.jsx
 * Three-option wizard for connecting WhatsApp Business directly to OneEmployee.
 * No external redirects — everything managed in-page.
 * Requirements: 1.1–1.8, 2.2, 13.1–13.7
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-filteration-backend-624770114041.asia-south1.run.app';
const META_APP_ID  = import.meta.env.VITE_META_APP_ID  || '1275388667714234';
const SIGNUP_CONFIG_ID = import.meta.env.VITE_META_SIGNUP_CONFIG_ID || '1005112248795110';

const waApi = axios.create({ baseURL: `${API_BASE_URL}/api/whatsapp`, withCredentials: true });

function StatusBadge({ connected }) {
    if (connected === null) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
            connected
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {connected ? 'Connected' : 'Not Connected'}
        </span>
    );
}

function OptionCard({ selected, onClick, icon, title, description, badge }) {
    return (
        <button type="button" onClick={onClick}
            className={`w-full text-left flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${
                selected
                    ? 'border-[#25D366] bg-[#25D366]/5'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-[#25D366]/40'
            }`}>
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#25D366] text-xl">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                    {badge && <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366]">{badge}</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </div>
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-colors ${selected ? 'border-[#25D366] bg-[#25D366]' : 'border-slate-300 dark:border-white/20'}`}>
                {selected && <div className="w-full h-full flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white" /></div>}
            </div>
        </button>
    );
}

export default function WhatsAppSetupPage() {
    const { addToast } = useNotifications();
    const navigate = useNavigate();

    const [selectedOption, setSelectedOption] = useState(null);
    const [step, setStep] = useState('select');
    const [saving, setSaving] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [connected, setConnected] = useState(null);
    const [manual, setManual] = useState({ phoneNumberId: '', wabaId: '', accessToken: '', label: '' });
    const [showToken, setShowToken] = useState(false);
    const [errors, setErrors] = useState({});

    const cardClass = 'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';
    const inputClass = 'w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-300 outline-none transition-all focus:border-[#25D366] focus:bg-white dark:focus:bg-[#1e293b]';

    useEffect(() => {
        waApi.get('/phone-numbers')
            .then(res => {
                if (res.data.success && res.data.data?.length > 0) {
                    setPhoneNumbers(res.data.data);
                    setConnected(true);
                    setStep('connected');
                } else {
                    setConnected(false);
                }
            })
            .catch(() => setConnected(false));
    }, []);

    useEffect(() => {
        if (!META_APP_ID) return;
        window.fbAsyncInit = function () {
            window.FB?.init({ appId: META_APP_ID, version: 'v20.0', xfbml: false, cookie: false });
        };
        if (!document.getElementById('fb-sdk')) {
            const script = document.createElement('script');
            script.id = 'fb-sdk';
            script.src = 'https://connect.facebook.net/en_US/sdk.js';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }
    }, []);

    const reloadPhoneNumbers = async () => {
        try {
            const res = await waApi.get('/phone-numbers');
            if (res.data.success) setPhoneNumbers(res.data.data || []);
        } catch {}
    };

    const launchEmbeddedSignup = () => {
        if (!window.FB) {
            addToast('Meta SDK not loaded yet. Please wait a moment and try again.', 'error');
            return;
        }
        setConnecting(true);
        window.FB.login(async (response) => {
            if (response?.authResponse?.code) {
                try {
                    const res = await waApi.post('/connect/meta-oauth', { code: response.authResponse.code });
                    if (res.data.success) {
                        addToast(`Connected ${res.data.data.addedPhoneNumbers?.length || 0} number(s) successfully!`, 'success');
                        setConnected(true);
                        setStep('connected');
                        await reloadPhoneNumbers();
                    } else {
                        addToast(res.data.error || 'Connection failed', 'error');
                    }
                } catch (err) {
                    addToast(err.response?.data?.error || 'OAuth exchange failed', 'error');
                }
            } else {
                addToast('Meta Embedded Signup was cancelled.', 'warning');
            }
            setConnecting(false);
        }, {
            config_id: SIGNUP_CONFIG_ID,
            response_type: 'code',
            override_default_response_type: true,
            extras: { setup: {}, featureType: '', sessionInfoVersion: '2' }
        });
    };

    const validateManual = () => {
        const e = {};
        if (!manual.phoneNumberId.trim()) e.phoneNumberId = 'Phone Number ID is required';
        if (!manual.wabaId.trim()) e.wabaId = 'WABA ID is required';
        if (!manual.accessToken.trim()) e.accessToken = 'Access Token is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleManualSave = async (e) => {
        e.preventDefault();
        if (!validateManual()) return;
        try {
            setSaving(true);
            const res = await waApi.post('/phone-numbers', {
                phoneNumberId: manual.phoneNumberId.trim(),
                wabaId: manual.wabaId.trim(),
                accessToken: manual.accessToken.trim(),
                label: manual.label.trim() || undefined
            });
            if (res.data.success) {
                addToast('WhatsApp number connected successfully!', 'success');
                setConnected(true);
                setStep('connected');
                await reloadPhoneNumbers();
            } else {
                addToast(res.data.error || 'Failed to save', 'error');
            }
        } catch (err) {
            if (err.response?.status === 409) {
                addToast('This phone number ID is already registered.', 'warning');
            } else {
                addToast(err.response?.data?.error || 'Failed to save credentials', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleProceed = () => {
        if (!selectedOption) { addToast('Please select a connection option', 'warning'); return; }
        if (selectedOption === 'embedded' || selectedOption === 'existing') {
            launchEmbeddedSignup();
        } else {
            setStep('form');
        }
    };

    const handleDisconnect = async (phoneNumberId) => {
        if (!window.confirm('Remove this WhatsApp number? Outreach for this number will stop.')) return;
        try {
            await waApi.delete(`/phone-numbers/${phoneNumberId}`);
            await reloadPhoneNumbers();
            const updated = await waApi.get('/phone-numbers');
            const nums = updated.data.data || [];
            if (nums.length === 0) { setConnected(false); setStep('select'); }
            addToast('Number removed', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to remove number', 'error');
        }
    };

    const handleSetDefault = async (phoneNumberId) => {
        try {
            await waApi.patch(`/phone-numbers/${phoneNumberId}/default`);
            await reloadPhoneNumbers();
            addToast('Default number updated', 'success');
        } catch {
            addToast('Failed to set default', 'error');
        }
    };

    return (
        <div className="animate-fade-in pb-10">
            <div className="mx-auto max-w-3xl px-4">

                {/* Header */}
                <div className={`${cardClass} mb-6 p-6 md:p-8`}>
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl">chat</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">WhatsApp Setup</h1>
                                <StatusBadge connected={connected} />
                            </div>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Direct Meta WhatsApp Cloud API</p>
                        </div>
                        {connected && (
                            <button onClick={() => navigate('/whatsapp-templates')}
                                className="flex items-center gap-2 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#25D366] hover:bg-[#25D366]/10 transition-all">
                                <span className="material-symbols-outlined text-base">description</span>
                                Templates
                            </button>
                        )}
                    </div>
                </div>

                {/* Connected — phone number list */}
                {step === 'connected' && phoneNumbers.length > 0 && (
                    <div className={`${cardClass} mb-6 p-6 md:p-8`}>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5">Connected Numbers</h2>
                        <div className="space-y-3">
                            {phoneNumbers.map(num => (
                                <div key={num.id || num.phoneNumberId} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{num.display_phone_number || num.displayPhoneNumber}</p>
                                            {num.isDefault && <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366]">Default</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{num.verified_name || num.verifiedName} • Quality: {num.quality_rating || num.qualityRating || '—'}</p>
                                    </div>
                                    {!num.isDefault && (
                                        <button onClick={() => handleSetDefault(num.id || num.phoneNumberId)}
                                            className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:border-[#25D366] hover:text-[#25D366] transition-all">
                                            Set Default
                                        </button>
                                    )}
                                    <button onClick={() => handleDisconnect(num.id || num.phoneNumberId)}
                                        className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setStep('select')}
                            className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined text-base">add_circle</span>
                            Add another number
                        </button>
                    </div>
                )}

                {/* Option selector */}
                {step === 'select' && (
                    <div className={`${cardClass} mb-6 p-6 md:p-8`}>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5">Choose connection method</h2>
                        <div className="space-y-3">
                            <OptionCard selected={selectedOption === 'embedded'} onClick={() => setSelectedOption('embedded')}
                                icon="login" title="Connect via Meta Embedded Signup" badge="Recommended"
                                description="Connect your WhatsApp Business Account directly through Meta's secure in-page flow. No redirects." />
                            <OptionCard selected={selectedOption === 'existing'} onClick={() => setSelectedOption('existing')}
                                icon="phone_forwarded" title="Use an existing WhatsApp Business number"
                                description="Already have a verified WhatsApp Business number on Meta? Import it directly. Your existing templates stay intact." />
                            <OptionCard selected={selectedOption === 'manual'} onClick={() => setSelectedOption('manual')}
                                icon="edit_note" title="Enter credentials manually"
                                description="Already have your Phone Number ID, WABA ID, and Access Token? Paste them here." />
                        </div>
                        <button type="button" onClick={handleProceed} disabled={!selectedOption || connecting}
                            className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-md hover:bg-[#20b858] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                            {connecting
                                ? <><span className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full" /> Connecting…</>
                                : <><span className="material-symbols-outlined text-base">arrow_forward</span> Continue</>}
                        </button>
                    </div>
                )}

                {/* Manual form */}
                {step === 'form' && (
                    <div className={`${cardClass} p-6 md:p-8`}>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Enter your credentials</h2>
                        <form onSubmit={handleManualSave} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Phone Number ID *</label>
                                <input type="text" value={manual.phoneNumberId} onChange={e => setManual(m => ({ ...m, phoneNumberId: e.target.value }))}
                                    placeholder="From Meta App Dashboard → WhatsApp → API Setup" className={inputClass} autoComplete="off" />
                                {errors.phoneNumberId && <p className="mt-1 text-xs text-red-500">{errors.phoneNumberId}</p>}
                            </div>
                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">WABA ID *</label>
                                <input type="text" value={manual.wabaId} onChange={e => setManual(m => ({ ...m, wabaId: e.target.value }))}
                                    placeholder="WhatsApp Business Account ID" className={inputClass} autoComplete="off" />
                                {errors.wabaId && <p className="mt-1 text-xs text-red-500">{errors.wabaId}</p>}
                            </div>
                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Access Token *</label>
                                <div className="relative">
                                    <input type={showToken ? 'text' : 'password'} value={manual.accessToken}
                                        onChange={e => setManual(m => ({ ...m, accessToken: e.target.value }))}
                                        placeholder="System User Access Token (long-lived)" className={`${inputClass} pr-12`} autoComplete="off" />
                                    <button type="button" onClick={() => setShowToken(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                                        <span className="material-symbols-outlined text-lg">{showToken ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                                {errors.accessToken && <p className="mt-1 text-xs text-red-500">{errors.accessToken}</p>}
                            </div>
                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Label (optional)</label>
                                <input type="text" value={manual.label} onChange={e => setManual(m => ({ ...m, label: e.target.value }))}
                                    placeholder="e.g. Main Sales Number" className={inputClass} />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-md hover:bg-[#20b858] disabled:opacity-50 transition-all">
                                    {saving ? <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full" /> Saving…</> : <><span className="material-symbols-outlined text-base">save</span> Save</>}
                                </button>
                                <button type="button" onClick={() => setStep('select')}
                                    className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all">
                                    <span className="material-symbols-outlined text-base">arrow_back</span> Back
                                </button>
                            </div>
                        </form>
                        <div className="mt-6 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 p-4 flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-slate-400 text-base flex-shrink-0 mt-0.5">info</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Your Access Token is encrypted before storage and is never shared. Get these values from <strong>Meta Business Manager → System Users → Generate Token</strong>.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
