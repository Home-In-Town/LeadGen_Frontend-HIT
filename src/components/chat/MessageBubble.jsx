/**
 * MessageBubble — WhatsApp-style message bubble component
 * 
 * Renders outbound (green, right-aligned) and inbound (white, left-aligned) messages
 * with support for text, images, documents, templates, and internal notes.
 * 
 * Props:
 * - message: { content, sender, createdAt, deliveryStatus, messageType, mediaUrl, fileName, fileSize, mimeType, templateName }
 * - showTail: boolean (whether to show pointed tail on bubble)
 * - onMediaClick: (url) => void (opens MediaViewer)
 */

import React from 'react';
import { formatTime } from './utils/formatTime';
import { getDirection } from './utils/messageGrouping';
import DeliveryStatusIcon from './DeliveryStatusIcon';

const MessageBubble = ({ message, showTail = false, onMediaClick }) => {
    const { content, sender, createdAt, deliveryStatus, messageType, mediaUrl, fileName, fileSize, mimeType, templateName } = message;

    const direction = getDirection(sender);
    const isOutbound = direction === 'outbound';
    const isNote = messageType === 'note';

    // Format file size for display
    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Bubble color classes
    const getBubbleClasses = () => {
        if (isNote) {
            return 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700';
        }
        if (isOutbound) {
            return 'bg-[#DCF8C6] dark:bg-[#005C4B]';
        }
        return 'bg-white dark:bg-[#1E293B]';
    };

    // Alignment classes
    const getAlignmentClasses = () => {
        if (isNote) {
            return isOutbound ? 'ml-auto' : 'mr-auto';
        }
        return isOutbound ? 'ml-auto' : 'mr-auto';
    };

    // Tail SVG for outbound (bottom-right)
    const OutboundTail = () => (
        <div className="absolute -right-2 bottom-0">
            <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
                <path
                    d="M0 0V13C0 13 1.5 8 8 0H0Z"
                    className="fill-[#DCF8C6] dark:fill-[#005C4B]"
                />
            </svg>
        </div>
    );

    // Tail SVG for inbound (bottom-left)
    const InboundTail = () => (
        <div className="absolute -left-2 bottom-0">
            <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
                <path
                    d="M8 0V13C8 13 6.5 8 0 0H8Z"
                    className="fill-white dark:fill-[#1E293B]"
                />
            </svg>
        </div>
    );

    // Note icon
    const NoteIcon = () => (
        <svg className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
    );

    // Document icon
    const DocumentIcon = () => (
        <svg className="w-10 h-10 text-slate-400 dark:text-slate-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
        </svg>
    );

    // Render image message content
    const renderImage = () => (
        <div className="mb-1">
            <img
                src={mediaUrl}
                alt={content || 'Image'}
                className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onMediaClick && onMediaClick(mediaUrl)}
            />
            {content && (
                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                    {content}
                </p>
            )}
        </div>
    );

    // Render document message content
    const renderDocument = () => (
        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-1">
            <DocumentIcon />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {fileName || 'Document'}
                </p>
                {fileSize && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileSize(fileSize)}
                    </p>
                )}
            </div>
            {mediaUrl && (
                <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={fileName}
                    className="flex-shrink-0 p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    title="Download"
                >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </a>
            )}
        </div>
    );

    // Render text/default content
    const renderTextContent = () => (
        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
            {content}
        </p>
    );

    // Render template badge
    const renderTemplateBadge = () => {
        if (!templateName && messageType !== 'template') return null;
        return (
            <div className="mb-1">
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    {templateName || 'Template'}
                </span>
            </div>
        );
    };

    // Render main content based on message type
    const renderContent = () => {
        switch (messageType) {
            case 'image':
                return mediaUrl ? renderImage() : renderTextContent();
            case 'document':
                return renderDocument();
            default:
                return renderTextContent();
        }
    };

    return (
        <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
            <div
                className={`relative max-w-[65%] min-w-[80px] rounded-lg px-3 py-1.5 shadow-sm ${getBubbleClasses()} ${getAlignmentClasses()}`}
            >
                {/* Tail */}
                {showTail && !isNote && (
                    isOutbound ? <OutboundTail /> : <InboundTail />
                )}

                {/* Note indicator */}
                {isNote && (
                    <div className="flex items-center gap-1.5 mb-1">
                        <NoteIcon />
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            Internal Note
                        </span>
                    </div>
                )}

                {/* Template badge */}
                {renderTemplateBadge()}

                {/* Message content */}
                {renderContent()}

                {/* Timestamp + Delivery status */}
                <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                        {formatTime(createdAt)}
                    </span>
                    {isOutbound && !isNote && (
                        <DeliveryStatusIcon status={deliveryStatus} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
