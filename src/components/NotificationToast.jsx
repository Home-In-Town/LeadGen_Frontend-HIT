import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

// Icon and accent color per notification type — matches NotificationCenter
const TYPE_CONFIG = {
    LEAD_CREATED:     { icon: 'person_add',        accent: 'text-blue-500',    bg: 'bg-blue-500/10' },
    WHATSAPP_REPLY:   { icon: 'chat',               accent: 'text-primary',     bg: 'bg-primary/10' },
    CALL_COMPLETED:   { icon: 'call',               accent: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    LINK_OPENED:      { icon: 'bolt',               accent: 'text-primary',     bg: 'bg-primary/10' },
    AUTOMATION_STATUS:{ icon: 'schedule_send',      accent: 'text-purple-500',  bg: 'bg-purple-500/10' },
    message:          { icon: 'forum',               accent: 'text-primary',     bg: 'bg-primary/10' },
    LEAD_REJECTED:    { icon: 'not_interested',     accent: 'text-red-500',     bg: 'bg-red-500/10' },
    LEAD_INTERESTED:  { icon: 'favorite',           accent: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

const TOAST_DURATION_MS = 4500;
const PROGRESS_INTERVAL_MS = 50;

/**
 * Single toast card. Auto-dismisses after TOAST_DURATION_MS.
 * Progress bar drains in real time so the user knows how long they have.
 */
const ToastCard = ({ notification, onDismiss }) => {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(100);
    const intervalRef = useRef(null);
    const startRef = useRef(Date.now());

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION_MS) * 100);
            setProgress(remaining);
            if (remaining === 0) {
                clearInterval(intervalRef.current);
                onDismiss();
            }
        }, PROGRESS_INTERVAL_MS);

        return () => clearInterval(intervalRef.current);
    }, [onDismiss]);

    const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.LINK_OPENED;

    const getRoute = () => {
        if (notification.type === 'message') return '/chat';
        if (notification.type === 'AUTOMATION_STATUS') {
            return notification.leadId ? `/lead-automation/${notification.leadId}` : '/lead-automation';
        }
        if (notification.leadId) return `/lead/${notification.leadId}`;
        return '/history';
    };

    const handleClick = () => {
        onDismiss();
        navigate(getRoute());
    };

    return (
        <div
            onClick={handleClick}
            className="relative w-[340px] max-w-[90vw] bg-white border border-charcoal/10
                       shadow-[4px_4px_0px_0px_rgba(15,17,21,0.08)]
                       cursor-pointer overflow-hidden
                       animate-toast-in font-display"
            role="alert"
            aria-live="polite"
        >
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-current ${cfg.accent}`} />

            <div className="flex items-start gap-4 p-4 pt-5">
                {/* Icon */}
                <div className={`shrink-0 w-9 h-9 flex items-center justify-center ${cfg.bg} ${cfg.accent}`}>
                    <span className="material-symbols-outlined text-[18px]">{cfg.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal leading-tight truncate">
                        {notification.title}
                    </p>
                    <p className="text-[11px] font-medium text-charcoal/50 leading-snug mt-0.5 line-clamp-2">
                        {notification.message}
                    </p>
                </div>

                {/* Dismiss */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                    className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center
                               text-charcoal/20 hover:text-charcoal transition-colors border-none bg-transparent cursor-pointer"
                    aria-label="Dismiss"
                >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
            </div>

            {/* Draining progress bar */}
            <div className="h-[2px] bg-charcoal/5">
                <div
                    className={`h-full bg-current ${cfg.accent} transition-none`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

/**
 * NotificationToastContainer
 * Consumes the toast queue from NotificationContext and renders each toast
 * via a React portal at document.body. Stacks bottom-right, newest on top.
 */
export const NotificationToastContainer = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return createPortal(
        <div
            className="fixed bottom-6 right-6 z-[2000] flex flex-col-reverse gap-3 pointer-events-none"
            aria-label="Notification toasts"
        >
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastCard
                        notification={toast}
                        onDismiss={() => onDismiss(toast.id)}
                    />
                </div>
            ))}
        </div>,
        document.body
    );
};

export default NotificationToastContainer;
