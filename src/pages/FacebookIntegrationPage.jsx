/**
 * FacebookIntegrationPage.jsx
 *
 * 4-tab Facebook Lead Ads integration page:
 *   Tab 1: Overview    — connection status + quick stats
 *   Tab 2: Campaigns   — campaigns + forms from DB (synced via Meta Graph API)
 *   Tab 3: Leads       — mini-CRM table of FB leads (source='facebook')
 *   Tab 4: Settings    — historical import, auto-sync toggle, disconnect
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getFBStatus,
    disconnectFacebook,
    createFBMapping,
    deleteFBMapping,
    initiateFBConnect,
    importFBHistorical,
    syncFBCampaigns,
    getFBCampaigns,
    getAllLeads,
    getLeadAutomationHistory,
    listEmailTemplates,
} from '../api';
import CampaignConfigModal from '../components/CampaignConfigModal';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

// ─── Design tokens ────────────────────────────────────────────────────────────

const cardClass =
    'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Badge({ label, color = 'slate' }) {
    const map = {
        green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        slate:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${map[color] || map.slate}`}>
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

function relativeTime(date) {
    if (!date) return 'Never';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function statusBadgeColor(status) {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE')   return 'green';
    if (s === 'PAUSED')   return 'yellow';
    if (s === 'HOT')      return 'red';
    if (s === 'WARM')     return 'orange';
    if (s === 'COLD')     return 'blue';
    return 'slate';
}

// ─── AddMappingModal ─────────────────────────────────────────────────────────

function AddMappingModal({ form, projects, onSave, onClose }) {
    const [projectId, setProjectId] = useState('');
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');

    const handleSave = async () => {
        if (!projectId) { setError('Select a project first.'); return; }
        setSaving(true); setError('');
        try {
            await createFBMapping({
                fbFormId:              form.formId,
                formName:              form.formName,
                salesWebsiteProjectId: projectId,
            });
            onSave();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create mapping.');
        } finally { setSaving(false); }
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
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300">{form.formName || form.formId}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">Leads from this form will be imported automatically</p>
                </div>
                <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Link to Project</label>
                <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
                >
                    <option value="">— Select project —</option>
                    {(projects || []).map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>{p.title || p.name}</option>
                    ))}
                </select>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                <div className="flex gap-3 mt-5">
                    <button onClick={handleSave} disabled={saving || !projectId}
                        className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-[0.2em] py-3 transition-all">
                        {saving ? 'Saving…' : 'Save Mapping'}
                    </button>
                    <button onClick={onClose}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Tab 1: Overview ─────────────────────────────────────────────────────────

function TabOverview({ status, campaigns, fbLeads, onConnect, onDisconnect, disconnecting }) {
    const isConnected = status?.connected === true;
    const totalForms  = (status?.pages || []).reduce((s, p) => s + (p.forms?.length || 0), 0);
    const totalMapped = (status?.mappings || []).length;
    const totalLeads  = (status?.pages || []).reduce(
        (s, p) => s + (p.forms || []).reduce((ss, f) => ss + (f.leads_count || 0), 0), 0
    );
    const activeCamps = campaigns.filter(c => c.status === 'ACTIVE').length;

    const stats = [
        { label: 'Connected Pages',  value: (status?.pages || []).length,        icon: 'pages' },
        { label: 'Lead Forms',       value: totalForms,                            icon: 'description' },
        { label: 'Mapped Forms',     value: totalMapped,                           icon: 'link' },
        { label: 'Active Campaigns', value: activeCamps,                           icon: 'campaign' },
        { label: 'Total FB Leads',   value: totalLeads.toLocaleString('en-IN'),    icon: 'people' },
        { label: 'Leads in CRM',     value: fbLeads.length.toLocaleString('en-IN'), icon: 'manage_accounts' },
    ];

    return (
        <div className="space-y-6">
            {/* Connection card */}
            <div className={`${cardClass} p-6`}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg flex-shrink-0">
                            <span className="text-2xl font-black">f</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Facebook Lead Ads</h2>
                            {isConnected && status?.connectedAt && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Connected {new Date(status.connectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {status?.pageName ? ` · ${status.pageName}` : ''}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black uppercase tracking-[0.2em]
                            ${isConnected
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                        {!isConnected && (
                            <button onClick={onConnect}
                                className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-black uppercase tracking-[0.2em] text-white hover:bg-blue-700 transition-all">
                                Connect
                            </button>
                        )}
                        {isConnected && (
                            <button onClick={onDisconnect} disabled={disconnecting}
                                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all">
                                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                            </button>
                        )}
                    </div>
                </div>
                {status?.degraded && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
                        <span className="material-symbols-outlined text-yellow-500">warning</span>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">Facebook API temporarily unreachable. Showing cached data.</p>
                    </div>
                )}
                {status?.tokenExpired && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                        <span className="material-symbols-outlined text-red-500">error</span>
                        <p className="text-sm text-red-700 dark:text-red-300">Your Facebook token has expired. Please reconnect.</p>
                    </div>
                )}
            </div>

            {/* Stats grid */}
            {isConnected && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {stats.map(({ label, value, icon }) => (
                        <div key={label} className={`${cardClass} p-5 flex flex-col gap-2`}>
                            <span className="material-symbols-outlined text-2xl text-blue-500">{icon}</span>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Tab 2: Campaigns & Forms ────────────────────────────────────────────────

function CampaignCard({ campaign, onMappingCreated }) {
    const [expanded, setExpanded]         = useState(false);
    const [showConfig, setShowConfig]     = useState(false);

    const statusColor = campaign.status === 'ACTIVE' ? 'green'
        : campaign.status === 'PAUSED' ? 'yellow' : 'slate';

    const objColor = ['OUTCOME_LEADS', 'LEAD_GENERATION'].includes(campaign.objective) ? 'blue' : 'slate';

    const budgetStr = campaign.budget
        ? `${campaign.currency || '₹'} ${Number(campaign.budget / 100).toLocaleString('en-IN')}`
        : '—';

    return (
        <>
        <div className="border border-slate-200/70 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-slate-50/80 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all">
                <button onClick={() => setExpanded(v => !v)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs flex-shrink-0">f</div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{campaign.campaignName}</p>
                            <Badge label={campaign.status || 'Unknown'} color={statusColor} />
                            <Badge label={campaign.objective || 'Unknown'} color={objColor} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">people</span>
                                {(campaign.leadsCount || 0).toLocaleString('en-IN')} leads
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">description</span>
                                {(campaign.forms || []).length} form{campaign.forms?.length !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">payments</span>
                                {budgetStr}
                            </span>
                            {campaign.lastSyncedAt && (
                                <span className="text-[10px] text-slate-400">synced {relativeTime(campaign.lastSyncedAt)}</span>
                            )}
                        </div>
                    </div>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => setShowConfig(true)}
                        title="Configure campaign"
                        className="flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-all">
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                    </button>
                    <button onClick={() => setExpanded(v => !v)}
                        className="flex items-center justify-center h-8 w-8 rounded-xl text-slate-400 transition-all">
                        <span className={`material-symbols-outlined transition-transform ${expanded ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 space-y-3">
                    {(campaign.forms || []).length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <span className="material-symbols-outlined text-3xl mb-2 block">description</span>
                            <p className="text-sm">No lead forms found for this campaign.</p>
                            <p className="text-xs mt-1">Sync again after creating forms in Meta Ads Manager.</p>
                        </div>
                    ) : (
                        (campaign.forms || []).map(form => (
                            <div key={form.formId}
                                className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{form.formName || form.formId}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{form.formId}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge label={form.status || 'Unknown'} color={(form.status || '').toLowerCase() === 'active' ? 'green' : 'slate'} />
                                        {form.isMapped && <Badge label="Mapped" color="blue" />}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                        <span className="material-symbols-outlined text-[13px]">people</span>
                                        {(form.leadsCount || 0).toLocaleString('en-IN')} leads
                                        {form.pageName && <span className="ml-2">· {form.pageName}</span>}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {!form.isMapped && (
                                            <button onClick={async () => {
                                                try {
                                                    await createFBMapping({
                                                        fbFormId: form.formId,
                                                        formName: form.formName || form.formId,
                                                        salesWebsiteProjectId: campaign.campaignId || 'default',
                                                        pageId: form.pageId || campaign.pageId,
                                                    });
                                                    onMappingCreated();
                                                } catch (err) {
                                                    console.error('Enable form failed:', err);
                                                }
                                            }}
                                                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 transition-all">
                                                <span className="material-symbols-outlined text-[13px]">toggle_on</span>
                                                Enable Import
                                            </button>
                                        )}
                                        {form.isMapped && (
                                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                                                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                                Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>

        {showConfig && (
            <CampaignConfigModal
                campaign={campaign}
                onClose={() => setShowConfig(false)}
                onSaved={onMappingCreated}
            />
        )}
        </>
    );
}

function TabCampaigns({ campaigns, campaignsLoading, onSync, syncing, isConnected, onMappingCreated }) {
    const ORDER = { ACTIVE: 0, PAUSED: 1, ARCHIVED: 2, DELETED: 3 };
    const sorted = [...campaigns].sort((a, b) => {
        const ao = ORDER[a.status] ?? 9;
        const bo = ORDER[b.status] ?? 9;
        return ao !== bo ? ao - bo : (b.leadsCount || 0) - (a.leadsCount || 0);
    });

    if (!isConnected) {
        return (
            <div className={`${cardClass} p-12 text-center`}>
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-3 block">lock</span>
                <p className="text-slate-500">Connect Facebook first to view campaigns.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Campaigns & Forms
                    {campaigns.length > 0 && <span className="ml-2 text-slate-400 text-base font-normal">({campaigns.length})</span>}
                </h2>
                <button onClick={onSync} disabled={syncing}
                    className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2.5 transition-all">
                    <span className={`material-symbols-outlined text-base ${syncing ? 'animate-spin' : ''}`}>sync</span>
                    {syncing ? 'Syncing…' : 'Sync Now'}
                </button>
            </div>

            {campaignsLoading && (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            )}

            {!campaignsLoading && sorted.length === 0 && (
                <div className={`${cardClass} p-12 text-center`}>
                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-3 block">campaign</span>
                    <p className="text-slate-500 font-bold">No campaigns found</p>
                    <p className="text-slate-400 text-sm mt-1">Click "Sync Now" to fetch campaigns from your ad accounts.</p>
                </div>
            )}

            {!campaignsLoading && sorted.map(camp => (
                <CampaignCard
                    key={camp.campaignId}
                    campaign={camp}
                    onMappingCreated={onMappingCreated}
                />
            ))}
        </div>
    );
}

// ─── Tab 3: Lead Management ──────────────────────────────────────────────────

function TabLeads({ leads, leadsLoading, userId, campaigns }) {
    const navigate = useNavigate();
    const [search, setSearch]             = useState('');
    const [statusFilter, setFilter]       = useState('');
    const [campaignFilter, setCampaign]   = useState('');
    const [dateFrom, setDateFrom]         = useState('');
    const [dateTo, setDateTo]             = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [history, setHistory]           = useState([]);
    const [historyLoading, setHistLoading]= useState(false);

    const handleRowClick = async (lead) => {
        setSelectedLead(lead);
        setHistLoading(true);
        try {
            const res = await getLeadAutomationHistory(lead.id || lead._id);
            setHistory(res.data?.data || []);
        } catch { setHistory([]); }
        finally { setHistLoading(false); }
    };

    const filtered = leads.filter(l => {
        const name  = `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase();
        const phone = (l.phone_number || '').toLowerCase();
        const q     = search.toLowerCase();
        const matchQ = !q || name.includes(q) || phone.includes(q);
        const matchS = !statusFilter || l.status === statusFilter;
        const matchC = !campaignFilter || l.metadata?.campaignId === campaignFilter || l.metadata?.campaignName === campaignFilter;
        return matchQ && matchS && matchC;
    });

    const scoreColor = (s) => s >= 70 ? 'text-emerald-500' : s >= 40 ? 'text-yellow-500' : 'text-red-500';

    const getLeadStatus = (lead) => {
        const s = lead.score || 0;
        if (s >= 70) return { label: 'HOT',  color: 'red' };
        if (s >= 40) return { label: 'WARM', color: 'orange' };
        return { label: 'COLD', color: 'blue' };
    };

    const typeIcon = { call: 'call', whatsapp: 'chat', email: 'mail' };
    const typeColor = { call: 'text-blue-500', whatsapp: 'text-emerald-500', email: 'text-violet-500' };

    return (
        <div className="space-y-4">
            {/* Header + search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Facebook Leads
                    {leads.length > 0 && <span className="ml-2 text-slate-400 text-base font-normal">({leads.length} total)</span>}
                </h2>
                <input type="text" placeholder="Search by name or phone…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all w-full sm:w-56"
                />
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
                <select value={campaignFilter} onChange={e => setCampaign(e.target.value)}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all">
                    <option value="">All campaigns</option>
                    {(campaigns || []).map(c => (
                        <option key={c.campaignId} value={c.campaignId}>{c.campaignName}</option>
                    ))}
                </select>
                <select value={statusFilter} onChange={e => setFilter(e.target.value)}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all">
                    <option value="">All statuses</option>
                    <option value="HOT">HOT</option>
                    <option value="WARM">WARM</option>
                    <option value="COLD">COLD</option>
                </select>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all" />
                {(campaignFilter || statusFilter || dateFrom || dateTo || search) && (
                    <button onClick={() => { setCampaign(''); setFilter(''); setDateFrom(''); setDateTo(''); setSearch(''); }}
                        className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-all">
                        Clear
                    </button>
                )}
            </div>

            {leadsLoading && (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            )}

            {!leadsLoading && filtered.length === 0 && (
                <div className={`${cardClass} p-12 text-center`}>
                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-3 block">manage_accounts</span>
                    <p className="text-slate-500 font-bold">No Facebook leads found</p>
                    <p className="text-slate-400 text-sm mt-1">Leads captured via Facebook Lead Ads will appear here.</p>
                </div>
            )}

            {!leadsLoading && filtered.length > 0 && (
                <div className={`${cardClass} overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
                                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Name</th>
                                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Phone</th>
                                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hidden sm:table-cell">Campaign</th>
                                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Score</th>
                                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Status</th>
                                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hidden md:table-cell">Created</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                                {filtered.map(lead => {
                                    const ls = getLeadStatus(lead);
                                    return (
                                        <tr key={lead.id || lead._id}
                                            onClick={() => handleRowClick(lead)}
                                            className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                                            <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                                                {lead.first_name} {lead.last_name}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-xs">
                                                {lead.phone_number}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500 text-xs hidden sm:table-cell truncate max-w-[140px]">
                                                {lead.metadata?.campaignName || '—'}
                                            </td>
                                            <td className={`px-5 py-3.5 font-black ${scoreColor(lead.score || 0)}`}>
                                                {lead.score || 0}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Badge label={ls.label} color={ls.color} />
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500 hidden md:table-cell">
                                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <button onClick={e => { e.stopPropagation(); navigate(`/lead/${lead.id || lead._id}`); }}
                                                    className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                                    CRM
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Automation history slide-in */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-start justify-end">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
                    <div className={`${cardClass} relative w-full max-w-md h-screen overflow-y-auto flex flex-col`}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 dark:border-white/10">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    {selectedLead.first_name} {selectedLead.last_name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedLead.phone_number}</p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        <div className="p-5 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">Automation History</p>
                            {historyLoading && <div className="flex justify-center py-8"><Spinner /></div>}
                            {!historyLoading && history.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-8">No automation history yet.</p>
                            )}
                            {!historyLoading && history.length > 0 && (
                                <div className="space-y-3">
                                    {history.map((evt, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                                            <span className={`material-symbols-outlined text-xl flex-shrink-0 ${typeColor[evt.type] || 'text-slate-400'}`}>
                                                {typeIcon[evt.type] || 'notifications'}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">{evt.type}</p>
                                                {evt.status && <p className="text-[10px] text-slate-500">{evt.status}</p>}
                                                {evt.transcript && <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{evt.transcript}</p>}
                                                {evt.templateName && <p className="text-[10px] text-slate-500">Template: {evt.templateName}</p>}
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {evt.timestamp ? new Date(evt.timestamp).toLocaleString('en-IN') : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-5 py-4 border-t border-slate-200/70 dark:border-white/10">
                            <button onClick={() => navigate(`/lead/${selectedLead.id || selectedLead._id}`)}
                                className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-[0.2em] py-3 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                                Open Full CRM Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab 4: Settings & Import ────────────────────────────────────────────────

function TabSettings({ isConnected, onSync, syncing, lastSynced, onDisconnect, disconnecting, onConnect }) {
    const { addToast }       = useNotifications();
    const [importing, setImporting]     = useState(false);
    const [importDays, setImportDays]   = useState(30);
    const [runAutomation, setRunAuto]   = useState(false);

    const handleImport = async () => {
        setImporting(true);
        try {
            await importFBHistorical(importDays, runAutomation);
            addToast(`Historical import started (last ${importDays} days). Check CRM in a minute.`, 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Import failed.', 'error');
        } finally { setImporting(false); }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Sync section */}
            <div className={`${cardClass} p-6`}>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Campaign Sync</h3>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Sync Campaigns & Forms</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Fetches all campaigns from your ad accounts and stores form details in the database.
                            {lastSynced && <span> Last synced: <span className="font-bold">{relativeTime(lastSynced)}</span></span>}
                        </p>
                    </div>
                    <button onClick={onSync} disabled={syncing || !isConnected}
                        className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-[0.2em] px-5 py-3 transition-all flex-shrink-0">
                        <span className={`material-symbols-outlined text-base ${syncing ? 'animate-spin' : ''}`}>sync</span>
                        {syncing ? 'Syncing…' : 'Sync Now'}
                    </button>
                </div>
            </div>

            {/* Historical import section */}
            {isConnected && (
                <div className={`${cardClass} p-6`}>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Historical Lead Import</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        Pull existing leads from all mapped forms into the CRM. Duplicates are automatically skipped.
                    </p>

                    <div className="mb-4">
                        <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Time Range</label>
                        <div className="flex gap-2 flex-wrap">
                            {[7, 30, 90].map(d => (
                                <button key={d} onClick={() => setImportDays(d)}
                                    className={`rounded-2xl border px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all
                                        ${importDays === d
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                                    Last {d} days
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-5 flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Run Automation</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                When enabled, triggers AI voice calls for each imported lead. Disable for silent imports.
                            </p>
                        </div>
                        <button
                            onClick={() => setRunAuto(v => !v)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                                ${runAutomation ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                            aria-label="Toggle run automation"
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                                ${runAutomation ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <button onClick={handleImport} disabled={importing}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-[0.2em] py-3.5 transition-all">
                        {importing ? <Spinner /> : <span className="material-symbols-outlined text-base">download</span>}
                        {importing ? 'Importing…' : `Import Last ${importDays} Days`}
                    </button>
                </div>
            )}

            {/* Disconnect section */}
            {isConnected && (
                <div className={`${cardClass} p-6`}>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Danger Zone</h3>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Disconnect Facebook</p>
                            <p className="text-xs text-slate-500 mt-0.5">Existing mappings are preserved but no new leads will import until you reconnect.</p>
                        </div>
                        <button onClick={onDisconnect} disabled={disconnecting}
                            className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all flex-shrink-0">
                            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                        </button>
                    </div>
                </div>
            )}

            {!isConnected && (
                <div className={`${cardClass} p-10 text-center`}>
                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-3 block">link_off</span>
                    <p className="text-slate-500 font-bold mb-4">Facebook not connected</p>
                    <button onClick={onConnect}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white hover:bg-blue-700 transition-all">
                        <span className="text-base font-black">f</span>
                        Connect Facebook
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'overview',   label: 'Overview',       icon: 'dashboard' },
    { id: 'campaigns',  label: 'Campaigns',       icon: 'campaign' },
    { id: 'leads',      label: 'Lead Management', icon: 'manage_accounts' },
    { id: 'settings',   label: 'Settings',        icon: 'settings' },
];

const FacebookIntegrationPage = () => {
    const { addToast } = useNotifications();
    const { user } = useAuth();

    // ── state ──
    const [activeTab,   setActiveTab]   = useState('overview');
    const [status,      setStatus]      = useState(null);     // null = loading
    const [loadError,   setLoadError]   = useState('');
    const [campaigns,   setCampaigns]   = useState([]);
    const [campsLoading, setCampsLoading] = useState(false);
    const [fbLeads,     setFbLeads]     = useState([]);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [syncing,     setSyncing]     = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [lastSynced,  setLastSynced]  = useState(null);
    const syncIntervalRef = useRef(null);
    const userId = useRef(null);

    // ── load FB status ──
    const loadStatus = useCallback(async (quiet = false) => {
        if (!quiet) setStatus(null);
        setLoadError('');
        try {
            const res = await getFBStatus();
            setStatus(res.data);
            // Extract userId from createdBy of any mapping or use a stored ref
            if (res.data?.mappings?.[0]?.ownerId) userId.current = res.data.mappings[0].ownerId;
        } catch (err) {
            setLoadError(err.response?.data?.error || 'Failed to load Facebook status.');
            setStatus({ connected: false });
        }
    }, []);

    // ── load campaigns from DB ──
    const loadCampaigns = useCallback(async (quiet = false) => {
        if (!quiet) setCampsLoading(true);
        try {
            const res = await getFBCampaigns({ limit: 200 });
            setCampaigns(res.data?.data || []);
            const sorted = (res.data?.data || []).sort((a, b) => new Date(b.lastSyncedAt) - new Date(a.lastSyncedAt));
            if (sorted[0]?.lastSyncedAt) setLastSynced(sorted[0].lastSyncedAt);
        } catch { /* ignore */ } finally {
            if (!quiet) setCampsLoading(false);
        }
    }, []);

    // ── load Facebook leads from CRM ──
    const loadFbLeads = useCallback(async () => {
        if (!user) return;
        setLeadsLoading(true);
        try {
            const res = await getAllLeads({ source: 'facebook', limit: 500, userId: user.id, role: user.role });
            setFbLeads(res.data?.leads || res.data?.data || []);
            // Also capture userId from first lead
            const firstLead = (res.data?.leads || res.data?.data || [])[0];
            if (firstLead?.createdBy?.userId) userId.current = firstLead.createdBy.userId;
        } catch { /* ignore */ } finally { setLeadsLoading(false); }
    }, [user]);

    // ── on mount ──
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.toString()) window.history.replaceState({}, '', window.location.pathname);

        Promise.all([
            loadStatus(),
            loadCampaigns(),
            loadFbLeads(),
        ]);

        // Auto-sync campaigns every 5 minutes silently
        syncIntervalRef.current = setInterval(() => {
            loadCampaigns(true);
        }, 5 * 60 * 1000);

        return () => clearInterval(syncIntervalRef.current);
    }, [loadStatus, loadCampaigns, loadFbLeads]);

    // ── manual sync ──
    const handleSync = async () => {
        setSyncing(true);
        try {
            await syncFBCampaigns();
            addToast('Sync started. Refreshing in 3 seconds…', 'success');
            setTimeout(() => loadCampaigns(), 3000);
        } catch (err) {
            addToast(err.response?.data?.error || 'Sync failed.', 'error');
        } finally { setSyncing(false); }
    };

    // ── connect ──
    const handleConnect = () => initiateFBConnect();

    // ── disconnect ──
    const handleDisconnect = async () => {
        if (!window.confirm('Disconnect Facebook? All form mappings will remain but no new leads will import until you reconnect.')) return;
        setDisconnecting(true);
        try {
            await disconnectFacebook();
            setStatus({ connected: false });
            setCampaigns([]);
            addToast('Facebook disconnected.', 'success');
        } catch { addToast('Failed to disconnect.', 'error'); }
        finally { setDisconnecting(false); }
    };

    // ── mapping callbacks ──
    const handleMappingCreated = useCallback(() => {
        loadStatus(true);
        loadCampaigns(true);
        addToast('Form mapping saved. Leads will now import automatically.', 'success');
    }, [loadStatus, loadCampaigns, addToast]);

    // ── derived ──
    const isConnected = status?.connected === true;

    // ── loading skeleton ──
    if (status === null && !loadError) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Loading Facebook Integration…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-6 md:px-8 md:py-10">
            <div className="mx-auto max-w-7xl">

                {/* ── Header ── */}
                <div className={`${cardClass} mb-6 p-6 md:p-8`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">Meta Lead Ads</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Facebook Integration</h1>
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black uppercase tracking-[0.2em]
                            ${isConnected
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                    </div>
                    {loadError && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
                        </div>
                    )}
                    {/* Prompt to sync if connected but no campaigns */}
                    {isConnected && !campsLoading && campaigns.length === 0 && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 px-4 py-3">
                            <span className="material-symbols-outlined text-blue-500">info</span>
                            <p className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                                No campaigns loaded yet. Click <strong>Sync Campaigns</strong> to import your ad account data.
                            </p>
                            <button onClick={handleSync} disabled={syncing}
                                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 transition-all flex-shrink-0">
                                <span className={`material-symbols-outlined text-[13px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
                                {syncing ? 'Syncing…' : 'Sync Campaigns'}
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Tab bar ── */}
                <div className="flex gap-1 mb-6 p-1 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap flex-shrink-0
                                ${activeTab === tab.id
                                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab content ── */}
                {activeTab === 'overview' && (
                    <TabOverview
                        status={status}
                        campaigns={campaigns}
                        fbLeads={fbLeads}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                        disconnecting={disconnecting}
                    />
                )}
                {activeTab === 'campaigns' && (
                    <TabCampaigns
                        campaigns={campaigns}
                        campaignsLoading={campsLoading}
                        onSync={handleSync}
                        syncing={syncing}
                        isConnected={isConnected}
                        onMappingCreated={handleMappingCreated}
                    />
                )}
                {activeTab === 'leads' && (
                    <TabLeads
                        leads={fbLeads}
                        leadsLoading={leadsLoading}
                        userId={userId.current}
                        campaigns={campaigns}
                    />
                )}
                {activeTab === 'settings' && (
                    <TabSettings
                        isConnected={isConnected}
                        onSync={handleSync}
                        syncing={syncing}
                        lastSynced={lastSynced}
                        onDisconnect={handleDisconnect}
                        disconnecting={disconnecting}
                        onConnect={handleConnect}
                    />
                )}

            </div>
        </div>
    );
};

export default FacebookIntegrationPage;
