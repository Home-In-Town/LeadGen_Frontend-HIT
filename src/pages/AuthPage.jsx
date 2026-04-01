import React, { useState, useEffect } from 'react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

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

    const { user, status, checkAuth } = useAuth();
    const { playChime, addToast } = useNotifications();
    const navigate = useNavigate();

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
            setSuccess("Verification OTP sent to your phone");
            setIsResetFlow(false);
            setScreen('otp');
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

    // ─── Shared Styles (Lead Filtration Theme) ───
    const inputBase = "w-full bg-white border-2 border-charcoal/10 py-4 pl-12 pr-4 text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-primary transition-all font-bold";
    const buttonBase = "w-full bg-primary border-2 border-primary hover:bg-charcoal hover:border-charcoal text-white font-black uppercase tracking-widest py-4 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer";
    const linkBase = "text-charcoal/40 hover:text-primary text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer";

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 font-display">
            {/* Background Engineering Grid */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#0F1115_1px,_transparent_1px)] bg-[length:32px_32px]" />
            </div>

            <div className="w-full max-w-md bg-white border-4 border-charcoal shadow-[12px_12px_0px_0px_rgba(15,17,21,1)] p-8 sm:p-10 relative overflow-hidden">
                
                {/* Visual Identity Element */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rotate-12 pointer-events-none"></div>
                <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-charcoal/5 -rotate-12 pointer-events-none"></div>

                {/* Notifications */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 border-2 border-red-100 text-[10px] font-black uppercase tracking-widest animate-shake">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-primary/10 text-primary border-2 border-primary/20 text-[10px] font-black uppercase tracking-widest">
                        {success}
                    </div>
                )}

                {/* Screen: LOGIN */}
                {screen === 'login' && (
                    <form onSubmit={onLoginSubmit} className="space-y-8 relative z-10">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter leading-none">System Access</h2>
                            <p className="text-charcoal/40 text-[10px] font-black uppercase tracking-[0.3em]">Precision Lead Filtration</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <i className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-primary transition-colors flex"><PhoneIcon /></i>
                                <input type="tel" placeholder="Mobile Number" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputBase} font-mono`} />
                            </div>
                            <div className="relative group">
                                <i className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 group-focus-within:text-primary transition-colors flex"><LockIcon /></i>
                                <input type="password" placeholder="Access MPIN" maxLength={6} value={mpin} onChange={(e) => setMpin(e.target.value)} className={`${inputBase} text-2xl ${mpin ? 'tracking-[0.8em]' : 'tracking-normal'} placeholder:tracking-normal placeholder:text-[10px] placeholder:uppercase placeholder:font-black placeholder:tracking-widest`} />
                            </div>
                        </div>

                        <div className="space-y-5">
                            <button disabled={loading} className={buttonBase}>
                                {loading ? "Verifying Credentials..." : <>Login <ArrowRightIcon /></>}
                            </button>
                            <div className="flex justify-between items-center bg-charcoal/5 p-3">
                                <button type="button" onClick={() => { resetFields(); setScreen('forgot-phone'); }} className={linkBase}>Forgot Access?</button>
                                <button type="button" onClick={() => { resetFields(); setScreen('register'); }} className={`${linkBase} text-primary`}>New Registration</button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Screen: REGISTER */}
                {screen === 'register' && (
                    <form onSubmit={onRegisterSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter leading-none">Register Unit</h2>
                            <p className="text-charcoal/40 text-[10px] font-black uppercase tracking-[0.3em]">Initialize System Account</p>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <i className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 flex"><UserIcon /></i>
                                <input type="text" placeholder="Identity Name" value={name} onChange={(e) => setName(e.target.value)} className={inputBase} />
                            </div>
                            <div className="relative">
                                <i className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 flex"><PhoneIcon /></i>
                                <input type="tel" placeholder="Terminal Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputBase} font-mono`} />
                            </div>
                            <div className="relative">
                                <i className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 flex"><MailIcon /></i>
                                <input type="email" placeholder="Email Reference" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
                            </div>


                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <i className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/20 flex scale-90"><LockIcon /></i>
                                    <input type="password" placeholder="MPIN" maxLength={6} value={mpin} onChange={(e) => setMpin(e.target.value)} className={`${inputBase} pl-10 text-xl tracking-[0.2em] placeholder:tracking-normal placeholder:text-[9px] placeholder:uppercase placeholder:font-black`} />
                                </div>
                                <div className="relative">
                                    <i className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/20 flex scale-90"><LockIcon /></i>
                                    <input type="password" placeholder="Confirm" maxLength={6} value={confirmMpin} onChange={(e) => setConfirmMpin(e.target.value)} className={`${inputBase} pl-10 text-xl tracking-[0.2em] placeholder:tracking-normal placeholder:text-[9px] placeholder:uppercase placeholder:font-black`} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button disabled={loading} className={buttonBase}>
                                {loading ? "Processing Unit..." : "Request Access OTP"}
                            </button>
                            <button type="button" onClick={() => setScreen('login')} className="w-full text-center text-[10px] font-black uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors">Return to <span className="text-primary underline">Main Login</span></button>
                        </div>
                    </form>
                )}

                {/* Screen: OTP */}
                {screen === 'otp' && (
                    <form onSubmit={onOtpSubmit} className="space-y-10 relative z-10 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter leading-none">Security Gate</h2>
                            <p className="text-charcoal/40 text-[10px] font-black uppercase tracking-widest">Code sent to: <span className="font-mono font-bold text-charcoal">{isResetFlow ? forgotPhone : phone}</span></p>
                        </div>

                        <input type="text" maxLength={6} placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full bg-surface-subtle border-4 border-charcoal/5 py-8 text-center text-5xl font-black text-primary focus:outline-none focus:border-primary transition-all tracking-[0.4em] placeholder:tracking-normal" />

                        <div className="space-y-4">
                            <button disabled={loading} className={buttonBase}>{loading ? "Verifying Unit..." : "Authorize Access"}</button>
                            <button type="button" onClick={() => { setIsResetFlow(false); setScreen('login'); }} className={linkBase}>Reset Interface</button>
                        </div>
                    </form>
                )}

                {/* Screen: RESET MPIN */}
                {screen === 'reset-mpin' && (
                    <form onSubmit={onResetMpinSubmit} className="space-y-10 relative z-10">
                        <div className="space-y-2 text-center">
                            <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter leading-none">Update Token</h2>
                            <p className="text-charcoal/40 text-[10px] font-black uppercase tracking-widest">Setup new secure access sequence</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <i className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 flex"><LockIcon /></i>
                                <input type="password" placeholder="New Access MPIN" maxLength={6} value={mpin} onChange={(e) => setMpin(e.target.value)} className={`${inputBase} text-2xl tracking-[0.5em] placeholder:tracking-normal placeholder:text-[10px] placeholder:uppercase placeholder:font-black`} />
                            </div>
                            <div className="relative group">
                                <i className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 flex"><LockIcon /></i>
                                <input type="password" placeholder="Verify New MPIN" maxLength={6} value={confirmMpin} onChange={(e) => setConfirmMpin(e.target.value)} className={`${inputBase} text-2xl tracking-[0.5em] placeholder:tracking-normal placeholder:text-[10px] placeholder:uppercase placeholder:font-black`} />
                            </div>
                        </div>

                        <button disabled={loading} className={buttonBase}>{loading ? "Updating Token..." : "Re-Initialize Account"}</button>
                    </form>
                )}

                {/* Screen: FORGOT PHONE */}
                {screen === 'forgot-phone' && (
                    <form onSubmit={onForgotPhoneSubmit} className="space-y-10 relative z-10">
                        <div className="space-y-2 text-center">
                            <h2 className="text-3xl font-black text-charcoal uppercase tracking-tighter leading-none">Recovery Mode</h2>
                            <p className="text-charcoal/40 text-[10px] font-black uppercase tracking-widest">Enter registered terminal mobile</p>
                        </div>

                        <div className="relative group">
                            <i className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20 flex"><PhoneIcon /></i>
                            <input type="tel" placeholder="Terminal Mobile" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} className={`${inputBase} font-mono text-lg`} />
                        </div>

                        <div className="space-y-5">
                            <button disabled={loading} className={buttonBase}>{loading ? "Checking Database..." : <>Send OTP <ArrowRightIcon /></>}</button>
                            <button type="button" onClick={() => setScreen('login')} className="w-full text-center text-[10px] font-black uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors underline">Return to Registry</button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
}

