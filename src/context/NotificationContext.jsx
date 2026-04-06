import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-filteration-backend-624770114041.asia-south1.run.app';

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const userId = user?.id || null;

    const [notifications, setNotifications] = useState([]);

    // Toast queue — each entry: { id, type, title, message, leadId, automationId }
    const [toasts, setToasts] = useState([]);

    // Single source of truth — derived, never manually incremented/decremented
    const unreadCount = useMemo(
        () => notifications.filter(n => !n.read).length,
        [notifications]
    );

    const socketRef = useRef(null);
    const [socketInstance, setSocketInstance] = useState(null);

    // Audio chime for new notifications
    const audioRef = useRef(null);
    const playChime = useCallback(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/assets/chime.mp3');
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {}); // Ignore autoplay errors
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            const { data } = await getNotifications(userId);
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        fetchNotifications();

        const socket = io(SOCKET_URL, {
            autoConnect: false,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            withCredentials: true,
            transports: ['polling', 'websocket']
        });

        socketRef.current = socket;
        setSocketInstance(socket);

        socket.on('connect', () => {
            console.log('🔌 Socket connected:', socket.id);
            if (userId) {
                console.log('👤 Joining user room:', userId);
                socket.emit('join_user', userId);
            }
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });

        socket.on('disconnect', (reason) => {
            console.warn('🔌 Socket disconnected:', reason);
        });

        socket.on('disconnect', (reason) => {
        });

        socket.on('new_notification', (notification) => {

            // Prepend to persistent list
            setNotifications(prev => [notification, ...prev]);

            // Push into toast queue with a unique ephemeral id
            setToasts(prev => [
                ...prev,
                { ...notification, id: `toast_${Date.now()}_${Math.random()}` }
            ]);

            // Play audio chime
            playChime();

            // Browser push when tab is backgrounded
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification(notification.title, { body: notification.message });
            }
        });

        socket.on('new_chat_message', (payload) => {
            // Safety: ignore malformed payloads
            if (!payload) return;
            
            // Only toast for inbound messages from the lead — NOT for outbound (system/agent/builder)
            if (payload.sender !== 'lead') return;

            // Optional: Don't show toast if already on the chat page with this lead active?
            // For now, show it anyway as requested.

            const messageContent = payload.content || payload.body || 'New message received';
            
            // Note: We no longer create a manual toast or chime here because 
            // the backend already emits a 'new_notification' event ('WhatsApp Reply Received')
            // which is handled by the 'new_notification' listener above.
        });

        socket.connect();

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('new_notification');
            socket.off('new_chat_message');
            socket.disconnect();
            socketRef.current = null;
            setSocketInstance(null);
        };
    }, [userId]);

    // Request browser notification permission once on mount
    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }, []);

    const dismissToast = useCallback((toastId) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
    }, []);

    const markAsRead = useCallback(async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Failed to mark read:', err);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        if (!userId) return;
        try {
            await markAllNotificationsRead(userId);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    }, [userId]);

    const addToast = useCallback((message, type = 'info', title = 'Notification') => {
        const id = `toast_${Date.now()}_${Math.random()}`;
        setToasts(prev => [...prev, { id, message, type, title }]);
        return id;
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            toasts,
            addToast,
            dismissToast,
            markAsRead,
            markAllRead,
            fetchNotifications,
            playChime,
            socketRef,
            socket: socketInstance,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};
