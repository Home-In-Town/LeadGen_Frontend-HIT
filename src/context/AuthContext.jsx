import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'

    const checkAuth = useCallback(async () => {
        try {
            const res = await authApi.getSession();
            if (res.data.authenticated) {
                setUser(res.data.user);
                setStatus('authenticated');
            } else {
                setUser(null);
                setStatus('unauthenticated');
            }
        } catch {
            setUser(null);
            setStatus('unauthenticated');
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {
            // Ignore errors — clear state regardless
        }
        setUser(null);
        setStatus('unauthenticated');
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <AuthContext.Provider value={{ user, status, setUser, checkAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
