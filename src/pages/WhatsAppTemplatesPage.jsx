/**
 * WhatsAppTemplatesPage.jsx
 * Manage WhatsApp message templates directly from the OneEmployee dashboard.
 * Requirements: 7.2, 7.4, 7.6, 7.7, 7.8, 7.9
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-filteration-backend-624770114041.asia-south1.run.app';
const waApi = axios.create({ baseURL: `${API_BASE_URL}/api/whatsapp`, withCredentials: true });

const STATUSES = ['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'PAUSED'];
const CATEGORIES = ['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'];

const STATUS_STYLES = {
    APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    PENDING:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    PAUSED:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function WhatsAppTemplatesPage() {
    const { addToast } = useNotifications();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deletingName, setDeletingName] = useState(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        name: '', category: 'MARKETING', language: 'en',
        bodyText: '', headerText: '', footerText: '',
        buttonText: '', buttonUrl: '',
    });

    const cardClass = 'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await waApi.get('/templates');
            if (res.data.success) setTemplates(res.data.data);
        } catch (err) {
            if (err.response?.status !== 400) {
                addToast(err.response?.data?.error || 'Failed to load templates', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const filtered = templates.filter(t => {
        const statusOk = statusFilter === 'ALL' || t.status === statusFilter;
        const catOk    = categoryFilter === 'ALL' || t.category === categoryFilter;
        return statusOk && catOk;
    });

    const handleDelete = async (templateName) => {
        if (!window.confirm(`Delete template "${templateName}"? This cannot be undone.`)) return;
        try {
            setDeletingName(templateName);
            await waApi.delete(`/templates/${templateName}`);
            setTemplates(prev => prev.filter(t => t.name !== templateName));
            addToast('Template deleted', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to delete template', 'error');
        } finally {
            setDeletingName(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.bodyText.trim()) {
            addToast('Template name and body text are required', 'warning');
            return;
        }
        const components = [];
        if (form.headerText.trim()) {
            components.push({ type: 'HEADER', format: 'TEXT', text: form.headerText.trim() });
        }
        components.push({ type: 'BODY', text: form.bodyText.trim() });
        if (form.footerText.trim()) {
            components.push({ type: 'FOOTER', text: form.footerText.trim() });
        }
        if (form.buttonText.trim() && form.buttonUrl.trim()) {
            components.push({ type: 'BUTTONS', buttons: [{ type: 'URL', text: form.buttonText.trim(), url: form.buttonUrl.trim() }] });
        }
        try {
            setCreating(true);
            const res = await waApi.post('/templates', {
                name: form.name.trim().toLowerCase().replace(/\s+/g, '_'),
                category: form.category,
                language: form.language,
                components
            });
            if (res.data.success) {
                setTemplates(prev => [{ ...res.data.data, status: 'PENDING' }, ...prev]);
                setShowCreateModal(false);
                setForm({ name: '', category: 'MARKETING', language: 'en', bodyText: '', headerText: '', footerText: '', buttonText: '', buttonUrl: '' });
                addToast('Template submitted! Approval may take up to 24 hours.', 'success');
            }
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to create template', 'error');
        } finally {
            setCreating(false);
        }
    };

    const getBodyPreview = (template) => {
        const bodyComp = template.components?.find(c => c.type === 'BODY');
        return bodyComp?.text || '—';
    };

    return (
        <div className="animate-fade-in pb-10">
            <div className="mx-auto max-w-6xl px-4">

                {/* Header */}
                <div className={`${cardClass} mb-6 p-6 md:p-8`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg flex-shrink-0">
                                <span className="material-symbols-outlined text-2xl">description</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">WhatsApp Templates</h1>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Manage your message templates</p>
                            </div>
                        </div>
                        <button onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-md hover:bg-[#20b858] transition-all">
                            <span className="material-symbols-outlined text-base">add</span>
                            Create Template
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className={`${cardClass} mb-6 p-4`}>
                    <div className="flex flex-wrap gap-3">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5">Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-[#25D366]">
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5">Category</label>
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-[#25D366]">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="ml-auto self-end">
                            <p className="text-xs text-slate-500">{filtered.length} template{filtered.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>

                {/* Template list */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25D366] border-t-transparent" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`${cardClass} p-12 text-center`}>
                        <span className="material-symbols-outlined text-slate-300 text-5xl mb-3 block">description</span>
                        <p className="text-slate-500 text-sm">No templates found</p>
                        {statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? (
                            <button onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
                                className="mt-3 text-xs text-[#25D366] font-bold">Clear filters</button>
                        ) : (
                            <button onClick={() => setShowCreateModal(true)}
                                className="mt-3 text-xs text-[#25D366] font-bold">Create your first template</button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {filtered.map(t => (
                            <div key={t.id || t.name} className={`${cardClass} p-5`}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{t.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{t.category} • {t.language}</p>
                                    </div>
                                    <span className={`flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_STYLES[t.status] || STATUS_STYLES.PAUSED}`}>
                                        {t.status}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-3">
                                    {getBodyPreview(t)}
                                </p>
                                {t.status === 'REJECTED' && t.rejected_reason && (
                                    <div className="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20">
                                        <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Rejection Reason</p>
                                        <p className="text-xs text-red-600 dark:text-red-400">{t.rejected_reason}</p>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <button onClick={() => handleDelete(t.name)} disabled={deletingName === t.name}
                                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-50 transition-all">
                                        <span className="material-symbols-outlined text-sm">{deletingName === t.name ? 'hourglass_empty' : 'delete'}</span>
                                        {deletingName === t.name ? 'Deleting…' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Template Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCreateModal(false)}>
                        <div className="bg-white dark:bg-[#0F172A] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Create Template</h2>
                                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5">Template Name *</label>
                                        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="e.g. lead_welcome (lowercase, underscores)"
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-4 py-3 text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-[#25D366]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5">Category *</label>
                                            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-[#25D366]">
                                                <option value="MARKETING">Marketing</option>
                                                <option value="UTILITY">Utility</option>
                                                <option value="AUTHENTICATION">Authentication</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5">Language *</label>
                                            <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-[#25D366]">
                                                <option value="en">English</option>
                                                <option value="en_IN">English (India)</option>
                                                <option value="hi">Hindi</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5">Header (optional)</label>
                                        <input type="text" value={form.headerText} onChange={e => setForm(f => ({ ...f, headerText: e.target.value }))}
                                            placeholder="Short header text"
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-4 py-3 text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-[#25D366]" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5">
                                            Body Text * <span className="normal-case text-[9px]">(use {'{{1}}'} for variables)</span>
                                        </label>
                                        <textarea rows={4} value={form.bodyText} onChange={e => setForm(f => ({ ...f, bodyText: e.target.value }))}
                                            placeholder="Hello {{1}}, we have an exciting property for you..."
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-4 py-3 text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-[#25D366] resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5">Footer (optional)</label>
                                        <input type="text" value={form.footerText} onChange={e => setForm(f => ({ ...f, footerText: e.target.value }))}
                                            placeholder="e.g. Reply STOP to unsubscribe"
                                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-4 py-3 text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-[#25D366]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5">Button Text (optional)</label>
                                            <input type="text" value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
                                                placeholder="View Details"
                                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-3 text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-[#25D366]" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5">Button URL (optional)</label>
                                            <input type="url" value={form.buttonUrl} onChange={e => setForm(f => ({ ...f, buttonUrl: e.target.value }))}
                                                placeholder="https://..."
                                                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-3 text-sm text-slate-900 dark:text-slate-300 outline-none focus:border-[#25D366]" />
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-3">
                                        <p className="text-xs text-amber-700 dark:text-amber-400">
                                            <strong>Note:</strong> Templates are submitted to Meta for approval. Approval typically takes up to 24 hours.
                                        </p>
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button type="submit" disabled={creating}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-[#20b858] disabled:opacity-50 transition-all">
                                            {creating ? <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full" /> Submitting…</> : 'Submit for Approval'}
                                        </button>
                                        <button type="button" onClick={() => setShowCreateModal(false)}
                                            className="rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
