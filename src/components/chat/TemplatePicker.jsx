import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listWATemplates } from '../../api';

/**
 * TemplatePicker — Modal for browsing and selecting approved WhatsApp message templates.
 *
 * Props:
 *   open: boolean — whether the modal is visible
 *   onClose: () => void — called to dismiss the modal
 *   onSelectTemplate: (templateName: string) => void — called when a template is selected
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export default function TemplatePicker({ open, onClose, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listWATemplates();
      const all = res?.data?.data || res?.data || [];
      // Only show APPROVED templates
      const approved = Array.isArray(all)
        ? all.filter((t) => t.status === 'APPROVED')
        : [];
      setTemplates(approved);
    } catch (err) {
      setError('Unable to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch templates when modal opens
  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

  const handleSelect = (template) => {
    onSelectTemplate(template.name);
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Template Picker"
    >
      <div
        className="w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-green-600">
          <h2 className="text-base font-semibold text-white">
            Message Templates
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close template picker"
            className="flex items-center justify-center w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</p>
              <button
                type="button"
                onClick={fetchTemplates}
                className="text-sm text-green-600 dark:text-green-400 font-medium hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && templates.length === 0 && (
            <div className="px-5 py-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                No approved templates found.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Go to{' '}
                <Link
                  to="/whatsapp-templates"
                  className="text-green-600 dark:text-green-400 font-medium hover:underline"
                  onClick={onClose}
                >
                  WhatsApp Templates
                </Link>{' '}
                to create one.
              </p>
            </div>
          )}

          {/* Template list */}
          {!loading && !error && templates.length > 0 && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {templates.map((template) => (
                <li key={template.name + '_' + template.language}>
                  <button
                    type="button"
                    onClick={() => handleSelect(template)}
                    className="w-full px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {template.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {template.category}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {template.language}
                          </span>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
