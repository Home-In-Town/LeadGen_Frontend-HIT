import React, { useState, useEffect } from 'react';
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
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone-call"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><path d="m14.05 2 .23 2"/><path d="M15 5.4V6"/><path d="m19.3 2.05-.2.23"/><path d="M18 5V4"/></svg>
);
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

export default function AuthPage() {
    const [screen, setScreen] = useState('login'); // 'login' | 'register' | 'forgot-phone' | 'otp' | 'reset-mpin'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form fields
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mpin, setMpin] = useState('');
    const [confirmMpin, setConfirmMpin] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [role, setRole] = useState('service_user');
    
    // Flow tracking
    const [isResetFlow, setIsResetFlow] = useState(false);
    const [forgotPhone, setForgotPhone] = useState('');

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

    // Cleanup state on mount
    useEffect(() => {
        setError('');
        setLoading(false);
    }, []);

    // ─── Helpers ───
    const formatPhone = (p) => p.startsWith('+') ? p : `+91${p}`;
    const validatePhone = (p) => /^(?:\+91)?[6-9]\d{9}$/.test(p);
    const validateMpin = (m) => /^\d{4,6}$/.test(m);

    const resetFields = () => {
        setMpin('');
        setConfirmMpin('');
        setOtpCode('');
        setName('');
        setEmail('');
        setError('');
        setSuccess('');
    };

    // ========================================
    // LOGIC: LOGIN
    // ========================================
    const onLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!validatePhone(phone)) return setError('Please enter a valid 10-digit number');
        if (!mpin || mpin.length < 4) return setError('Please enter your 4+ digit MPIN');

        try {
            setLoading(true);
            const formattedPhone = formatPhone(phone);
            
            const { data } = await authApi.login(formattedPhone, mpin);
            await checkAuth();
            
            // Chime and Toast
            playChime();
            addToast(`Welcome back, ${data.user?.name || 'User'}!`, 'success', 'Login Successful');
            
            // Redirect is now handled by the status useEffect
            
        } catch (err) {
            console.error('Login error detail:', err);
            setError(err.response?.data?.error || "Invalid phone or MPIN");
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // LOGIC: REGISTER
    // ========================================
    const onRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) return setError("Name is required");
        if (!validatePhone(phone)) return setError('Invalid phone number');
        if (!validateMpin(mpin)) return setError("MPIN should be 4-6 digits");
        if (mpin !== confirmMpin) return setError("MPINs do not match");
        
        try {
            setLoading(true);
            const formattedPhone = formatPhone(phone);
            setPhone(formattedPhone);
            await authApi.register({ name, phone: formattedPhone, mpin, email, role });
            
            // Bypass Transition: login and redirect immediately
            await checkAuth();
            playChime();
            addToast(`Welcome to Lead Filtration, ${name}!`, 'success', 'Registration Successful');
            navigate('/dashboard');
            
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // LOGIC: FORGOT MPIN
    // ========================================
    const onForgotPhoneSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validatePhone(forgotPhone)) return setError('Enter your registered phone number');

        try {
            setLoading(true);
            const formattedPhone = formatPhone(forgotPhone);
            setForgotPhone(formattedPhone);
            await authApi.forgotMpin(formattedPhone);
            setIsResetFlow(true);
            setScreen('otp');
            setSuccess("OTP sent for verification");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // LOGIC: OTP VERIFY
    // ========================================
    const onOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (otpCode.length < 6) return setError("Enter 6-digit OTP");

        try {
            setLoading(true);
            if (isResetFlow) {
                setScreen('reset-mpin');
            } else {
                await authApi.verifyOtp(phone, otpCode);
                await checkAuth();
                playChime();
                addToast('Account Initialized', 'success', 'Verification Success');
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // LOGIC: RESET MPIN
    // ========================================
    const onResetMpinSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateMpin(mpin)) return setError("New MPIN should be 4-6 digits");
        if (mpin !== confirmMpin) return setError("MPINs do not match");

        try {
            setLoading(true);
            await authApi.resetMpin(forgotPhone, otpCode, mpin);
            setSuccess("MPIN reset successful! Please login.");
            resetFields();
            setForgotPhone('');
            setIsResetFlow(false);
            setScreen('login');
        } catch (err) {
            setError(err.response?.data?.error || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    const inputBase =
        'w-full rounded-xl bg-white/90 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-all duration-200';
    const buttonBase =
        'w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-white font-semibold tracking-wide py-3.5 px-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-[1.03] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none cursor-pointer';
    const linkBase =
        'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer';

    const screenTitle = () => {
        switch (screen) {
            case 'login':
                return 'Sign in';
            case 'register':
                return 'Create account';
            case 'otp':
                return 'Verify code';
            case 'reset-mpin':
                return 'New MPIN';
            case 'forgot-phone':
                return 'Recover access';
            default:
                return 'Welcome';
        }
    };

    const screenSubtitle = () => {
        switch (screen) {
            case 'login':
                return 'Welcome back to your CRM workspace.';
            case 'register':
                return 'Start automating leads in minutes.';
            case 'otp':
                return 'Enter the code we sent to your phone.';
            case 'reset-mpin':
                return 'Choose a new secure MPIN.';
            case 'forgot-phone':
                return 'We’ll send a verification code.';
            default:
                return '';
        }
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
                                Run voice, WhatsApp, and ads-led workflows from one premium workspace-built for teams who
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
                            {/* Login / Register toggle — only when those screens */}
                            {(screen === 'login' || screen === 'register') && (
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
                                key={screen}
                                className="animate-fade-in transition-opacity duration-300 ease-out"
                            >
                                {/* Screen: LOGIN */}
                                {screen === 'login' && (
                                    <form onSubmit={onLoginSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500">
                                                    <PhoneIcon />
                                                </i>
                                                <input
                                                    type="tel"
                                                    autoComplete="tel"
                                                    placeholder="Mobile number"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className={`${inputBase} font-mono`}
                                                />
                                            </div>
                                            <div className="relative group">
                                                <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary dark:text-slate-500">
                                                    <LockIcon />
                                                </i>
                                                <input
                                                    type="password"
                                                    autoComplete="current-password"
                                                    placeholder="MPIN"
                                                    maxLength={6}
                                                    value={mpin}
                                                    onChange={(e) => setMpin(e.target.value)}
                                                    className={`${inputBase} text-xl ${mpin ? 'tracking-[0.45em]' : 'tracking-normal'} placeholder:text-xs placeholder:tracking-normal placeholder:font-semibold`}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <button disabled={loading} type="submit" className={buttonBase}>
                                                {loading ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                                        Signing in…
                                                    </span>
                                                ) : (
                                                    <>
                                                        Continue
                                                        <ArrowRightIcon />
                                                    </>
                                                )}
                                            </button>
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        resetFields();
                                                        setScreen('forgot-phone');
                                                    }}
                                                    className={linkBase}
                                                >
                                                    Forgot access?
                                                </button>
                                                {/* <button
                                                    type="button"
                                                    onClick={() => {
                                                        resetFields();
                                                        setScreen('register');
                                                    }}
                                                    className={`${linkBase} text-primary`}
                                                >
                                                    New registration
                                                </button> */}
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {/* Screen: REGISTER */}
                                {screen === 'register' && (
                                    <form onSubmit={onRegisterSubmit} className="space-y-5">
                                        <div className="space-y-3">
                                            <div className="relative group">
                                                <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:text-slate-500">
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
                                            <div className="relative group">
                                                <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:text-slate-500">
                                                    <PhoneIcon />
                                                </i>
                                                <input
                                                    type="tel"
                                                    autoComplete="tel"
                                                    placeholder="Mobile number"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className={`${inputBase} font-mono`}
                                                />
                                            </div>
                                            <div className="relative group">
                                                <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:text-slate-500">
                                                    <MailIcon />
                                                </i>
                                                <input
                                                    type="email"
                                                    autoComplete="email"
                                                    placeholder="Email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className={inputBase}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="relative group">
                                                    <i className="absolute left-3 top-1/2 z-10 -translate-y-1/2 scale-90 text-slate-400 group-focus-within:text-primary dark:text-slate-500">
                                                        <LockIcon />
                                                    </i>
                                                    <input
                                                        type="password"
                                                        placeholder="MPIN"
                                                        maxLength={6}
                                                        value={mpin}
                                                        onChange={(e) => setMpin(e.target.value)}
                                                        className={`${inputBase} pl-10 text-lg tracking-[0.15em]`}
                                                    />
                                                </div>
                                                <div className="relative group">
                                                    <i className="absolute left-3 top-1/2 z-10 -translate-y-1/2 scale-90 text-slate-400 group-focus-within:text-primary dark:text-slate-500">
                                                        <LockIcon />
                                                    </i>
                                                    <input
                                                        type="password"
                                                        placeholder="Confirm MPIN"
                                                        maxLength={6}
                                                        value={confirmMpin}
                                                        onChange={(e) => setConfirmMpin(e.target.value)}
                                                        className={`${inputBase} pl-10 text-lg tracking-[0.15em]`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <button disabled={loading} type="submit" className={buttonBase}>
                                                {loading ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                                        Creating account…
                                                    </span>
                                                ) : (
                                                    'Complete registration'
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setScreen('login')}
                                                className="w-full rounded-xl py-2 text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                            >
                                                Back to <span className="font-semibold text-primary">sign in</span>
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Screen: OTP */}
                                {screen === 'otp' && (
                                    <form onSubmit={onOtpSubmit} className="space-y-8 text-center">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Code sent to{' '}
                                            <span className="font-mono font-semibold text-slate-900 dark:text-white">
                                                {isResetFlow ? forgotPhone : phone}
                                            </span>
                                        </p>

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            placeholder="• • • • • •"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="w-full rounded-xl border border-slate-200/90 bg-slate-50/90 py-6 text-center font-mono text-3xl font-bold tracking-[0.35em] text-primary placeholder:text-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/35 dark:border-white/10 dark:bg-white/[0.06] dark:text-primary dark:placeholder:text-slate-600 sm:text-4xl"
                                        />

                                        <div className="space-y-4">
                                            <button disabled={loading} type="submit" className={buttonBase}>
                                                {loading ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                                        Verifying…
                                                    </span>
                                                ) : (
                                                    'Verify'
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsResetFlow(false);
                                                    setScreen('login');
                                                }}
                                                className={linkBase}
                                            >
                                                Back to sign in
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Screen: RESET MPIN */}
                                {screen === 'reset-mpin' && (
                                    <form onSubmit={onResetMpinSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:text-slate-500">
                                                    <LockIcon />
                                                </i>
                                                <input
                                                    type="password"
                                                    placeholder="New MPIN"
                                                    maxLength={6}
                                                    value={mpin}
                                                    onChange={(e) => setMpin(e.target.value)}
                                                    className={`${inputBase} text-xl tracking-[0.35em]`}
                                                />
                                            </div>
                                            <div className="relative group">
                                                <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:text-slate-500">
                                                    <LockIcon />
                                                </i>
                                                <input
                                                    type="password"
                                                    placeholder="Confirm new MPIN"
                                                    maxLength={6}
                                                    value={confirmMpin}
                                                    onChange={(e) => setConfirmMpin(e.target.value)}
                                                    className={`${inputBase} text-xl tracking-[0.35em]`}
                                                />
                                            </div>
                                        </div>

                                        <button disabled={loading} type="submit" className={buttonBase}>
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                                    Updating…
                                                </span>
                                            ) : (
                                                'Save MPIN'
                                            )}
                                        </button>
                                    </form>
                                )}

                                {/* Screen: FORGOT PHONE */}
                                {screen === 'forgot-phone' && (
                                    <form onSubmit={onForgotPhoneSubmit} className="space-y-8">
                                        <div className="relative group">
                                            <i className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 group-focus-within:text-primary dark:text-slate-500">
                                                <PhoneIcon />
                                            </i>
                                            <input
                                                type="tel"
                                                autoComplete="tel"
                                                placeholder="Registered mobile number"
                                                value={forgotPhone}
                                                onChange={(e) => setForgotPhone(e.target.value)}
                                                className={`${inputBase} font-mono text-base`}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <button disabled={loading} type="submit" className={buttonBase}>
                                                {loading ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                                        Sending…
                                                    </span>
                                                ) : (
                                                    <>
                                                        Send OTP
                                                        <ArrowRightIcon />
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setScreen('login')}
                                                className="w-full rounded-xl py-2 text-center text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-white"
                                            >
                                                Back to sign in
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
