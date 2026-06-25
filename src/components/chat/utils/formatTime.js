/**
 * Format a date to HH:MM format for message timestamps.
 * Returns '--:--' for invalid/missing dates.
 */
export function formatTime(date) {
    if (!date) return '--:--';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Format a date for sidebar display (Today: HH:MM, Yesterday: "Yesterday", older: DD/MM/YY)
 */
export function formatSidebarTime(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return formatTime(date);
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
