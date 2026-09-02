/**
 * WhatsAppSetupPage.jsx
 * Three-option wizard for connecting WhatsApp Business directly to OneEmployee.
 * No external redirects — everything managed in-page.
 * Requirements: 1.1–1.8, 2.2, 13.1–13.7
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
    listWAPhoneNumbers,
    addWAPhoneNumber,
    removeWAPhoneNumber,
    disconnectAllWA,
    setDefaultWAPhone,
    connectMetaOAuth,
} from '../api';

// NO FALLBACK VALUES HERE ON PURPOSE. These used to default to the old
// OneEmployeeWap app id and its signup config id. Vite inlines env vars at build
// time, so a build missing these silently shipped a customer-facing onboarding
// flow pointed at an app Meta has restricted from onboarding — which looks like
// "Embedded Signup is broken" with nothing in the logs. Missing config must be
// visible instead, so the UI below refuses to launch and says what is missing.
const META_APP_ID      = import.meta.env.VITE_META_APP_ID || '';
const SIGNUP_CONFIG_ID = import.meta.env.VITE_META_SIGNUP_CONFIG_ID || '';
const SIGNUP_CONFIGURED = Boolean(META_APP_ID && SIGNUP_CONFIG_ID);

const FB_SDK_URL = 'https://connect.facebook.net/en_US/sdk.js';
const FB_SDK_TIMEOUT_MS = 15000;

/**
 * Module-level singleton for loading + initialising the Facebook JS SDK.
 *
 * Presence of window.FB must NOT be treated as readiness. The URL above is a
 * LOADER: it defines window.FB and then fetches the real implementation from
 * connect.facebook.net/en_US/bundle/sdk.js/sdk.js. Calling FB.init() during that
 * gap neither throws nor sticks, so anything that polls for window.FB and then
 * calls init() will believe it succeeded while the SDK still considers itself
 * uninitialised — which surfaces later as "FB.login() called before FB.init()".
 *
 * fbAsyncInit is the only hook the SDK guarantees to invoke AFTER the real
 * implementation is in place, so init() happens there and nowhere else.
 *
 * Being module-level (not per-mount) also removes the remount race: the second
 * mount reuses the same promise instead of racing a half-loaded script tag.
 *
 * @returns {Promise<object>} resolves with the initialised window.FB
 */
let fbSdkPromise = null;

function loadFacebookSdk(appId) {
    if (fbSdkPromise) return fbSdkPromise;

    fbSdkPromise = new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            // Let a later attempt retry rather than caching the failure forever.
            fbSdkPromise = null;
            reject(new Error('Meta SDK did not finish loading. An ad blocker or network policy may be blocking connect.facebook.net.'));
        }, FB_SDK_TIMEOUT_MS);

        window.fbAsyncInit = () => {
            if (settled) return;
            try {
                window.FB.init({ appId, version: 'v20.0', xfbml: false, cookie: false });
                settled = true;
                clearTimeout(timer);
                resolve(window.FB);
            } catch (err) {
                settled = true;
                clearTimeout(timer);
                fbSdkPromise = null;
                reject(err);
            }
        };

        if (!document.getElementById('fb-sdk')) {
            const script = document.createElement('script');
            script.id = 'fb-sdk';
            script.src = FB_SDK_URL;
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            script.onerror = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                fbSdkPromise = null;
                reject(new Error('Could not load the Meta SDK. Check your connection or any ad blocker.'));
            };
            document.body.appendChild(script);
        }
        // If the tag is already there, fbAsyncInit above is now registered and the
        // SDK will call it when it finishes. The timeout covers the one case this
        // cannot recover from: the tag exists and fbAsyncInit already fired before
        // this module was evaluated.
    });

    return fbSdkPromise;
}
// Use the correct backend URL from env for register endpoint (needs raw axios for the one non-standard call)
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-filteration-backend-vvsvqafcoa-el.a.run.app';

function StatusBadge({ connected, pending }) {
    if (connected === null) return null;
    if (pending) {
        return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Pending Verification
            </span>
        );
    }
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
    // True only after FB.init() has actually run — window.FB being present is not enough.
    const [sdkReady, setSdkReady] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [connected, setConnected] = useState(null);
    const [manual, setManual] = useState({ phoneNumberId: '', wabaId: '', accessToken: '', label: '' });
    const [showToken, setShowToken] = useState(false);
    const [errors, setErrors] = useState({});

    const cardClass = 'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';
    const inputClass = 'w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-300 outline-none transition-all focus:border-[#25D366] focus:bg-white dark:focus:bg-[#1e293b]';

    useEffect(() => {
        listWAPhoneNumbers()
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

    // Start loading the SDK on mount so it is usually ready by the time the user
    // clicks. Readiness only drives the button label — launchEmbeddedSignup awaits
    // the same promise, so clicking before this resolves waits rather than failing.
    useEffect(() => {
        if (!SIGNUP_CONFIGURED) return;
        let cancelled = false;
        loadFacebookSdk(META_APP_ID)
            .then(() => { if (!cancelled) setSdkReady(true); })
            .catch((err) => {
                console.error('[WhatsAppSetup] Meta SDK load failed', err);
                if (!cancelled) addToast(err.message, 'error');
            });
        return () => { cancelled = true; };
    }, [addToast]);

    const reloadPhoneNumbers = async () => {
        try {
            const res = await listWAPhoneNumbers();
            if (res.data.success && res.data.data?.length > 0) {
                setPhoneNumbers(res.data.data);
                setConnected(true);
                setStep('connected');
            } else {
                setPhoneNumbers([]);
                setConnected(false);
                setStep('select');
            }
        } catch {
            // API returns 400 when no numbers exist
            setPhoneNumbers([]);
            setConnected(false);
            setStep('select');
        }
    };

    const launchEmbeddedSignup = async () => {
        if (!SIGNUP_CONFIGURED) {
            addToast('WhatsApp onboarding is not configured on this build (VITE_META_APP_ID / VITE_META_SIGNUP_CONFIG_ID). Use manual entry, or ask the team to redeploy.', 'error');
            return;
        }
        setConnecting(true);

        // Wait for the SDK rather than rejecting an early click. Awaiting the shared
        // promise also guarantees FB.init() has actually run, which a boolean set
        // from a polled window.FB could not.
        let FB;
        try {
            FB = await loadFacebookSdk(META_APP_ID);
        } catch (err) {
            addToast(err.message, 'error');
            setConnecting(false);
            return;
        }

        // FB.login takes a callback, not a promise. Anything it throws synchronously
        // must be caught here — otherwise `connecting` is never cleared and the
        // button sits on "Connecting..." forever with nothing shown to the user.
        try {
            FB.login((response) => {
                if (response?.authResponse?.code) {
                    connectMetaOAuth(response.authResponse.code)
                        .then(res => {
                            if (res.data.success) {
                                addToast(`Connected ${res.data.data.addedPhoneNumbers?.length || 0} number(s) successfully!`, 'success');
                                setConnected(true);
                                setStep('connected');
                                reloadPhoneNumbers();
                            } else {
                                addToast(res.data.error || 'Connection failed', 'error');
                            }
                        })
                        .catch(err => {
                            addToast(err.response?.data?.error || 'OAuth exchange failed', 'error');
                        })
                        .finally(() => {
                            setConnecting(false);
                        });
                } else {
                    addToast('Meta Embedded Signup was cancelled.', 'warning');
                    setConnecting(false);
                }
            }, {
                config_id: SIGNUP_CONFIG_ID,
                response_type: 'code',
                override_default_response_type: true,
                extras: { setup: {}, featureType: '', sessionInfoVersion: '2' }
            });
        } catch (err) {
            console.error('[WhatsAppSetup] FB.login threw', err);
            addToast(err?.message || 'Could not open the Meta signup window. Please retry.', 'error');
            setConnecting(false);
        }
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
            const res = await addWAPhoneNumber({
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
        if (!window.confirm('Remove this WhatsApp number? This will clear credentials from your account.')) return;
        try {
            // First try individual remove (works for array entries)
            await removeWAPhoneNumber(phoneNumberId);
        } catch {
            // If individual remove fails (e.g. legacy-only number), use disconnect-all
            try {
                await disconnectAllWA();
            } catch (err2) {
                addToast(err2.response?.data?.error || 'Failed to remove number', 'error');
                return;
            }
        }
        await reloadPhoneNumbers();
        addToast('WhatsApp number removed and credentials cleared', 'success');
    };

    const handleDisconnectAll = async () => {
        if (!window.confirm('Clear ALL WhatsApp credentials from your account? You will need to re-connect.')) return;
        try {
            await disconnectAllWA();
            await reloadPhoneNumbers();
            addToast('All WhatsApp credentials cleared. You can now reconnect.', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to clear credentials', 'error');
        }
    };

    const handleSetDefault = async (phoneNumberId) => {
        try {
            await setDefaultWAPhone(phoneNumberId);
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
                                <StatusBadge
                                    connected={connected}
                                    pending={connected && phoneNumbers.length > 0 && phoneNumbers.every(p => p.status === 'PENDING' || p.status === 'PENDING_REVIEW' || (p.qualityRating === 'UNKNOWN' && p.status !== 'CONNECTED'))}
                                />
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
                                <div key={num.id || num.phoneNumberId} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                                    (num.status === 'PENDING' || num.status === 'PENDING_REVIEW')
                                        ? 'border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/5'
                                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]'
                                }`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{num.display_phone_number || num.displayPhoneNumber}</p>
                                            {num.isDefault && <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366]">Default</span>}
                                            {(num.status === 'PENDING' || num.status === 'PENDING_REVIEW' || num.quality_rating === 'UNKNOWN' || num.qualityRating === 'UNKNOWN') && num.status !== 'CONNECTED' && (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 animate-pulse">
                                                    Under Verification
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{num.verified_name || num.verifiedName} • Quality: {num.quality_rating || num.qualityRating || '—'}</p>
                                        {(num.status === 'PENDING' || num.qualityRating === 'UNKNOWN') && num.status !== 'CONNECTED' && (
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 leading-relaxed">
                                                Meta is reviewing your business. This typically takes 1-2 business days. You'll be able to send messages once verification is complete.
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={async () => {
                                        try {
                                            await axios.post(
                                                `${API_BASE_URL}/api/whatsapp/phone-numbers/${num.id || num.phoneNumberId}/register`,
                                                {},
                                                { withCredentials: true }
                                            );
                                            addToast('Phone number registered for messaging successfully!', 'success');
                                        } catch (e) {
                                            addToast('Registration failed: ' + (e.response?.data?.error || e.message), 'error');
                                        }
                                    }}
                                        className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all">
                                        Register
                                    </button>
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
                        <div className="mt-5 flex items-center justify-between">
                            <button onClick={() => setStep('select')}
                                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                                <span className="material-symbols-outlined text-base">add_circle</span>
                                Add another number
                            </button>
                            <button onClick={handleDisconnectAll}
                                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors">
                                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                Clear All &amp; Reset
                            </button>
                        </div>
                    </div>
                )}

                {/* Option selector */}
                {step === 'select' && (
                    <div className={`${cardClass} mb-6 p-6 md:p-8`}>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5">Choose connection method</h2>
                        {!SIGNUP_CONFIGURED && (
                            <div className="mb-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
                                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Embedded Signup is not configured on this build</p>
                                <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                                    VITE_META_APP_ID and VITE_META_SIGNUP_CONFIG_ID are missing, so the one-click flow
                                    cannot start. Manual credential entry below still works.
                                </p>
                            </div>
                        )}
                        <div className="space-y-3">
                            <OptionCard selected={selectedOption === 'embedded'} onClick={() => setSelectedOption('embedded')}
                                icon="login" title="Connect via Meta Embedded Signup" badge={SIGNUP_CONFIGURED ? 'Recommended' : 'Unavailable'}
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
                                ? <><span className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full" /> {sdkReady ? 'Connecting…' : 'Preparing Meta…'}</>
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
