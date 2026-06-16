/**
 * FacebookIntegrationPage.jsx
 *
 * Production-grade Facebook Lead Ads integration page.
 * - Loads connection state from API on mount (persists across reloads)
 * - Shows all pages, all lead forms with status + lead count
 * - Shows all active form→project mappings
 * - Add / delete form mappings inline
 * - Handles token expiry, degraded mode, and disconnect
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    getFBStatus,
    disconnectFacebook,
    createFBMapping,
    deleteFBMapping,
    getFBBridgeProjects,
    initiateFBConnect,
} from '../api';
import { useNotifications } from '../context/NotificationContext';

// ─── tiny helpers ─────────────────────────────────────────────────────────────

const cardClass =
    'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

function Badge({ label, color = 'slate' }) {
    const map = {
        green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        slate:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    };
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${map[color]}`}>
            {label}
        </span>
    );
}

function Spinner({ size = 'sm' }) {
    const s = size === 'lg' ? 'h-10 w-10 border-[3px]' : 'h-5 w-5 border-2';
    return (
        <span className={`inline-block ${s} rounded-full border-primary border-t-transparent animate-spin`} />
    );
}


// ─── MappingRow — one row per existing mapping ───────────────────────────────

function MappingRow({ mapping, onDelete }) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Remove this form mapping? New leads from this form will no longer be imported.')) return;
        setDeleting(true);
        try { await onDelete(mapping._id); }
        finally { setDeleting(false); }
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {mapping.formName || mapping.fbFormId}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Form ID: {mapping.fbFormId}
                </p>
            </div>
            <Badge label={mapping.isActive ? 'Active' : 'Inactive'} color={mapping.isActive ? 'green' : 'slate'} />
            <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 disabled:opacity-40 transition-colors flex-shrink-0"
                title="Remove mapping"
            >
                {deleting
                    ? <Spinner />
                    : <span className="material-symbols-outlined text-lg">delete</span>
                }
            </button>
        </div>
    );
}


// ─── AddMappingModal — inline modal to map a form to a project ───────────────

function AddMappingModal({ form, page, projects, onSave, onClose }) {
    const [projectId, setProjectId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!projectId) { setError('Select a project first.'); return; }
        setSaving(true);
        setError('');
        try {
            await createFBMapping({
                fbFormId: form.id,
                formName: form.name,
                pageId: page.id,
                salesWebsiteProjectId: projectId,
            });
            onSave();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create mapping.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className={`${cardClass} w-full max-w-md p-6`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Map Form to Project</h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="mb-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300">{form.name}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">Leads from this form will be imported automatically</p>
                </div>

                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
                    Link to Project
                </label>
                <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
                >
                    <option value="">— Select project —</option>
                    {projects.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                            {p.title || p.name}
                        </option>
                    ))}
                </select>

                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={handleSave}
                        disabled={saving || !projectId}
                        className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-[0.2em] py-3 transition-all"
                    >
                        {saving ? 'Saving…' : 'Save Mapping'}
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}


// ─── FormCard — one card per lead form ───────────────────────────────────────

function FormCard({ form, page, mappings, projects, onMappingCreated, onMappingDeleted }) {
    const [showModal, setShowModal] = useState(false);
    const isMapped = mappings.some(m => m.fbFormId === form.id);

    const formStatus = (form.status || '').toLowerCase();
    const statusColor = formStatus === 'active' ? 'green' : formStatus === 'archived' ? 'slate' : 'yellow';

    return (
        <>
            <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-blue-400/40 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{form.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{form.id}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge label={form.status || 'Unknown'} color={statusColor} />
                        {isMapped && <Badge label="Mapped" color="blue" />}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">people</span>
                        {(form.leads_count || 0).toLocaleString('en-IN')} leads
                    </span>
                </div>

                {!isMapped ? (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] py-2.5 transition-all"
                    >
                        <span className="material-symbols-outlined text-base">add_link</span>
                        Map to Project
                    </button>
                ) : (
                    <div className="space-y-2">
                        {mappings.filter(m => m.fbFormId === form.id).map(m => (
                            <MappingRow key={m._id} mapping={m} onDelete={onMappingDeleted} />
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <AddMappingModal
                    form={form}
                    page={page}
                    projects={projects}
                    onSave={() => { setShowModal(false); onMappingCreated(); }}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}


// ─── PageSection — one section per Facebook Page ─────────────────────────────

function PageSection({ page, mappings, projects, onMappingCreated, onMappingDeleted }) {
    const [expanded, setExpanded] = useState(true);
    const forms = page.forms || [];

    return (
        <div className="border border-slate-200/70 dark:border-white/10 rounded-2xl overflow-hidden">
            {/* Page header */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-slate-50/80 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm flex-shrink-0">f</div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{page.name}</p>
                        <p className="text-xs text-slate-500">{forms.length} form{forms.length !== 1 ? 's' : ''} · Page ID: {page.id}</p>
                    </div>
                </div>
                <span className={`material-symbols-outlined text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {/* Forms list */}
            {expanded && (
                <div className="p-4 space-y-3">
                    {forms.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <span className="material-symbols-outlined text-3xl mb-2 block">description</span>
                            <p className="text-sm">No lead forms found for this page.</p>
                            <p className="text-xs mt-1">Create a Lead Ads form in Meta Ads Manager.</p>
                        </div>
                    ) : (
                        forms.map(form => (
                            <FormCard
                                key={form.id}
                                form={form}
                                page={page}
                                mappings={mappings}
                                projects={projects}
                                onMappingCreated={onMappingCreated}
                                onMappingDeleted={onMappingDeleted}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

const FacebookIntegrationPage = () => {
    const { addToast } = useNotifications();

    // ── state ──
    const [status, setStatus] = useState(null);    // null = loading
    const [loadError, setLoadError] = useState('');
    const [projects, setProjects] = useState([]);
    const [disconnecting, setDisconnecting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const pollRef = useRef(null);

    // ── load status (called on mount, after connect callback, and on manual refresh) ──
    const loadStatus = useCallback(async (quiet = false) => {
        if (!quiet) setStatus(null);
        setLoadError('');
        try {
            const res = await getFBStatus();
            setStatus(res.data);

            // Also load projects for mapping modal (non-blocking)
            getFBBridgeProjects()
                .then(r => setProjects(r.data?.data || []))
                .catch(() => {});
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to load Facebook status.';
            setLoadError(msg);
            setStatus({ connected: false });
        }
    }, []);

    // ── on mount: handle ?connected=true callback OR just load status ──
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        // Always clean the URL
        if (params.toString()) {
            window.history.replaceState({}, '', window.location.pathname);
        }
        loadStatus();
        // Poll every 60s while page is open to refresh token/form data
        pollRef.current = setInterval(() => loadStatus(true), 60_000);
        return () => clearInterval(pollRef.current);
    }, [loadStatus]);

    // ── connect ──
    const handleConnect = () => {
        initiateFBConnect(); // redirects browser to /api/facebook/connect
    };

    // ── disconnect ──
    const handleDisconnect = async () => {
        if (!window.confirm('Disconnect Facebook? All form mappings will remain but no new leads will be imported until you reconnect.')) return;
        setDisconnecting(true);
        try {
            await disconnectFacebook();
            setStatus({ connected: false });
            addToast('Facebook disconnected successfully', 'success');
        } catch {
            addToast('Failed to disconnect. Please try again.', 'error');
        } finally {
            setDisconnecting(false);
        }
    };

    // ── refresh pages + forms ──
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadStatus(false);
        setRefreshing(false);
        addToast('Pages and forms refreshed', 'success');
    };

    // ── mapping callbacks ──
    const handleMappingCreated = useCallback(() => {
        loadStatus(true);
        addToast('Form mapping saved. Leads will now import automatically.', 'success');
    }, [loadStatus, addToast]);

    const handleMappingDeleted = useCallback(async (id) => {
        try {
            await deleteFBMapping(id);
            loadStatus(true);
            addToast('Mapping removed.', 'success');
        } catch {
            addToast('Failed to remove mapping.', 'error');
        }
    }, [loadStatus, addToast]);


    // ── derived ──
    const isConnected = status?.connected === true;
    const totalForms  = (status?.pages || []).reduce((sum, p) => sum + (p.forms?.length || 0), 0);
    const totalMapped = (status?.mappings || []).length;
    const totalLeads  = (status?.pages || []).reduce(
        (sum, p) => sum + (p.forms || []).reduce((s, f) => s + (f.leads_count || 0), 0), 0
    );

    // ── loading skeleton ──
    if (status === null && !loadError) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                        Loading Facebook Integration…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
            <div className="mx-auto max-w-7xl">

                {/* ── Header ── */}
                <div className={`${cardClass} mb-8 p-6 md:p-8`}>
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                                    Meta Lead Ads
                                </span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
                                Facebook Integration
                            </h1>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                Connect Facebook pages &amp; receive lead ads instantly
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {isConnected && (
                                <button
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-all"
                                >
                                    <span className={`material-symbols-outlined text-base ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                                    {refreshing ? 'Refreshing…' : 'Refresh'}
                                </button>
                            )}
                            <div className={`inline-flex items-center gap-3 rounded-2xl px-5 py-3 font-black uppercase tracking-[0.25em] text-sm
                                ${isConnected
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                }`}
                            >
                                <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </div>
                        </div>
                    </div>

                    {/* Degraded warning */}
                    {status?.degraded && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
                            <span className="material-symbols-outlined text-yellow-500">warning</span>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Facebook API is temporarily unreachable. Showing cached data. Leads are still being received.
                            </p>
                        </div>
                    )}
                    {status?.tokenExpired && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                Your Facebook token has expired. Please reconnect to restore lead imports.
                            </p>
                        </div>
                    )}
                    {loadError && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
                        </div>
                    )}
                </div>


                {/* ── Main 2-col layout ── */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                    {/* ── Left: OAuth card ── */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className={`${cardClass} p-6 md:p-8`}>
                            <div className="mb-6 flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg flex-shrink-0">
                                    <span className="text-2xl font-black">f</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Facebook OAuth</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                                        Secure Meta authentication
                                    </p>
                                </div>
                            </div>

                            {!isConnected ? (
                                <div>
                                    <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                            Connect your Facebook account to sync Lead Ads forms directly into your CRM pipeline.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleConnect}
                                        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98]"
                                    >
                                        <span className="text-xl font-black">f</span>
                                        Connect Facebook
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {status?.connectedAt && (
                                        <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-slate-500">
                                            Connected {new Date(status.connectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleDisconnect}
                                        disabled={disconnecting}
                                        className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-red-600 transition-all hover:bg-red-500/20 dark:text-red-400 disabled:opacity-50"
                                    >
                                        {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Stats card (only when connected) */}
                        {isConnected && (
                            <div className={`${cardClass} p-5`}>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Quick Stats</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Connected Pages', value: (status?.pages || []).length, icon: 'pages' },
                                        { label: 'Lead Forms', value: totalForms, icon: 'description' },
                                        { label: 'Mapped Forms', value: totalMapped, icon: 'link' },
                                        { label: 'Total Leads (FB)', value: totalLeads.toLocaleString('en-IN'), icon: 'people' },
                                    ].map(({ label, value, icon }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="material-symbols-outlined text-base">{icon}</span>
                                                {label}
                                            </span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* ── Right: Form Mapping panel ── */}
                    <div className="lg:col-span-2">
                        <div className={`${cardClass} p-6 md:p-8`}>
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                        Lead Form Mapping
                                    </h2>
                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                                        Map Meta forms to projects — leads import automatically
                                    </p>
                                </div>
                            </div>

                            {/* Not connected */}
                            {!isConnected && (
                                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 p-12 text-center">
                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                                        <span className="material-symbols-outlined text-4xl text-slate-500 dark:text-slate-400">lock</span>
                                    </div>
                                    <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white">Facebook Not Connected</h3>
                                    <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                        Connect your Facebook account first to access lead forms and configure automatic lead routing.
                                    </p>
                                    <button
                                        onClick={handleConnect}
                                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white hover:bg-blue-700 transition-all"
                                    >
                                        <span className="text-base font-black">f</span>
                                        Connect Facebook
                                    </button>
                                </div>
                            )}

                            {/* Connected — no pages */}
                            {isConnected && (status?.pages || []).length === 0 && (
                                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 p-12 text-center">
                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
                                        <span className="material-symbols-outlined text-4xl text-blue-500">pages</span>
                                    </div>
                                    <h3 className="mb-2 text-xl font-black text-slate-900 dark:text-white">No Facebook Pages Found</h3>
                                    <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                        Make sure your Facebook account manages at least one Page with Lead Ads enabled. Then click Refresh.
                                    </p>
                                    <button
                                        onClick={handleRefresh}
                                        disabled={refreshing}
                                        className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-white/10 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 transition-all"
                                    >
                                        <span className={`material-symbols-outlined text-base ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                                        {refreshing ? 'Refreshing…' : 'Refresh Pages'}
                                    </button>
                                </div>
                            )}

                            {/* Connected — pages present */}
                            {isConnected && (status?.pages || []).length > 0 && (
                                <div className="space-y-4">
                                    {(status.pages || []).map(page => (
                                        <PageSection
                                            key={page.id}
                                            page={page}
                                            mappings={status?.mappings || []}
                                            projects={projects}
                                            onMappingCreated={handleMappingCreated}
                                            onMappingDeleted={handleMappingDeleted}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── All Mappings summary table ── */}
                        {isConnected && (status?.mappings || []).length > 0 && (
                            <div className={`${cardClass} p-6 mt-6`}>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">link</span>
                                    All Active Mappings ({status.mappings.length})
                                </h3>
                                <div className="space-y-2">
                                    {(status.mappings || []).map(m => (
                                        <div key={m._id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]">
                                            <span className="material-symbols-outlined text-base text-blue-500 flex-shrink-0">description</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                    {m.formName || m.fbFormId}
                                                </p>
                                                <p className="text-xs text-slate-500 font-mono truncate">Form ID: {m.fbFormId}</p>
                                            </div>
                                            <Badge label={m.isActive ? 'Active' : 'Inactive'} color={m.isActive ? 'green' : 'slate'} />
                                            <button
                                                onClick={() => handleMappingDeleted(m._id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors flex-shrink-0"
                                                title="Remove"
                                            >
                                                <span className="material-symbols-outlined text-base">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FacebookIntegrationPage;
