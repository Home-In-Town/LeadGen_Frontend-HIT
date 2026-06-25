/**
 * NewChatDialog — Modal for initiating a new WhatsApp conversation
 *
 * Props:
 * - open: boolean — controls modal visibility
 * - onClose: () => void — close the dialog
 * - onSuccess: (leadId: string) => void — called after successful template send, parent navigates to conversation
 *
 * Features:
 * - Phone number input with country code selector (default +91 India)
 * - Template dropdown fetching from GET /api/whatsapp/templates
 * - Submit disabled until both phone and template are selected (Property 8)
 * - Handles Meta error 131030 (test number restriction) with WABA dashboard link
 * - Handles 24-hour window error (131026) — suggests template message
 * - Loading state while sending
 * - Close on backdrop click or Escape key
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { listWATemplates } from '../../api';

const COUNTRY_CODES = [
    { code: '91', label: '🇮🇳 +91', country: 'India' },
    { code: '1', label: '🇺🇸 +1', country: 'USA' },
    { code: '44', label: '🇬🇧 +44', country: 'UK' },
    { code: '971', label: '🇦🇪 +971', country: 'UAE' },
    { code: '65', label: '🇸🇬 +65', country: 'Singapore' },
    { code: '61', label: '🇦🇺 +61', country: 'Australia' },
    { code: '49', label: '🇩🇪 +49', country: 'Germany' },
    { code: '33', label: '🇫🇷 +33', country: 'France' },
    { code: '81', label: '🇯🇵 +81', country: 'Japan' },
    { code: '86', label: '🇨🇳 +86', country: 'China' },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-filteration-backend-624770114041.asia-south1.run.app';

const NewChatDialog = ({ open, onClose, onSuccess }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('91');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const dialogRef = useRef(null);

    // Fetch templates when dialog opens
    useEffect(() => {
        if (!open) return;

        const fetchTemplates = async () => {
            setTemplatesLoading(true);
            setTemplatesError(null);
            try {
                const res = await listWATemplates();
                const allTemplates = res.data?.data || res.data || [];
                // Only show APPROVED templates
                const approved = allTemplates.filter(t => t.status === 'APPROVED');
                setTemplates(approved);
            } catch (err) {
                setTemplatesError('Unable to load templates. Please try again.');
                setTemplates([]);
            } finally {
                setTemplatesLoading(false);
            }
        };

        fetchTemplates();
    }, [open]);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setPhoneNumber('');
            setCountryCode('91');
            setSelectedTemplate('');
            setError(null);
            setSending(false);
        }
    }, [open]);

    // Close on Escape key
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    // Close on backdrop click
    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // Validate phone number (basic: at least 7 digits)
    const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 7;

    // Property 8: Submit only enabled when both phone and template are selected
    const canSubmit = isPhoneValid && selectedTemplate && !sending;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canSubmit) return;

        setSending(true);
        setError(null);

        const fullPhone = countryCode + phoneNumber.replace(/\D/g, '');

        try {
            // First, try to find or create a lead with this phone number, then send template
            const response = await fetch(`${API_BASE_URL}/api/chat/new-conversation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    phoneNumber: fullPhone,
                    templateName: selectedTemplate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific Meta error codes
                if (data.errorCode === 131030) {
                    setError({
                        type: 'test_number',
                        message: data.error || 'Recipient is not a verified test number.',
                    });
                } else if (data.errorCode === 131026) {
                    setError({
                        type: '24hr_window',
                        message: data.error || 'The 24-hour messaging window has expired. A template message is required to re-initiate conversation.',
                    });
                } else {
                    setError({
                        type: 'generic',
                        message: data.error || 'Failed to send message. Please try again.',
                    });
                }
                setSending(false);
                return;
            }

            // Success — notify parent with the leadId
            const leadId = data.data?.leadId || data.leadId;
            if (leadId && onSuccess) {
                onSuccess(leadId);
            }
            onClose();
        } catch (err) {
            setError({
                type: 'generic',
                message: 'Network error. Please check your connection and try again.',
            });
        } finally {
            setSending(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-chat-title"
        >
            <div
                ref={dialogRef}
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#075E54] text-white">
                    <h2 id="new-chat-title" className="text-lg font-semibold">
                        New Conversation
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                        aria-label="Close dialog"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Phone Number Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Phone Number
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="w-28 px-2 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                aria-label="Country code"
                            >
                                {COUNTRY_CODES.map((cc) => (
                                    <option key={cc.code} value={cc.code}>
                                        {cc.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter phone number"
                                className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                aria-label="Phone number"
                                autoFocus
                            />
                        </div>
                        {phoneNumber && !isPhoneValid && (
                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                Enter at least 7 digits
                            </p>
                        )}
                    </div>

                    {/* Template Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Message Template <span className="text-red-500">*</span>
                        </label>
                        {templatesLoading ? (
                            <div className="flex items-center gap-2 py-2.5 text-sm text-slate-400">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Loading templates...
                            </div>
                        ) : templatesError ? (
                            <p className="py-2 text-sm text-red-500">{templatesError}</p>
                        ) : templates.length === 0 ? (
                            <div className="py-2 text-sm text-slate-500 dark:text-slate-400">
                                No approved templates found.{' '}
                                <a
                                    href="/whatsapp-templates"
                                    className="text-emerald-600 hover:underline"
                                >
                                    Create templates →
                                </a>
                            </div>
                        ) : (
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                aria-label="Select template"
                            >
                                <option value="">Select a template...</option>
                                {templates.map((template) => (
                                    <option key={template.id || template.name} value={template.name}>
                                        {template.name} — {template.category} ({template.language})
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Meta requires a template message to start a new conversation
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className={`p-3 rounded-lg text-sm ${
                            error.type === 'test_number'
                                ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                                : error.type === '24hr_window'
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
                        }`}>
                            <p className="font-medium mb-1">
                                {error.type === 'test_number' && '⚠️ Test Number Restriction'}
                                {error.type === '24hr_window' && 'ℹ️ 24-Hour Window Expired'}
                                {error.type === 'generic' && '❌ Error'}
                            </p>
                            <p>{error.message}</p>
                            {error.type === 'test_number' && (
                                <a
                                    href="https://business.facebook.com/latest/whatsapp_manager/phone_numbers"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                                >
                                    Open WABA Dashboard → Manage phone number list
                                </a>
                            )}
                            {error.type === '24hr_window' && (
                                <p className="mt-1 text-xs opacity-80">
                                    Select a template above to re-initiate the conversation.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            disabled={sending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                                canSubmit
                                    ? 'bg-[#075E54] hover:bg-[#064940] text-white shadow-sm'
                                    : 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {sending && (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {sending ? 'Sending...' : 'Send Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewChatDialog;
