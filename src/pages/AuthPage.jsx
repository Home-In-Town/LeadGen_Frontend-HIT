import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

/**
 * AuthPage — Production auth with:
 *   login       : Email + PIN (fast, no OTP)
 *   register    : Name + Email + Mobile → OTP → Set PIN → done
 *   forgot-pin  : Email → OTP → Set new PIN → logged in
 *
 * screen values: 'login' | 'register' | 'register-otp' | 'pin-setup' |
 *                'forgot-pin' | 'reset-otp' | 'pin-reset'
 */

const THEME_STORAGE_KEY = 'hit-landing-theme';
const WIDGET_ID = '3666626c6773353035313636';
const TOKEN_AUTH = '498184TmHeaau86a1ec876P1';

function getInitialTheme() {
    if (typeof window === 'undefined') return 'light';
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
    } catch { /* ignore */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ── Icons ──────────────────────────────────────────────────────────────────
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
);

// ── Helpers ─────────────────────────────────────────────────────────────────
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidMobile = (m) => /^[6-9]\d{9}$/.test(m.replace(/\D/g, ''));
const isValidIdentifier = (v) => isValidEmail(v) || isValidMobile(v);
const identifierIsPhone = (v) => /^\d{10}$/.test(v.replace(/\D/g, '')) && /^[6-9]/.test(v.replace(/\D/g, ''));
const extractAccessToken = (data) => {
    // MSG91 verifyOtp success callback returns: { message: 'jwt_token_here', ... }
    // The JWT access token is in data.message
    if (data && typeof data === 'object') {
        if (typeof data.message === 'string' && data.message.length > 10) return data.message;
        if (typeof data.access_token === 'string') return data.access_token;
        if (typeof data.token === 'string') return data.token;
        if (typeof data.data === 'string') return data.data;
    }
    if (typeof data === 'string' && data.length > 10) return data;
    return null;
};

export default function AuthPage() {
    // screen drives which form is rendered
    const [screen, setScreen] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [widgetReady, setWidgetReady] = useState(false);
    const [theme, setTheme] = useState(getInitialTheme);
    const widgetInitialized = useRef(false);

    // Shared fields
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [tempToken, setTempToken] = useState('');

    const { status, checkAuth } = useAuth();
    const { playChime, addToast } = useNotifications();
    const navigate = useNavigate();
    const isDark = theme === 'dark';

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* ignore */ }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            const dest = localStorage.getItem('loginRedirect') || '/dashboard';
            localStorage.removeItem('loginRedirect');
            navigate(dest);
        }
    }, [status, navigate]);

    // ── MSG91 Widget bootstrap ────────────────────────────────────────────────
    const initWidget = useCallback(() => {
        if (widgetInitialized.current) return;
        const configuration = {
            widgetId: WIDGET_ID,
            tokenAuth: TOKEN_AUTH,
            exposeMethods: true,
            success: (data) => console.log('[MSG91] success:', data),
            failure: (err) => console.error('[MSG91] failure:', err),
        };
        if (typeof window.initSendOTP === 'function') {
            window.initSendOTP(configuration);
            widgetInitialized.current = true;
        }
        let attempts = 0;
        const poll = setInterval(() => {
            attempts++;
            if (typeof window.sendOtp === 'function') {
                clearInterval(poll);
                setWidgetReady(true);
            } else if (attempts > 30) {
                clearInterval(poll);
                setWidgetReady(true); // proceed anyway — let it fail gracefully
            }
        }, 300);
    }, []);

    useEffect(() => {
        if (typeof window.initSendOTP === 'function') { initWidget(); return; }
        if (typeof window.sendOtp === 'function') { setWidgetReady(true); return; }
        const script = document.createElement('script');
        script.src = 'https://verify.msg91.com/otp-provider.js';
        script.async = true;
        script.onload = () => initWidget();
        script.onerror = () => {
            const fallback = document.createElement('script');
            fallback.src = 'https://verify.phone91.com/otp-provider.js';
            fallback.async = true;
            fallback.onload = () => initWidget();
            fallback.onerror = () => setError('Failed to load authentication service. Please refresh.');
            document.body.appendChild(fallback);
        };
        document.body.appendChild(script);
    }, [initWidget]);

    // ── Shared utilities ──────────────────────────────────────────────────────
    const clearMsg = () => { setError(''); setSuccess(''); };

    const goTo = (s) => {
        clearMsg();
        setOtpCode('');
        setPin('');
        setConfirmPin('');
        setScreen(s);
    };

    const resetAll = () => {
        setEmail(''); setName(''); setMobile(''); setOtpCode('');
        setPin(''); setConfirmPin(''); setTempToken('');
        clearMsg();
        setScreen('login');
    };

    /** Call window.sendOtp and return a promise */
    const triggerSendOtp = (emailAddr) => new Promise((resolve, reject) => {
        if (typeof window.sendOtp !== 'function') {
            reject(new Error('Authentication service is loading. Please wait and try again.'));
            return;
        }
        window.sendOtp(
            emailAddr,
            (data) => { console.log('[MSG91] OTP sent:', data); resolve(data); },
            (err) => { console.error('[MSG91] Send failed:', err); reject(err); }
        );
    });

    /** Call window.verifyOtp and return a promise resolving to accessToken string */
    const triggerVerifyOtp = (code) => new Promise((resolve, reject) => {
        if (typeof window.verifyOtp !== 'function') {
            reject(new Error('Authentication service not ready. Please refresh.'));
            return;
        }
        let settled = false;
        window.verifyOtp(
            code,
            (data) => {
                if (settled) return;
                settled = true;
                console.log('[MSG91] OTP verified (success callback):', data);
                const token = extractAccessToken(data);
                if (token) {
                    resolve(token);
                } else {
                    console.error('[MSG91] No access token in success data:', data);
                    reject(new Error('Verification succeeded but no access token received. Please try again.'));
                }
            },
            (err) => {
                if (settled) return; // Ignore if already resolved via success callback
                settled = true;
                console.error('[MSG91] Verify failed:', err);
                reject(new Error(err?.message || 'Invalid OTP. Please try again.'));
            }
        );
    });

    // ── Styles ────────────────────────────────────────────────────────────────
    const inputBase = 'w-full rounded-xl bg-white/90 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all duration-200';
    const inputNoIcon = 'w-full rounded-xl bg-white/90 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 py-3.5 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all duration-200';
    const buttonBase = 'w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-white font-semibold tracking-wide py-3.5 px-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-[1.03] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none cursor-pointer';
    const buttonSecondary = 'w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 font-medium py-3 px-4 hover:bg-white/90 dark:hover:bg-white/[0.08] transition-all duration-200 text-sm cursor-pointer';
    const backLink = 'text-xs font-semibold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors cursor-pointer';

    // ── Screen metadata ───────────────────────────────────────────────────────
    const SCREEN_META = {
        'login':        { title: 'Sign in',                  subtitle: 'Welcome back to your CRM workspace.' },
        'register':     { title: 'Create account',           subtitle: 'Start automating leads in minutes.' },
        'register-otp': { title: 'Enter verification code',  subtitle: `We sent a code to ${email}` },
        'pin-setup':    { title: 'Set your 6-digit PIN',     subtitle: 'You\'ll use this PIN to log in every time.' },
        'forgot-pin':   { title: 'Reset your PIN',           subtitle: 'Enter your email or mobile number to receive a reset code.' },
        'reset-otp':    { title: 'Enter verification code',  subtitle: `We sent a reset code to ${email}` },
        'pin-reset':    { title: 'Set new PIN',              subtitle: 'Choose a new 6-digit PIN for your account.' },
    };
    const meta = SCREEN_META[screen] || SCREEN_META['login'];
    const showTabs = screen === 'login' || screen === 'register';

    // ── Handlers ──────────────────────────────────────────────────────────────

    /** LOGIN screen: Email or Phone + PIN → loginWithPin */
    const handleLogin = async (e) => {
        e.preventDefault();
        clearMsg();
        if (!email || !isValidIdentifier(email.trim())) {
            setError('Please enter a valid email address or 10-digit mobile number.');
            return;
        }
        if (!pin || !/^\d{6}$/.test(pin)) { setError('PIN must be exactly 6 digits.'); return; }
        setLoading(true);
        try {
            const res = await authApi.loginWithPin(email.trim(), pin);
            await checkAuth();
            playChime();
            addToast(`Welcome back${res.data?.user?.name ? ', ' + res.data.user.name : ''}!`, 'success', 'Login Successful');
        } catch (err) {
            setError(err?.response?.data?.error || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /** REGISTER screen: validate → checkEmail → sendOtp → go to register-otp */
    const handleRegisterSendOtp = async (e) => {
        e.preventDefault();
        clearMsg();
        if (!name.trim()) { setError('Full name is required.'); return; }
        if (!email || !isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
        // Mobile is optional — only validate format if provided
        if (mobile && !isValidMobile(mobile)) { setError('Please enter a valid 10-digit mobile number.'); return; }

        setLoading(true);
        try {
            const checkRes = await authApi.checkEmail(email.toLowerCase().trim());
            if (checkRes.data?.exists && checkRes.data?.hasMpin) {
                setError('An account with this email already exists. Please login instead.');
                setLoading(false);
                return;
            }
            await triggerSendOtp(email.toLowerCase().trim());
            setSuccess(`Verification code sent to ${email}`);
            goTo('register-otp');
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /** REGISTER-OTP screen: verifyOtp → verifyEmailOtp → get tempToken → go to pin-setup */
    const handleRegisterVerifyOtp = async (e) => {
        e.preventDefault();
        clearMsg();
        if (!otpCode || otpCode.length < 4) { setError('Please enter a valid OTP.'); return; }
        setLoading(true);
        try {
            const accessToken = await triggerVerifyOtp(otpCode);
            if (!accessToken) {
                setLoading(false);
                return;
            }
            console.log('[AuthPage] Access token extracted, length:', accessToken.length);
            const cleanMobile = mobile ? mobile.replace(/\D/g, '').slice(-10) : '';
            const res = await authApi.verifyEmailOtp(accessToken, name.trim(), cleanMobile || undefined, email.toLowerCase().trim());
            setTempToken(res.data.tempToken);
            setSuccess('');
            goTo('pin-setup');
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /** PIN-SETUP screen: validate PINs → setupPin → checkAuth → done */
    const handleSetupPin = async (e) => {
        e.preventDefault();
        clearMsg();
        if (!pin || !/^\d{6}$/.test(pin)) { setError('PIN must be exactly 6 digits.'); return; }
        if (pin !== confirmPin) { setError('PINs do not match. Please try again.'); return; }
        setLoading(true);
        try {
            const cleanMobile = mobile ? mobile.replace(/\D/g, '').slice(-10) : '';
            await authApi.setupPin(tempToken, pin, name.trim(), cleanMobile || undefined);
            await checkAuth();
            playChime();
            addToast('Account created! Welcome aboard.', 'success', 'Registration Successful');
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to set PIN. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /** FORGOT-PIN screen: forgotPin (validate email) → sendOtp → go to reset-otp */
    const handleForgotPinSendOtp = async (e) => {
        e.preventDefault();
        clearMsg();
        if (!email || !isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
        setLoading(true);
        try {
            await authApi.forgotPin(email.toLowerCase().trim());
            await triggerSendOtp(email.toLowerCase().trim());
            setSuccess(`Verification code sent to ${email}`);
            goTo('reset-otp');
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /** RESET-OTP screen: verifyOtp → verifyResetOtp → tempToken → go to pin-reset */
    const handleResetVerifyOtp = async (e) => {
        e.preventDefault();
        clearMsg();
        if (!otpCode || otpCode.length < 4) { setError('Please enter a valid OTP.'); return; }
        setLoading(true);
        try {
            const accessToken = await triggerVerifyOtp(otpCode);
            const res = await authApi.verifyResetOtp(accessToken, email.toLowerCase().trim());
            setTempToken(res.data.tempToken);
            setSuccess('');
            goTo('pin-reset');
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /** PIN-RESET screen: validate PINs → resetPin → checkAuth → done */
    const handleResetPin = async (e) => {
        e.preventDefault();
        clearMsg();
        if (!pin || !/^\d{6}$/.test(pin)) { setError('PIN must be exactly 6 digits.'); return; }
        if (pin !== confirmPin) { setError('PINs do not match. Please try again.'); return; }
        setLoading(true);
        try {
            await authApi.resetPin(tempToken, pin);
            await checkAuth();
            playChime();
            addToast('PIN reset successfully. Welcome back!', 'success', 'PIN Reset Successful');
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to reset PIN. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const highlights = [
        { icon: 'smart_toy', text: 'AI voice & smart automation' },
        { icon: 'chat', text: 'WhatsApp & omnichannel CRM' },
        { icon: 'campaign', text: 'Ads & lead sync built in' },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={`${isDark ? 'dark' : ''} min-h-screen`}>
            <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#07080c] dark:text-slate-100">
                <div className="pointer-events-none absolute inset-0 landing-gradient-mesh opacity-80 dark:opacity-100" aria-hidden />
                <div className="pointer-events-none absolute inset-0 landing-grid-bg opacity-25 dark:opacity-35" aria-hidden />

                {/* Theme toggle */}
                <button type="button" onClick={toggleTheme} aria-label="Toggle theme"
                    className="fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                    <span className="material-symbols-outlined text-[22px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
                </button>

                <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:flex-row lg:items-stretch lg:gap-10 lg:px-10 lg:py-12">

                    {/* ── Left branding ─────────────────────────────────────── */}
                    <aside className="mb-8 flex flex-col justify-center lg:mb-0 lg:w-[42%] lg:max-w-xl lg:py-4">
                        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/40 sm:p-8">
                            <div className="flex items-center gap-3">
                                <img src="/vite.svg" alt="OneEmployee Logo" className="h-10 w-10 object-contain" />
                                <div>
                                    <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">OneEmployee<span className="text-primary">®</span></p>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">AI-powered CRM · Lead automation</p>
                                </div>
                            </div>
                            <p className="mt-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                Run voice, WhatsApp, and ads-led workflows from one premium workspace—built for teams who live in real-time pipeline.
                            </p>
                            <ul className="mt-6 space-y-3">
                                {highlights.map((h) => (
                                    <li key={h.text} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                                            <span className="material-symbols-outlined text-[18px]">{h.icon}</span>
                                        </span>
                                        <span>{h.text}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-200/60 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pipeline</p>
                                    <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">Live</p>
                                </div>
                                <div className="rounded-xl border border-slate-200/60 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sync</p>
                                    <p className="mt-1 font-mono text-lg font-bold text-primary">Real-time</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* ── Right auth card ───────────────────────────────────── */}
                    <main className="flex flex-1 flex-col justify-center lg:min-w-0 lg:py-4">
                        <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/50 sm:p-8 lg:p-10">

                            {/* Login / Register tabs — only on login/register screens */}
                            {showTabs && (
                                <div className="mb-8 flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/[0.06]">
                                    {['login', 'register'].map((s) => (
                                        <button key={s} type="button"
                                            onClick={() => { resetAll(); setScreen(s); setEmail(''); setName(''); setMobile(''); setPin(''); setConfirmPin(''); clearMsg(); }}
                                            className={`relative flex-1 rounded-lg py-2.5 text-center text-xs font-semibold uppercase tracking-wide transition-all duration-300 ${screen === s ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>
                                            {s === 'login' ? 'Login' : 'Register'}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Title */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{meta.title}</h2>
                                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{meta.subtitle}</p>
                            </div>

                            {/* Alerts */}
                            {error && (
                                <div role="alert" className="mb-6 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div role="status" className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary dark:bg-primary/15">
                                    {success}
                                </div>
                            )}

                            {/* ── LOGIN SCREEN ── */}
                            {screen === 'login' && (
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="relative group">
                                        <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500">
                                            {identifierIsPhone(email) ? <PhoneIcon /> : <MailIcon />}
                                        </i>
                                        <input
                                            type="text"
                                            autoComplete="username"
                                            inputMode={identifierIsPhone(email) ? 'numeric' : 'email'}
                                            placeholder="Email or mobile number *"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={inputBase}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="relative group">
                                        <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500"><KeyIcon /></i>
                                        <input type="password" inputMode="numeric" autoComplete="current-password"
                                            placeholder="6-digit PIN *" maxLength={6}
                                            value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className={`${inputBase} tracking-widest`} />
                                    </div>
                                    <button type="submit" disabled={loading} className={`${buttonBase} mt-2`}>
                                        {loading
                                            ? <><span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>Signing in…</>
                                            : <>Login <ArrowRightIcon /></>}
                                    </button>
                                    <div className="flex items-center justify-center pt-1">
                                        <button type="button" onClick={() => { clearMsg(); setEmail(''); setScreen('forgot-pin'); }}
                                            className={backLink}>
                                            Forgot PIN?
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* ── REGISTER SCREEN ── */}
                            {screen === 'register' && (
                                <form onSubmit={handleRegisterSendOtp} className="space-y-4">
                                    <div className="relative group">
                                        <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500"><UserIcon /></i>
                                        <input type="text" autoComplete="name" placeholder="Full name *"
                                            value={name} onChange={(e) => setName(e.target.value)}
                                            className={inputBase} autoFocus />
                                    </div>
                                    <div className="relative group">
                                        <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500"><MailIcon /></i>
                                        <input type="email" autoComplete="email" placeholder="Email address *"
                                            value={email} onChange={(e) => setEmail(e.target.value)}
                                            className={inputBase} />
                                    </div>
                                    <div className="relative group">
                                        <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500"><PhoneIcon /></i>
                                        <input type="tel" autoComplete="tel" inputMode="numeric" maxLength={10}
                                            placeholder="Mobile number (optional)"
                                            value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className={inputBase} />
                                    </div>
                                    <button type="submit" disabled={loading || !widgetReady} className={`${buttonBase} mt-2`}>
                                        {loading
                                            ? <><span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>Sending OTP…</>
                                            : !widgetReady
                                                ? <><span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>Loading…</>
                                                : <>Send OTP <ArrowRightIcon /></>}
                                    </button>
                                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                                        We'll send a one-time verification code to your email
                                    </p>
                                </form>
                            )}

                            {/* ── REGISTER-OTP SCREEN ── */}
                            {screen === 'register-otp' && (
                                <form onSubmit={handleRegisterVerifyOtp} className="space-y-5">
                                    <div className="relative group">
                                        <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500"><KeyIcon /></i>
                                        <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4}
                                            placeholder="Enter 4-digit OTP"
                                            value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className={`${inputBase} font-mono text-lg tracking-[0.2em] text-center`} autoFocus />
                                    </div>
                                    <button type="submit" disabled={loading} className={buttonBase}>
                                        {loading
                                            ? <><span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>Verifying…</>
                                            : <>Verify OTP <ArrowRightIcon /></>}
                                    </button>
                                    <div className="flex flex-col items-center gap-3">
                                        <button type="button" onClick={handleRegisterSendOtp} disabled={loading} className={buttonSecondary}>
                                            Resend OTP
                                        </button>
                                        <button type="button" onClick={() => goTo('register')} className={backLink}>
                                            ← Back
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* ── PIN-SETUP SCREEN ── */}
                            {screen === 'pin-setup' && (
                                <form onSubmit={handleSetupPin} className="space-y-4">
                                    <input type="password" inputMode="numeric" autoComplete="new-password"
                                        placeholder="Choose 6-digit PIN *" maxLength={6}
                                        value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className={`${inputNoIcon} tracking-widest`} autoFocus />
                                    <input type="password" inputMode="numeric" autoComplete="new-password"
                                        placeholder="Confirm PIN *" maxLength={6}
                                        value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className={`${inputNoIcon} tracking-widest`} />
                                    <button type="submit" disabled={loading} className={`${buttonBase} mt-2`}>
                                        {loading
                                            ? <><span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>Creating account…</>
                                            : <>Complete Registration <ArrowRightIcon /></>}
                                    </button>
                                    <div className="flex justify-center">
                                        <button type="button" onClick={() => goTo('register-otp')} className={backLink}>
                                            ← Back
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* ── FORGOT-PIN SCREEN ── */}
                            {screen === 'forgot-pin' && (
                                <form onSubmit={handleForgotPinSendOtp} className="space-y-4">
                                    <div className="relative group">
                                        <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500"><MailIcon /></i>
                                        <input type="email" autoComplete="email" placeholder="Email address *"
                                            value={email} onChange={(e) => setEmail(e.target.value)}
                                            className={inputBase} autoFocus />
                                    </div>
                                    <button type="submit" disabled={loading || !widgetReady} className={`${buttonBase} mt-2`}>
                                        {loading
                                            ? <><span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>Sending OTP…</>
                                            : <>Send OTP <ArrowRightIcon /></>}
                                    </button>
                                    <div className="flex justify-center">
                                        <button type="button" onClick={() => goTo('login')} className={backLink}>
                                            ← Back to login
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* ── RESET-OTP SCREEN ── */}
                            {screen === 'reset-otp' && (
                                <form onSubmit={handleResetVerifyOtp} className="space-y-5">
                                    <div className="relative group">
                                        <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500"><KeyIcon /></i>
                                        <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4}
                                            placeholder="Enter 4-digit OTP"
                                            value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className={`${inputBase} font-mono text-lg tracking-[0.2em] text-center`} autoFocus />
                                    </div>
                                    <button type="submit" disabled={loading} className={buttonBase}>
                                        {loading
                                            ? <><span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>Verifying…</>
                                            : <>Verify OTP <ArrowRightIcon /></>}
                                    </button>
                                    <div className="flex flex-col items-center gap-3">
                                        <button type="button" onClick={handleForgotPinSendOtp} disabled={loading} className={buttonSecondary}>
                                            Resend OTP
                                        </button>
                                        <button type="button" onClick={() => goTo('forgot-pin')} className={backLink}>
                                            ← Back
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* ── PIN-RESET SCREEN ── */}
                            {screen === 'pin-reset' && (
                                <form onSubmit={handleResetPin} className="space-y-4">
                                    <input type="password" inputMode="numeric" autoComplete="new-password"
                                        placeholder="New 6-digit PIN *" maxLength={6}
                                        value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className={`${inputNoIcon} tracking-widest`} autoFocus />
                                    <input type="password" inputMode="numeric" autoComplete="new-password"
                                        placeholder="Confirm new PIN *" maxLength={6}
                                        value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className={`${inputNoIcon} tracking-widest`} />
                                    <button type="submit" disabled={loading} className={`${buttonBase} mt-2`}>
                                        {loading
                                            ? <><span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>Resetting PIN…</>
                                            : <>Reset PIN <ArrowRightIcon /></>}
                                    </button>
                                    <div className="flex justify-center">
                                        <button type="button" onClick={() => goTo('reset-otp')} className={backLink}>
                                            ← Back
                                        </button>
                                    </div>
                                </form>
                            )}

                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
