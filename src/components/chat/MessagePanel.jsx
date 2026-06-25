/**
 * MessagePanel — WhatsApp-style chat message panel
 *
 * Renders message list with tail grouping, typing indicator,
 * paginated scroll-up loading, optimistic message rendering,
 * and a MediaViewer overlay for image clicks.
 *
 * Requirements: 1.6, 8.1, 8.2, 15.4
 *
 * Props:
 *   leadId: string
 *   leadName: string
 *   messages: array of ChatMessage objects
 *   typingActive: boolean
 *   onSendMessage: (text) => void
 *   onSendTemplate: (templateName) => void
 *   onSendMedia: (file) => void
 *   onLoadOlderMessages: () => void
 *   hasOlderMessages: boolean
 *   loadingOlder: boolean
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageInputBar from './MessageInputBar';
import MediaViewer from './MediaViewer';
import { computeTails } from './utils/messageGrouping';

const MessagePanel = ({
  leadId,
  leadName,
  messages = [],
  typingActive = false,
  onSendMessage,
  onSendTemplate,
  onSendMedia,
  onLoadOlderMessages,
  hasOlderMessages = false,
  loadingOlder = false,
}) => {
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [mediaViewerUrl, setMediaViewerUrl] = useState(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Compute tail grouping for messages
  const tails = computeTails(messages);

  // Check if user is near the bottom of the scroll container
  const checkIfAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 100; // px from bottom to consider "at bottom"
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(atBottom);
  }, []);

  // Auto-scroll to bottom on new messages (only if user was already at bottom)
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isAtBottom]);

  // Scroll to bottom on initial mount or lead change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    setIsAtBottom(true);
  }, [leadId]);

  // Scroll event handler for detecting scroll-to-top (load older) and bottom tracking
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkIfAtBottom();

    // Detect scroll to top → load older messages
    if (container.scrollTop <= 50 && hasOlderMessages && !loadingOlder) {
      onLoadOlderMessages();
    }
  }, [checkIfAtBottom, hasOlderMessages, loadingOlder, onLoadOlderMessages]);

  // Handle media click (open MediaViewer)
  const handleMediaClick = useCallback((url) => {
    setMediaViewerUrl(url);
  }, []);

  // Close media viewer
  const handleCloseMediaViewer = useCallback(() => {
    setMediaViewerUrl(null);
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      {/* Message scroll area with WhatsApp-style background */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-[#ECE5DD] dark:bg-[#0B141A] py-4"
      >
        {/* Loading older messages indicator */}
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-sm text-xs text-slate-500 dark:text-slate-400">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading...
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <MessageBubble
            key={message._id || message.tempId || index}
            message={message}
            showTail={tails[index]}
            onMediaClick={handleMediaClick}
          />
        ))}

        {/* Typing indicator */}
        <TypingIndicator visible={typingActive} />

        {/* Anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Message input bar */}
      <MessageInputBar
        onSendMessage={onSendMessage}
        onSendMedia={onSendMedia}
        onOpenTemplatePicker={onSendTemplate}
        disabled={!leadId}
      />

      {/* Media viewer overlay */}
      {mediaViewerUrl && (
        <MediaViewer imageUrl={mediaViewerUrl} onClose={handleCloseMediaViewer} />
      )}
    </div>
  );
};

export default MessagePanel;
