import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * MessageInputBar — WhatsApp-style rich message input bar.
 *
 * Layout: [Emoji][Attachment][TextInput][Template][Send]
 *
 * Props:
 *   onSendMessage: (text: string) => void
 *   onSendMedia: (file: File) => void
 *   onOpenTemplatePicker: () => void
 *   disabled: boolean
 */

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  '.doc',
  '.docx',
].join(',');

// Common emojis for quick insertion (lightweight inline picker)
const QUICK_EMOJIS = ['😊', '👍', '❤️', '😂', '🙏', '🎉', '✅', '🔥', '💯', '👋'];

export default function MessageInputBar({
  onSendMessage,
  onSendMedia,
  onOpenTemplatePicker,
  disabled = false,
}) {
  const [text, setText] = useState('');
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPanelRef = useRef(null);

  // Auto-grow textarea based on content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  // Close emoji panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(e.target)
      ) {
        setShowEmojiPanel(false);
      }
    }
    if (showEmojiPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPanel]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter naturally inserts newline (default textarea behavior)
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setText('');
    // Reset height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleEmojiInsert = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + emoji + after;
    setText(newText);

    // Restore cursor position after emoji
    requestAnimationFrame(() => {
      const newPos = start + emoji.length;
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
      textarea.focus();
    });
  };

  const handleAttachmentClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onSendMedia) {
      onSendMedia(file);
    }
    // Reset the input so re-selecting the same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-end gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      {/* Emoji button */}
      <div className="relative" ref={emojiPanelRef}>
        <button
          type="button"
          onClick={() => setShowEmojiPanel((prev) => !prev)}
          disabled={disabled}
          aria-label="Emoji"
          className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        </button>

        {/* Inline emoji panel */}
        {showEmojiPanel && (
          <div className="absolute bottom-12 left-0 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 p-2 z-50 min-w-[200px]">
            <div className="grid grid-cols-5 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiInsert(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  aria-label={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attachment button */}
      <button
        type="button"
        onClick={handleAttachmentClick}
        disabled={disabled}
        aria-label="Attach file"
        className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Text input area */}
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          disabled={disabled}
          rows={1}
          className="w-full resize-none rounded-lg px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm leading-5 max-h-[150px] overflow-y-auto"
        />
      </div>

      {/* Template button */}
      <button
        type="button"
        onClick={onOpenTemplatePicker}
        disabled={disabled}
        aria-label="Templates"
        title="Send template message"
        className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        aria-label="Send message"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
