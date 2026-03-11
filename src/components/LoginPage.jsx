import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api';

/**
 * Role-specific configuration.
 * This is the ONLY place where role differences are defined.
 */
const ROLE_CONFIG = {
    admin: {
        icon: 'settings_accessibility',
        title: 'ADMIN LOGIN',
        borderColor: 'border-charcoal/20',
        buttonBg: 'bg-charcoal',
        buttonHover: 'hover:bg-black',
        focusBorder: 'focus:border-charcoal/40',
        iconColor: 'text-charcoal/40',
        footer: 'SYSTEM_PROTOCOL // ROOT_ACCESS',
        notFoundMsg: 'Admin not found with this phone number.',
        inactiveMsg: 'Admin account inactive.'
    },
    agent: {
        icon: 'support_agent',
        title: 'AGENT LOGIN',
        borderColor: 'border-blue-500',
        buttonBg: 'bg-blue-500',
        buttonHover: 'hover:bg-blue-600',
        focusBorder: 'focus:border-blue-500',
        iconColor: 'text-blue-500',
        footer: 'SYSTEM_PROTOCOL // AGENT_TERMINAL',
        notFoundMsg: 'Agent not found with this phone number.',
        inactiveMsg: 'Agent account inactive.'
    },
    builder: {
        icon: 'apartment',
        title: 'BUILDER LOGIN',
        borderColor: 'border-primary',
        buttonBg: 'bg-primary',
        buttonHover: 'hover:bg-primary/90',
        focusBorder: 'focus:border-primary',
        iconColor: 'text-primary',
        footer: 'SYSTEM_PROTOCOL // BUILDER_PORTAL',
        notFoundMsg: 'Builder not found with this phone number.',
        inactiveMsg: 'Builder account inactive.'
    }
};

const LoginPage = ({ role }) => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const config = ROLE_CONFIG[role];

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_URL}/users/login`, {
                phone: phoneNumber,
                role
            });

            if (response.data) {
                const { token, ...userData } = response.data;
                const userWithRole = { ...userData, role };
                localStorage.setItem('currentUser', JSON.stringify(userWithRole));
                if (token) {
                    localStorage.setItem('token', token);
                }
                navigate('/dashboard');
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 404) {
                setError(config.notFoundMsg);
            } else if (err.response && err.response.status === 403) {
                setError(config.inactiveMsg);
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in bg-background-light min-h-[85vh] font-display text-charcoal flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className={`border-2 shadow-lg ${config.borderColor} p-8 bg-white`}>
                    <div className="text-center mb-8 flex flex-col items-center">
                        <span className={`material-symbols-outlined text-5xl ${config.iconColor} mb-3`}>
                            {config.icon}
                        </span>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                            {config.title}
                        </h1>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 ml-1">
                                TYPE PHONE NUMBER:
                            </label>
                            <input
                                type="tel"
                                placeholder="00000 00000"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                                className={`w-full p-4 bg-surface-subtle border-2 border-charcoal/10 ${config.focusBorder} focus:outline-none font-mono text-lg text-center transition-all`}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border-2 border-red-500 flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500 text-lg font-bold">warning</span>
                                <p className="text-red-600 text-[10px] font-black uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${config.buttonBg} text-white py-4 font-black uppercase tracking-[0.2em] text-sm ${config.buttonHover} transition-all cursor-pointer disabled:opacity-50`}
                        >
                            {loading ? 'WAIT...' : 'LOGIN'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/select-role')}
                            className="mt-2 text-[10px] font-black uppercase tracking-widest text-charcoal/40 hover:text-charcoal flex items-center justify-center gap-2 cursor-pointer py-1"
                        >
                            <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                            GO BACK
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center opacity-20">
                    <p className="font-mono text-[9px] uppercase tracking-[0.3em]">
                        {config.footer}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
