import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api';

const NotificationContext = createContext();

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-filteration-backend-624770114041.asia-south1.run.app';

function getCurrentUserId() {
    try {
        const u = localStorage.getItem('currentUser');
        return u ? JSON.parse(u)?.id : null;
    } catch { return null; }
}

function getAuthToken() {
    try {
        const u = localStorage.getItem('currentUser');
        return u ? JSON.parse(u)?.token : null;
    } catch { return null; }
}

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [userId, setUserId] = useState(getCurrentUserId);

    // Toast queue — each entry: { id, type, title, message, leadId, automationId }
    const [toasts, setToasts] = useState([]);

    // Single source of truth — derived, never manually incremented/decremented
    const unreadCount = useMemo(
        () => notifications.filter(n => !n.read).length,
        [notifications]
    );

    // Sync userId when localStorage changes (login/logout in another tab)
    useEffect(() => {
        const handleStorageChange = () => setUserId(getCurrentUserId());
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const socketRef = useRef(null);

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

        const token = getAuthToken();

        const socket = io(SOCKET_URL, {
            autoConnect: false,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            auth: token ? { token } : {},
            transports: ['polling', 'websocket'], // polling first — avoids Cloud Run WebSocket rejection on initial connect
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('📡 Socket.IO connected for notifications');
            socket.emit('join_user', userId);
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 Socket.IO disconnected:', reason);
        });

        socket.on('new_notification', (notification) => {
            console.log('🔔 New real-time notification:', notification);

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
            console.log('💬 New chat message:', payload);

            // Only toast for inbound messages from the lead — NOT for outbound (system/agent/builder)
            if (payload.sender !== 'lead') return;

            setToasts(prev => [
                ...prev,
                { 
                    id: `chat_${Date.now()}_${Math.random()}`,
                    type: 'message', 
                    title: 'New WhatsApp Message', 
                    message: payload.content || 'New message received',  // payload IS the ChatMessage doc
                    leadId: payload.leadId
                }
            ]);
            
            playChime();
        });

        socket.connect();

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('new_notification');
            socket.disconnect();
            socketRef.current = null;
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

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            toasts,
            dismissToast,
            markAsRead,
            markAllRead,
            fetchNotifications,
            socketRef,
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
