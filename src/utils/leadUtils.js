/**
 * Shared lead display utilities
 * Used across HistoryPage, LeadGenerationPage, and sub-components.
 */

export const getStatusClasses = (score) => {
    if (score >= 80) return 'bg-red-50 text-red-600 border-red-200'; // HOT
    if (score >= 50) return 'bg-orange-50 text-orange-600 border-orange-200'; // WARM
    return 'bg-emerald-50 text-emerald-600 border-emerald-200'; // COLD
};

export const getStatusLabel = (score) => {
    if (score >= 80) return 'HOT';
    if (score >= 50) return 'WARM';
    return 'COLD';
};

export const formatTime = (seconds) => {
    if (!seconds || seconds < 1) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};
