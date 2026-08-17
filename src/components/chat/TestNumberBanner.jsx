/**
 * TestNumberBanner — Persistent informational banner for test number limitations
 * 
 * Props:
 *   isTestNumber: boolean  — Whether the connected number is a test number
 *   wabaApproved: boolean  — Whether WABA app review is approved (hides banner when true)
 * 
 * Behavior:
 * - Only renders when isTestNumber === true && wabaApproved === false
 * - Shows amber/yellow bar explaining 5-recipient limitation
 * - Includes link to Meta WABA Dashboard for adding recipients
 * - Includes instructions: "Go to API Setup → Manage phone number list"
 * - Dismissible via close button (stores in localStorage for session persistence)
 * - Auto-hides when WABA app review is approved
 * 
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */

import React, { useState, useEffect } from 'react';

const DISMISS_KEY = 'testNumberBannerDismissed';

const TestNumberBanner = ({ isTestNumber, wabaApproved }) => {
    const [dismissed, setDismissed] = useState(() => {
        try {
            return localStorage.getItem(DISMISS_KEY) === 'true';
        } catch {
            return false;
        }
    });

    // Auto-show again if wabaApproved changes back to false (reset dismiss state)
    useEffect(() => {
        if (wabaApproved) {
            // Clear dismiss state when approved so it shows fresh if status reverts
            try {
                localStorage.removeItem(DISMISS_KEY);
            } catch {
                // Ignore localStorage errors
            }
            setDismissed(false);
        }
    }, [wabaApproved]);

    // Don't render if not a test number, if WABA is approved, or if user dismissed
    if (!isTestNumber || wabaApproved || dismissed) {
        return null;
    }

    const handleDismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(DISMISS_KEY, 'true');
        } catch {
            // Ignore localStorage errors
        }
    };

    return (
        <div
            className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 relative"
            role="alert"
            aria-label="Test number limitation notice"
        >
            {/* Warning icon */}
            <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-medium">
                    You're using a test number. Messages can only be sent to 5 pre-verified recipients.
                </p>
                <p className="mt-1 text-amber-700 text-xs">
                    Go to API Setup → Manage phone number list
                </p>
                <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-amber-800 hover:text-amber-950 underline underline-offset-2"
                >
                    Add recipients via Meta WABA Dashboard
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3.5 1.5h7v7" />
                        <path d="M10.5 1.5L1.5 10.5" />
                    </svg>
                </a>
            </div>

            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded hover:bg-amber-100 text-amber-600 hover:text-amber-800 transition-colors"
                aria-label="Dismiss banner"
                title="Dismiss"
            >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
                </svg>
            </button>
        </div>
    );
};

export default TestNumberBanner;
