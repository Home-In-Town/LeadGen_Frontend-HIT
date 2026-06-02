import React, { useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const THEME_STORAGE_KEY = 'hit-landing-theme';

function getInitialTheme() {
    if (typeof window === 'undefined') return 'light';
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
    } catch {
        /* ignore */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ── Icons (SVG) ──
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key-round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
);

export default function AuthPage() {
    const [screen, setScreen] = useState('login'); // 'login' | 'register'
    const [step, setStep] = useState('email'); // 'email' | 'otp' | 'verifying'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form fields
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [otpCode, setOtpCode] = useState('');

    // MSG91 widget loaded state
    const [widgetReady, setWidgetReady] = useState(false);

    const [theme, setTheme] = useState(getInitialTheme);

    const { user, status, checkAuth } = useAuth();
    const { playChime, addToast } = useNotifications();
    const navigate = useNavigate();

    const isDark = theme === 'dark';

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            /* ignore */
        }
    };

    // Auto-redirect if already authenticated
    useEffect(() => {
        if (status === 'authenticated') {
            const dest = localStorage.getItem('loginRedirect') || '/dashboard';
            localStorage.removeItem('loginRedirect');
            navigate(dest);
        }
    }, [status, navigate]);

    // Load MSG91 OTP Widget script
    useEffect(() => {
        // Check if already loaded
        if (window.sendOtp && window.verifyOtp) {
            setWidgetReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://verify.msg91.com/otp-provider.js';
        script.async = true;
        script.onload = () => {
            // Initialize the widget configuration
            const configuration = {
                widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
                tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH,
                exposeMethods: true,
                success: (data) => {
                    // This global callback may not always be used since we use per-call callbacks
                    console.log('[MSG91] Global success:', data);
                },
                failure: (error) => {
                    console.error('[MSG91] Global failure:', error);
                }
            };

            // Initialize widget - MSG91 exposes initSendOTP after script loads
            if (window.initSendOTP) {
                window.initSendOTP(configuration);
            }

            // Wait a moment for methods to be exposed
            setTimeout(() => {
                setWidgetReady(true);
            }, 500);
        };
        script.onerror = () => {
            console.error('[MSG91] Failed to load OTP widget script');
            setError('Failed to load authentication service. Please refresh.');
        };

        document.body.appendChild(script);

        return () => {
            // Cleanup if component unmounts
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // ─── Send OTP ───
    const handleSendOtp = useCallback(async () => {
        setError('');
        setSuccess('');

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (screen === 'register' && !name.trim()) {
            setError('Name is required for registration');
            return;
        }

        if (!widgetReady || !window.sendOtp) {
            setError('Authentication service is loading. Please wait and try again.');
            return;
        }

        setLoading(true);

        try {
            window.sendOtp(
                email,
                (data) => {
                    // OTP sent successfully
                    console.log('[MSG91] OTP sent:', data);
                    setSuccess('OTP sent to your email');
                    setStep('otp');
                    setLoading(false);
                },
                (error) => {
                    console.error('[MSG91] Send OTP failed:', error);
                    setError(error?.message || 'Failed to send OTP. Please try again.');
                    setLoading(false);
                }
            );
        } catch (err) {
            console.error('[MSG91] sendOtp exception:', err);
            setError('Failed to send OTP. Please try again.');
            setLoading(false);
        }
    }, [email, name, screen, widgetReady]);

    // ─── Verify OTP ───
    const handleVerifyOtp = useCallback(async () => {
        setError('');
        setSuccess('');

        if (!otpCode || otpCode.length < 4) {
            setError('Please enter a valid OTP');
            return;
        }

        if (!window.verifyOtp) {
            setError('Authentication service not ready. Please refresh.');
            return;
        }

        setLoading(true);
        setStep('verifying');

        try {
            window.verifyOtp(
                otpCode,
                async (data) => {
                    // OTP verified, we get access token from MSG91
                    console.log('[MSG91] OTP verified:', data);
                    const accessToken = data?.message || data?.access_token || data;

                    try {
                        // Send to backend for verification and login
                        const response = await authApi.verifyEmailOtp(
                            typeof accessToken === 'string' ? accessToken : JSON.stringify(accessToken),
                            name || ''
                        );

                        await checkAuth();
                        playChime();
                        addToast(
                            `Welcome${response.data?.user?.name ? ', ' + response.data.user.name : ''}!`,
                            'success',
                            'Login Successful'
                        );
                    } catch (backendErr) {
                        console.error('[Backend] verify-email-otp failed:', backendErr);
                        setError(backendErr.response?.data?.error || 'Login failed. Please try again.');
                        setStep('otp');
                    }
                    setLoading(false);
                },
                (error) => {
                    console.error('[MSG91] Verify OTP failed:', error);
                    setError(error?.message || 'Invalid OTP. Please try again.');
                    setStep('otp');
                    setLoading(false);
                }
            );
        } catch (err) {
            console.error('[MSG91] verifyOtp exception:', err);
            setError('Verification failed. Please try again.');
            setStep('otp');
            setLoading(false);
        }
    }, [otpCode, name, checkAuth, playChime, addToast]);

    // ─── Reset form ───
    const resetFields = () => {
        setEmail('');
        setName('');
        setOtpCode('');
        setError('');
        setSuccess('');
        setStep('email');
    };

    // ─── Styles ───
    const inputBase =
        'w-full rounded-xl bg-white/90 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all duration-200';
    const buttonBase =
        'w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-white font-semibold tracking-wide py-3.5 px-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-[1.03] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none cursor-pointer';
    const buttonSecondary =
        'w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 font-medium py-3 px-4 hover:bg-white/90 dark:hover:bg-white/[0.08] transition-all duration-200 text-sm cursor-pointer';

    const screenTitle = () => {
        if (step === 'otp') return 'Enter verification code';
        if (step === 'verifying') return 'Verifying...';
        return screen === 'login' ? 'Sign in' : 'Create account';
    };

    const screenSubtitle = () => {
        if (step === 'otp') return `We sent a code to ${email}`;
        if (step === 'verifying') return 'Please wait while we verify your identity.';
        return screen === 'login'
            ? 'Welcome back to your CRM workspace.'
            : 'Start automating leads in minutes.';
    };

    const highlights = [
        { icon: 'smart_toy', text: 'AI voice & smart automation' },
        { icon: 'chat', text: 'WhatsApp & omnichannel CRM' },
        { icon: 'campaign', text: 'Ads & lead sync built in' },
    ];

    return (
        <div className={`${isDark ? 'dark' : ''} min-h-screen`}>
            <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#07080c] dark:text-slate-100">
                <div className="pointer-events-none absolute inset-0 landing-gradient-mesh opacity-80 dark:opacity-100" aria-hidden />
                <div className="pointer-events-none absolute inset-0 landing-grid-bg opacity-25 dark:opacity-35" aria-hidden />

                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                    className="fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:border-primary/50"
                >
                    <span className="material-symbols-outlined text-[22px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
                </button>

                <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:flex-row lg:items-stretch lg:gap-10 lg:px-10 lg:py-12">
                    {/* Left: branding */}
                    <aside className="mb-8 flex flex-col justify-center lg:mb-0 lg:w-[42%] lg:max-w-xl lg:py-4">
                        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/40 sm:p-8">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/vite.svg"
                                    alt="OneEmployee Logo"
                                    className="h-10 w-10 object-contain"
                                />
                                <div>
                                    <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                        OneEmployee<span className="text-primary">®</span>
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        AI-powered CRM · Lead automation
                                    </p>
                                </div>
                            </div>
                            <p className="mt-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                Run voice, WhatsApp, and ads-led workflows from one premium workspace—built for teams who
                                live in real-time pipeline.
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
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Pipeline
                                    </p>
                                    <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">Live</p>
                                </div>
                                <div className="rounded-xl border border-slate-200/60 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Sync
                                    </p>
                                    <p className="mt-1 font-mono text-lg font-bold text-primary">Real-time</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Right: auth card */}
                    <main className="flex flex-1 flex-col justify-center lg:min-w-0 lg:py-4">
                        <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/50 sm:p-8 lg:p-10">
                            {/* Login / Register toggle */}
                            {step === 'email' && (
                                <div className="mb-8 flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/[0.06]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetFields();
                                            setScreen('login');
                                        }}
                                        className={`relative flex-1 rounded-lg py-2.5 text-center text-xs font-semibold uppercase tracking-wide transition-all duration-300 ${
                                            screen === 'login'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        Login
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetFields();
                                            setScreen('register');
                                        }}
                                        className={`relative flex-1 rounded-lg py-2.5 text-center text-xs font-semibold uppercase tracking-wide transition-all duration-300 ${
                                            screen === 'register'
                                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        Register
                                    </button>
                                </div>
                            )}

                            <div className="mb-6">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                    {screenTitle()}
                                </h2>
                                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{screenSubtitle()}</p>
                            </div>

                            {error && (
                                <div
                                    role="alert"
                                    className="mb-6 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200"
                                >
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div
                                    role="status"
                                    className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary dark:bg-primary/15"
                                >
                                    {success}
                                </div>
                            )}

                            <div
                                key={`${screen}-${step}`}
                                className="animate-fade-in transition-opacity duration-300 ease-out"
                            >
                                {/* Step: EMAIL INPUT */}
                                {step === 'email' && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSendOtp();
                                        }}
                                        className="space-y-5"
                                    >
                                        <div className="space-y-4">
                                            {/* Name field - only for register */}
                                            {screen === 'register' && (
                                                <div className="relative group">
                                                    <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500">
                                                        <UserIcon />
                                                    </i>
                                                    <input
                                                        type="text"
                                                        autoComplete="name"
                                                        placeholder="Full name"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className={inputBase}
                                                    />
                                                </div>
                                            )}

                                            {/* Email field */}
                                            <div className="relative group">
                                                <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500">
                                                    <MailIcon />
                                                </i>
                                                <input
                                                    type="email"
                                                    autoComplete="email"
                                                    placeholder="Email address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className={inputBase}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            disabled={loading || !widgetReady}
                                            type="submit"
                                            className={buttonBase}
                                        >
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                                    Sending OTP…
                                                </span>
                                            ) : !widgetReady ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                                    Loading…
                                                </span>
                                            ) : (
                                                <>
                                                    Send OTP
                                                    <ArrowRightIcon />
                                                </>
                                            )}
                                        </button>

                                        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                                            We'll send a one-time verification code to your email
                                        </p>
                                    </form>
                                )}

                                {/* Step: OTP INPUT */}
                                {step === 'otp' && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleVerifyOtp();
                                        }}
                                        className="space-y-6"
                                    >
                                        <div className="relative group">
                                            <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500">
                                                <KeyIcon />
                                            </i>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                maxLength={6}
                                                placeholder="Enter OTP"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                className={`${inputBase} font-mono text-lg tracking-[0.2em] text-center`}
                                                autoFocus
                                            />
                                        </div>

                                        <button
                                            disabled={loading}
                                            type="submit"
                                            className={buttonBase}
                                        >
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                                    Verifying…
                                                </span>
                                            ) : (
                                                <>
                                                    Verify & Login
                                                    <ArrowRightIcon />
                                                </>
                                            )}
                                        </button>

                                        <div className="flex flex-col items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSendOtp()}
                                                disabled={loading}
                                                className={buttonSecondary}
                                            >
                                                Resend OTP
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStep('email');
                                                    setOtpCode('');
                                                    setError('');
                                                    setSuccess('');
                                                }}
                                                className="text-xs font-semibold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors cursor-pointer"
                                            >
                                                ← Change email
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Step: VERIFYING (loading state) */}
                                {step === 'verifying' && (
                                    <div className="flex flex-col items-center gap-4 py-8">
                                        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Verifying your identity...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
