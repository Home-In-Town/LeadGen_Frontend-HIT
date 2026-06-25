/**
 * MediaViewer — Full-size image overlay for viewing shared images
 * 
 * Props:
 * - imageUrl: string (the full-size image URL)
 * - onClose: () => void
 * 
 * Features:
 * - Dark backdrop with blur
 * - Centered image (max-width/max-height to fit viewport)
 * - Close on click outside the image
 * - Close on Escape key
 * - Close button (X) in top-right corner
 */

import React, { useEffect, useCallback } from 'react';

const MediaViewer = ({ imageUrl, onClose }) => {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll while overlay is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    if (!imageUrl) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
        >
            {/* Close button */}
            <button
                onClick={onClose}
                aria-label="Close image viewer"
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
            </button>

            {/* Image */}
            <img
                src={imageUrl}
                alt="Full size preview"
                onClick={(e) => e.stopPropagation()}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
        </div>
    );
};

export default MediaViewer;
