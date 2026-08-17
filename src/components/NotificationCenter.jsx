import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const NOTIFICATION_ICONS = {
    LEAD_CREATED: {
        icon: 'person_add',
        iconClass:
            'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20',
    },
    WHATSAPP_REPLY: {
        icon: 'chat',
        iconClass:
            'bg-primary/10 text-primary ring-1 ring-primary/20',
    },
    CALL_COMPLETED: {
        icon: 'call',
        iconClass:
            'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20',
    },
    LINK_OPENED: {
        icon: 'bolt',
        iconClass:
            'bg-primary/10 text-primary ring-1 ring-primary/20',
    },
    AUTOMATION_STATUS: {
        icon: 'schedule_send',
        iconClass:
            'bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20',
    },
    LEAD_INTERESTED: {
        icon: 'favorite',
        iconClass:
            'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20',
    },
    LEAD_REJECTED: {
        icon: 'not_interested',
        iconClass:
            'bg-red-500/10 text-red-500 ring-1 ring-red-500/20',
    },
    DEFAULT: {
        icon: 'notifications',
        iconClass:
            'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20',
    },
};

const NotificationCenter = () => {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
    } = useNotifications();

    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);

    const buttonRef = useRef(null);
    const sidebarRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (
                buttonRef.current?.contains(event.target) ||
                sidebarRef.current?.contains(event.target)
            ) {
                return;
            }

            setIsOpen(false);
        };

        const timer = setTimeout(() => {
            document.addEventListener(
                'mousedown',
                handleClickOutside
            );
        }, 80);

        return () => {
            clearTimeout(timer);
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
        };
    }, [isOpen]);

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
    };

    const formatTime = useCallback((dateString) => {
        try {
            return new Date(dateString).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '--:--';
        }
    }, []);

    const getNotificationRoute = useCallback((notification) => {
        const { type, leadId } = notification;

        if (type === 'WHATSAPP_REPLY') {
            return '/chat';
        }

        if (type === 'AUTOMATION_STATUS') {
            return leadId
                ? `/lead-automation/${leadId}`
                : '/lead-automation';
        }

        if (leadId) {
            return `/lead/${leadId}`;
        }

        return '/crm';
    }, []);

    const handleNotificationClick = useCallback(
        async (notification) => {
            try {
                if (!notification.read) {
                    await markAsRead(notification._id);
                }
            } catch (error) {
                console.error(
                    'Failed to mark notification as read:',
                    error
                );
            }

            setIsOpen(false);

            navigate(getNotificationRoute(notification));
        },
        [markAsRead, navigate, getNotificationRoute]
    );

    const renderedNotifications = useMemo(() => {
        if (notifications.length === 0) {
            return (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                    <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 backdrop-blur-xl">
                        <span className="material-symbols-outlined text-[42px] text-slate-300 dark:text-slate-600">
                            notifications_off
                        </span>

                        <div className="absolute inset-0 rounded-full bg-primary/5 blur-2xl" />
                    </div>

                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                        All Caught Up
                    </h4>

                    <p className="mt-3 max-w-[220px] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        No new activity detected in the system.
                    </p>
                </div>
            );
        }

        return (
            <div className="flex flex-col px-2 py-3">
                {notifications.map((notification) => {
                    const config =
                        NOTIFICATION_ICONS[notification.type] ||
                        NOTIFICATION_ICONS.DEFAULT;

                    return (
                        <button
                            key={notification._id}
                            type="button"
                            onClick={() =>
                                handleNotificationClick(notification)
                            }
                            className={`
    group
    relative
    flex
    w-full
    items-start
    gap-4
    overflow-hidden
    rounded-[18px]
    border
    p-4
    text-left
    transition-all
    duration-200
    hover:-translate-y-[1px]
    hover:shadow-lg
    ${
        notification.read
            ? `
                border-slate-200/60
                bg-white/50
                opacity-75
                hover:bg-white/80

                dark:border-white/10
                dark:bg-white/[0.03]
                dark:hover:bg-white/[0.06]
            `
            : `
                border-primary/10
                bg-white
                shadow-[0_4px_20px_rgba(255,107,0,0.06)]

                dark:border-primary/20
                dark:bg-[#11141B]
                dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)]
            `
    }
`}
                        >
                            {!notification.read && (
                                <div className="absolute left-0 top-0 h-full w-[3px] bg-primary" />
                            )}

                            <div
                                className={`
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-[14px]
                                    transition-transform
                                    duration-200
                                    group-hover:scale-105
                                    ${config.iconClass}
                                `}
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {config.icon}
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-start justify-between gap-3">
                                    <h4 className="truncate pr-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-900 dark:text-white transition-colors group-hover:text-primary">
                                        {notification.title}
                                    </h4>

                                    <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {formatTime(
                                            notification.createdAt
                                        )}
                                    </span>
                                </div>

                                <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                    {notification.message}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }, [
        notifications,
        formatTime,
        handleNotificationClick,
    ]);

    const sidebarPortal = createPortal(
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed
                    inset-0
                    z-[1000]
                    bg-black/30
                    backdrop-blur-[2px]
                    transition-opacity
                    duration-300
                    ${
                        isOpen
                            ? 'pointer-events-auto opacity-100'
                            : 'pointer-events-none opacity-0'
                    }
                `}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            {/* Drawer */}
            <aside
                ref={sidebarRef}
                aria-label="Notifications panel"
                className={`
                    fixed
                    right-0
                    top-0
                    z-[1001]
                    flex
                    h-screen
                    w-[380px]
                    max-w-[92vw]
                    flex-col
                    border-l
                    border-white/20
                    bg-white/75
                    shadow-[-20px_0_60px_rgba(15,23,42,0.12)]
                    backdrop-blur-2xl
                    transition-transform
                    duration-500
                    ease-[cubic-bezier(0.16,1,0.3,1)]
                    dark:border-white/10
                    dark:bg-[#0B0D12]/80
                    ${
                        isOpen
                            ? 'translate-x-0'
                            : 'translate-x-full'
                    }
                `}
            >
                {/* Top Glow */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent" />

                {/* Header */}
                <div className="relative z-10 border-b border-slate-200/70 bg-white/60 px-5 pb-4 pt-7 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />

                                <span className="text-[9px] font-black uppercase tracking-[0.28em] text-primary">
                                    Live Activity
                                </span>
                            </div>

                            <h2 className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                Notifications
                            </h2>

                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                Real-time system events
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    className="
                                        rounded-full
                                        border
                                        border-primary/20
                                        bg-primary/5
                                        px-3
                                        py-1.5
                                        text-[9px]
                                        font-black
                                        uppercase
                                        tracking-[0.18em]
                                        text-primary
                                        transition-all
                                        hover:bg-primary
                                        hover:text-white
                                    "
                                >
                                    Mark All
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-slate-200/80
                                    bg-white/70
                                    text-slate-500
                                    transition-all
                                    hover:rotate-90
                                    hover:border-primary/20
                                    hover:text-primary
                                    dark:border-white/10
                                    dark:bg-white/5
                                "
                                aria-label="Close notifications"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    close
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-y-auto custom-scrollbar">
                    {renderedNotifications}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200/70 bg-white/60 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

                        <span className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">
                            Secure Realtime Sync Active
                        </span>
                    </div>
                </div>
            </aside>
        </>,
        document.body
    );

    return (
        <>
            {/* Notification Trigger */}
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleDropdown}
                title="Notifications"
                aria-expanded={isOpen}
                aria-label="Open notifications"
                className={`
                    relative
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-[16px]
                    border
                    border-slate-200/70
                    bg-white/70
                    text-slate-700
                    shadow-sm
                    backdrop-blur-xl
                    transition-all
                    duration-200
                    hover:-translate-y-[1px]
                    hover:border-primary/20
                    hover:bg-white
                    hover:text-primary
                    hover:shadow-md
                    active:scale-95
                    dark:border-white/10
                    dark:bg-white/[0.05]
                    dark:text-slate-200
                `}
            >
                <span className="material-symbols-outlined text-[22px] transition-transform duration-200 group-hover:scale-105">
                    {unreadCount > 0
                        ? 'notifications_active'
                        : 'notifications'}
                </span>

                {unreadCount > 0 && (
                    <>
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-primary px-1 text-[9px] font-black text-white shadow-lg dark:border-[#0B0D12]">
                            {unreadCount > 9
                                ? '9+'
                                : unreadCount}
                        </span>

                        <span className="absolute inset-0 rounded-[16px] border border-primary/30 animate-ping" />
                    </>
                )}
            </button>

            {sidebarPortal}
        </>
    );
};

export default NotificationCenter;