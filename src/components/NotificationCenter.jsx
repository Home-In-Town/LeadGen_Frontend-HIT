import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const sidebarRef = useRef(null);  // ref for the aside panel itself
    const navigate = useNavigate();

    // Close sidebar on click outside — but NOT when clicking inside the aside panel
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            // If click is on the bell button, let the button toggle handle it
            if (buttonRef.current && buttonRef.current.contains(event.target)) return;
            // If click is inside the sidebar panel itself, do NOT close
            if (sidebarRef.current && sidebarRef.current.contains(event.target)) return;
            // Only close if truly outside both
            setIsOpen(false);
        };

        // Small delay so the open-click doesn't immediately re-close
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '--:--';
        }
    };

    const getNotificationRoute = (n) => {
        const { type, leadId } = n;
        
        // Lead Automation Page always wants the leadId to show the calendar
        if (type === 'AUTOMATION_STATUS') {
            return leadId ? `/lead-automation/${leadId}` : '/lead-automation';
        }
        
        // Most other notifications (LEAD_CREATED, LINK_OPENED, WHATSAPP_REPLY) 
        // point to the context of a specific lead.
        if (leadId) return `/lead/${leadId}`;
        
        return '/history'; // fallback
    };

    const handleNotificationClick = useCallback((n) => {
        console.log('🎯 Notification clicked:', n.type, n.leadId);
        
        // 1. Mark as read in background
        if (!n.read) {
            markAsRead(n._id).catch(err => console.error('Failed to mark read:', err));
        }

        // 2. Determine destination
        const route = getNotificationRoute(n);
        console.log('🚀 Navigating to:', route);

        // 3. UI Actions
        setIsOpen(false);
        navigate(route);
    }, [markAsRead, navigate]);

    const sidebarPortal = createPortal(
        <>
            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black/10 z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            {/* Main Sidebar Drawer */}
            <aside
                ref={sidebarRef}
                className={`fixed top-0 right-0 h-screen w-[400px] max-w-[90vw] bg-white border-l border-charcoal/5 shadow-[-30px_0_60px_rgba(0,0,0,0.12)] z-[1001] flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                aria-hidden={!isOpen}
                aria-label="Activity center"
            >
                {/* Header: Activity & Actions */}
                <div className="shrink-0 p-5 pt-8 pb-4 bg-white/80 backdrop-blur-xl flex flex-col gap-4 sticky top-0 z-20 border-b border-charcoal/5">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-charcoal">
                                Activity
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-charcoal/30">Live Status</span>
                                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-charcoal transition-colors cursor-pointer"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-charcoal/5 border-none text-charcoal/20 hover:text-charcoal transition-all cursor-pointer group"
                                aria-label="Close activity center"
                            >
                                <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300">close</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-charcoal/[0.02] flex items-center justify-center mb-6 relative">
                                <span className="material-symbols-outlined text-charcoal/5 text-[40px]">notifications_off</span>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/5 rounded-full blur-[40px] pointer-events-none animate-pulse"></div>
                            </div>
                            <h4 className="text-[12px] font-black uppercase tracking-widest text-charcoal mb-3">All Caught Up</h4>
                            <p className="text-[10px] font-bold uppercase tracking-tight text-charcoal/20 max-w-[180px] leading-relaxed">
                                No new events to report.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col pb-20">
                            {notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleNotificationClick(n);
                                    }}
                                    className={`relative px-6 py-4 border-b border-charcoal/[0.03] transition-all cursor-pointer group flex gap-4
                                        ${!n.read ? 'bg-white' : 'bg-charcoal/[0.01] opacity-70'}
                                        hover:bg-charcoal/[0.02]`}
                                    title={n.read ? 'View' : 'Mark as read'}
                                >
                                    {/* Icon Container */}
                                    <div className="shrink-0 flex items-start">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-105 ${
                                            n.type === 'LEAD_CREATED' ? 'bg-blue-500/5 text-blue-500' :
                                            n.type === 'LINK_OPENED' ? 'bg-primary/5 text-primary' :
                                            'bg-charcoal/5 text-charcoal/40'
                                        }`}>
                                            <span className="material-symbols-outlined text-[16px]">
                                                {n.type === 'LEAD_CREATED' ? 'person_add' :
                                                 n.type === 'LINK_OPENED' ? 'bolt' : 'notifications'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <h4 className="text-[11px] font-black text-charcoal uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                                                {n.title}
                                            </h4>
                                            <span className="text-[8px] font-black text-charcoal/20 uppercase tracking-tighter shrink-0">
                                                {formatTime(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-medium text-charcoal/40 leading-tight truncate">
                                            {n.message}
                                        </p>
                                    </div>

                                    {/* Unread Indicator Dot */}
                                    {!n.read && (
                                        <div className="absolute top-1/2 -translate-y-1/2 left-2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(255,107,0,0.4)]"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-auto shrink-0 p-4 bg-white border-t border-charcoal/5 flex items-center justify-center z-20">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-charcoal/20">System Encrypted & Active</span>
                    </div>
                </div>
            </aside>
        </>,
        document.body
    );

    return (
        <>
            {/* Notification Bell Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleDropdown}
                className="relative p-2 text-charcoal/60 hover:text-primary transition-colors cursor-pointer group flex items-center justify-center bg-transparent border-none outline-none"
                title="Notifications"
                aria-expanded={isOpen}
                aria-label="Open notifications"
            >
                <span className="material-symbols-outlined text-[20px] lg:text-[22px] group-active:scale-95 transition-transform">
                    {unreadCount > 0 ? 'notifications_active' : 'notifications'}
                </span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Sidebar rendered at document.body level via portal */}
            {sidebarPortal}
        </>
    );
};

export default NotificationCenter;
