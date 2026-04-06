/**
 * Shared lead display utilities
 * Used across HistoryPage, LeadGenerationPage, and sub-components.
 */

export const getStatusClasses = (score, status = null) => {
    if (status === 'REJECTED') return 'bg-slate-50 text-slate-500 border-slate-200';
    if (status === 'HOT' || (!status && score >= 70)) return 'bg-red-50 text-red-600 border-red-200';
    if (status === 'WARM' || (!status && score >= 30)) return 'bg-orange-50 text-orange-600 border-orange-200';
    return 'bg-emerald-50 text-emerald-600 border-emerald-200'; // COLD or default
};

export const getStatusLabel = (score, status = null) => {
    if (status) return status;
    if (score >= 70) return 'HOT';
    if (score >= 30) return 'WARM';
    return 'COLD';
};

export const formatTime = (seconds) => {
    if (!seconds || seconds < 1) return '0s';
    if (seconds >= 60) {
        return (seconds / 60).toFixed(2) + 'min';
    }
    return Math.round(seconds) + 's';
};
