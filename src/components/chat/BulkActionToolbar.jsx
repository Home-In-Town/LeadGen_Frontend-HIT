import React from 'react';

/**
 * BulkActionToolbar — Floating toolbar shown when conversations are selected in bulk mode.
 *
 * Displays the count of selected conversations, a "Send Template" button, a "Deselect All" button,
 * and a progress indicator when a bulk campaign is active.
 *
 * Props:
 *   selectedCount: number — Number of selected conversations
 *   selectedLeadIds: Set<string> — Set of selected lead IDs
 *   onSendTemplate: (templateName: string) => void — Called when user confirms template selection
 *   campaignProgress: { campaignId, total, queued, completed, failed } | null — From Socket.IO updates
 *   onDeselectAll: () => void — Clear all selections
 *
 * Validates: Requirements 14.3, 14.4, 14.6
 */
export default function BulkActionToolbar({
  selectedCount,
  selectedLeadIds,
  onSendTemplate,
  campaignProgress,
  onDeselectAll,
}) {

  if (selectedCount === 0) return null;

  const progressPercent =
    campaignProgress && campaignProgress.total > 0
      ? Math.round(
          ((campaignProgress.completed + campaignProgress.failed) /
            campaignProgress.total) *
            100
        )
      : 0;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up"
      role="toolbar"
      aria-label="Bulk action toolbar"
    >
      <div className="flex flex-col items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 min-w-[320px]">
        {/* Selection count + actions row */}
        <div className="flex items-center gap-4 w-full">
          {/* Selection count */}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
            {selectedCount} conversation{selectedCount !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {/* Send Template button */}
            <button
              type="button"
              onClick={() => onSendTemplate('')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Send template to selected conversations"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Send Template
            </button>

            {/* Deselect All button */}
            <button
              type="button"
              onClick={onDeselectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              aria-label="Deselect all conversations"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Deselect All
            </button>
          </div>
        </div>

        {/* Campaign progress indicator */}
        {campaignProgress && (
          <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-700">
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Campaign progress: ${progressPercent}%`}
              />
            </div>

            {/* Progress counts */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Completed: {campaignProgress.completed}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Failed: {campaignProgress.failed}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Total: {campaignProgress.total}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
