/**
 * EmailTemplatesPage.jsx
 * Manage email templates — create, edit, preview, and test-send.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.8
 */
import { useState, useEffect, useRef } from 'react';
import {
    listEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    testEmailTemplate,
} from '../api';
import { useNotifications } from '../context/NotificationContext';

// ─── Design tokens ────────────────────────────────────────────────────────────
const cardClass =
    'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

const inputClass =
    'w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500';

const labelClass =
    'block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-1.5';

// ─── Supported variables ─────────────────────────────────────────────────────
const VARIABLES = [
    { key: '{{lead_name}}',     label: 'Lead Name' },
    { key: '{{lead_phone}}',    label: 'Lead Phone' },
    { key: '{{lead_email}}',    label: 'Lead Email' },
    { key: '{{campaign_name}}', label: 'Campaign' },
    { key: '{{owner_name}}',    label: 'Owner Name' },
    { key: '{{company_name}}',  label: 'Company' },
    { key: '{{form_name}}',     label: 'Form Name' },
];

// Sample values for live HTML preview
const SAMPLE_VARS = {
    '{{lead_name}}':     'Rahul Sharma',
    '{{lead_phone}}':    '+91 98765 43210',
    '{{lead_email}}':    'rahul.sharma@example.com',
    '{{campaign_name}}': 'Summer Campaign 2025',
    '{{owner_name}}':    'Priya Mehta',
    '{{company_name}}':  'OneEmployee Realty',
    '{{form_name}}':     'Luxury Flats Lead Form',
};

function substituteVars(text) {
    let result = text || '';
    for (const [key, val] of Object.entries(SAMPLE_VARS)) {
        result = result.split(key).join(val);
    }
    return result;
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner({ size = 'sm' }) {
    const s = size === 'lg' ? 'h-8 w-8 border-[3px]' : 'h-4 w-4 border-2';
    return (
        <span className={`inline-block ${s} rounded-full border-primary border-t-transparent animate-spin`} />
    );
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────
function ConfirmDeleteModal({ name, onConfirm, onCancel, deleting }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className={`${cardClass} w-full max-w-sm p-6`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20 flex-shrink-0">
                        <span className="material-symbols-outlined text-red-500 text-xl">delete</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Template?</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
                    <span className="font-bold">"{name}"</span> will be permanently deleted.
                </p>
                <div className="flex gap-3">
                    <button onClick={onConfirm} disabled={deleting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] py-3 transition-all">
                        {deleting ? <><Spinner /><span>Deleting…</span></> : 'Delete'}
                    </button>
                    <button onClick={onCancel} disabled={deleting}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Left panel — template list ───────────────────────────────────────────────
function TemplateList({ templates, loading, selectedId, onSelect, onCreate, creating }) {
    return (
        <div className="flex flex-col h-full">
            {/* List header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                    Templates
                    {templates.length > 0 && (
                        <span className="ml-2 text-slate-400 font-normal normal-case tracking-normal text-xs">
                            ({templates.length})
                        </span>
                    )}
                </h2>
                <button
                    onClick={onCreate}
                    disabled={creating}
                    className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-2 transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    New
                </button>
            </div>

            {/* List body */}
            {loading ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
            ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">mail</span>
                    <p className="text-sm font-bold text-slate-500">No templates yet</p>
                    <p className="text-xs mt-1">Click "New" to create your first one</p>
                </div>
            ) : (
                <ul className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                    {templates.map(t => (
                        <li key={t._id}>
                            <button
                                onClick={() => onSelect(t)}
                                className={`w-full text-left px-4 py-3 rounded-2xl transition-all border ${
                                    selectedId === t._id
                                        ? 'bg-gradient-to-r from-primary to-emerald-600 text-white border-transparent shadow-md shadow-primary/20'
                                        : 'border-slate-200/70 dark:border-white/10 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`material-symbols-outlined text-[15px] ${selectedId === t._id ? 'text-white' : 'text-primary'}`}>
                                        {t.isHtml ? 'code' : 'text_fields'}
                                    </span>
                                    <p className="text-xs font-bold truncate">{t.name}</p>
                                </div>
                                <p className={`text-[10px] truncate ${selectedId === t._id ? 'text-white/70' : 'text-slate-400'}`}>
                                    {t.subject || 'No subject'}
                                </p>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Right panel — editor ─────────────────────────────────────────────────────
function EditorPanel({ template, onChange, onSave, onDelete, onTestSend, saving, testing }) {
    const textareaRef = useRef(null);

    const insertVar = (varKey) => {
        const el = textareaRef.current;
        if (!el) {
            onChange('body', (template.body || '') + varKey);
            return;
        }
        const start = el.selectionStart;
        const end   = el.selectionEnd;
        const before = (template.body || '').substring(0, start);
        const after  = (template.body || '').substring(end);
        const newBody = before + varKey + after;
        onChange('body', newBody);
        // restore cursor after React re-render
        requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + varKey.length;
            el.focus();
        });
    };

    const isNew = !template._id;

    return (
        <div className="flex flex-col gap-5">
            {/* Name + Subject row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Template Name *</label>
                    <input
                        type="text"
                        value={template.name}
                        onChange={e => onChange('name', e.target.value)}
                        placeholder="e.g. Welcome Email"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Subject *</label>
                    <input
                        type="text"
                        value={template.subject}
                        onChange={e => onChange('subject', e.target.value)}
                        placeholder="e.g. Welcome, {{lead_name}}!"
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-3">
                <label className={`${labelClass} mb-0`}>Mode</label>
                <div className="flex rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    <button
                        onClick={() => onChange('isHtml', false)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                            !template.isHtml
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                    >
                        Plain Text
                    </button>
                    <button
                        onClick={() => onChange('isHtml', true)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                            template.isHtml
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                    >
                        HTML
                    </button>
                </div>
            </div>

            {/* Variable insert buttons */}
            <div>
                <label className={labelClass}>Insert Variable</label>
                <div className="flex flex-wrap gap-2">
                    {VARIABLES.map(v => (
                        <button
                            key={v.key}
                            type="button"
                            onClick={() => insertVar(v.key)}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 hover:bg-primary/5 hover:border-primary/40 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all"
                        >
                            <span className="material-symbols-outlined text-[12px] text-primary">add_circle</span>
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Body editor */}
            <div>
                <label className={labelClass}>Body {template.isHtml ? '(HTML)' : '(Plain Text)'} *</label>
                <textarea
                    ref={textareaRef}
                    rows={template.isHtml ? 10 : 8}
                    value={template.body}
                    onChange={e => onChange('body', e.target.value)}
                    placeholder={
                        template.isHtml
                            ? '<p>Hello {{lead_name}},</p>\n<p>Thank you for your interest in {{campaign_name}}.</p>'
                            : 'Hello {{lead_name}},\n\nThank you for reaching out...'
                    }
                    className={`${inputClass} font-mono text-xs leading-relaxed resize-y`}
                    spellCheck={!template.isHtml}
                />
            </div>

            {/* Live HTML preview */}
            {template.isHtml && template.body && (
                <div>
                    <label className={labelClass}>Live Preview</label>
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-auto p-5 min-h-[120px] max-h-[320px] text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                        {/* eslint-disable-next-line react/no-danger */}
                        <div dangerouslySetInnerHTML={{ __html: substituteVars(template.body) }} />
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400">Preview uses sample variable values</p>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                    onClick={onSave}
                    disabled={saving || !template.name.trim() || !template.subject.trim() || !template.body.trim()}
                    className="flex items-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 transition-all shadow-sm shadow-primary/20"
                >
                    {saving ? <><Spinner /><span>Saving…</span></> : <><span className="material-symbols-outlined text-sm">save</span>{isNew ? 'Create' : 'Save'}</>}
                </button>

                {!isNew && (
                    <button
                        onClick={onTestSend}
                        disabled={testing}
                        className="flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 transition-all"
                    >
                        {testing ? <><Spinner /><span>Sending…</span></> : <><span className="material-symbols-outlined text-sm">send</span>Test Send</>}
                    </button>
                )}

                {!isNew && (
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 transition-all ml-auto"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Empty-state for editor panel ────────────────────────────────────────────
function EditorEmptyState({ onCreate, creating }) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 mb-4">
                <span className="material-symbols-outlined text-3xl text-primary">mail</span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">No template selected</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">
                Pick a template from the list, or create a new one to start editing.
            </p>
            <button
                onClick={onCreate}
                disabled={creating}
                className="flex items-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 transition-all"
            >
                <span className="material-symbols-outlined text-sm">add</span>
                Create Template
            </button>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const BLANK_TEMPLATE = { name: '', subject: '', body: '', isHtml: false };

export default function EmailTemplatesPage() {
    const { addToast } = useNotifications();

    const [templates, setTemplates]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [selected, setSelected]         = useState(null);   // editing state (includes _id for existing)
    const [saving, setSaving]             = useState(false);
    const [testing, setTesting]           = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting]         = useState(false);
    const [creating, setCreating]         = useState(false);  // optimistic lock for "New" button

    // ── Fetch all templates ───────────────────────────────────────────────────
    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await listEmailTemplates();
            setTemplates(res.data?.data || res.data || []);
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to load email templates', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    // ── Create new (blank) template ───────────────────────────────────────────
    const handleCreate = () => {
        setSelected({ ...BLANK_TEMPLATE });
    };

    // ── Select existing ───────────────────────────────────────────────────────
    const handleSelect = (t) => {
        setSelected({ ...t });
    };

    // ── Field change ──────────────────────────────────────────────────────────
    const handleChange = (field, value) => {
        setSelected(prev => ({ ...prev, [field]: value }));
    };

    // ── Save (create or update) ───────────────────────────────────────────────
    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const payload = {
                name:    selected.name.trim(),
                subject: selected.subject.trim(),
                body:    selected.body,
                isHtml:  selected.isHtml,
            };
            if (selected._id) {
                const res = await updateEmailTemplate(selected._id, payload);
                const updated = res.data?.data || res.data;
                setTemplates(prev => prev.map(t => t._id === updated._id ? updated : t));
                setSelected({ ...updated });
                addToast('Template saved', 'success');
            } else {
                setCreating(true);
                const res = await createEmailTemplate(payload);
                const created = res.data?.data || res.data;
                setTemplates(prev => [created, ...prev]);
                setSelected({ ...created });
                addToast('Template created', 'success');
            }
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to save template', 'error');
        } finally {
            setSaving(false);
            setCreating(false);
        }
    };

    // ── Test send ─────────────────────────────────────────────────────────────
    const handleTestSend = async () => {
        if (!selected?._id) return;
        setTesting(true);
        try {
            await testEmailTemplate(selected._id);
            addToast('Test email sent to your connected inbox!', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Test send failed — check your email connection', 'error');
        } finally {
            setTesting(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!selected?._id) return;
        setDeleting(true);
        try {
            await deleteEmailTemplate(selected._id);
            setTemplates(prev => prev.filter(t => t._id !== selected._id));
            setSelected(null);
            setConfirmDelete(false);
            addToast('Template deleted', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to delete template', 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="animate-fade-in pb-10">
            <div className="mx-auto max-w-7xl px-4">

                {/* Page header */}
                <div className={`${cardClass} mb-6 p-6 md:p-8`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg flex-shrink-0">
                                <span className="material-symbols-outlined text-2xl">mail</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Email Templates</h1>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                    Create reusable templates with dynamic variables
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-sm text-primary">info</span>
                            Variables are substituted with real lead data on send
                        </div>
                    </div>
                </div>

                {/* Two-panel layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

                    {/* Left — template list */}
                    <div className={`${cardClass} p-5`}>
                        <TemplateList
                            templates={templates}
                            loading={loading}
                            selectedId={selected?._id}
                            onSelect={handleSelect}
                            onCreate={handleCreate}
                            creating={creating}
                        />
                    </div>

                    {/* Right — editor panel */}
                    <div className={`${cardClass} p-6`}>
                        {selected ? (
                            <EditorPanel
                                template={selected}
                                onChange={handleChange}
                                onSave={handleSave}
                                onDelete={() => setConfirmDelete(true)}
                                onTestSend={handleTestSend}
                                saving={saving}
                                testing={testing}
                            />
                        ) : (
                            <EditorEmptyState onCreate={handleCreate} creating={creating} />
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm delete dialog */}
            {confirmDelete && selected && (
                <ConfirmDeleteModal
                    name={selected.name || 'this template'}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDelete(false)}
                    deleting={deleting}
                />
            )}
        </div>
    );
}
