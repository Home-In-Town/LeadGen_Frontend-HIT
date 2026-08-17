/**
 * ImportedLeadsTab.jsx
 *
 * Shows all bulk-imported campaigns as an expandable accordion list.
 * Each campaign row expands to show a paginated table of its leads.
 * Used inside CampaignPage as the "Imported Leads" tab.
 */

import { useState, useEffect, useCallback } from 'react';
import { listCampaigns, getCampaignLeads } from '../api';

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

function LeadsTable({ campaignId, onClose }) {
    const [leads, setLeads]         = useState([]);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading]     = useState(true);

    const fetch = useCallback(async (pg) => {
        setLoading(true);
        try {
            const res = await getCampaignLeads(campaignId, { page: pg, limit: 50 });
            const d = res.data;
            setLeads(d.leads || []);
            setTotal(d.total || 0);
            setTotalPages(d.totalPages || 1);
            setPage(pg);
        } catch {
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => { fetch(1); }, [fetch]);

    if (loading) return (
        <div className="flex justify-center py-6">
            <span className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
    );

    if (!leads.length) return (
        <p className="text-sm text-slate-500 px-4 py-3">No leads found for this campaign.</p>
    );

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-white/10 text-left">
                            <th className="px-3 py-2 font-semibold text-slate-500 dark:text-slate-400">Name</th>
                            <th className="px-3 py-2 font-semibold text-slate-500 dark:text-slate-400">Phone</th>
                            <th className="px-3 py-2 font-semibold text-slate-500 dark:text-slate-400">Email</th>
                            <th className="px-3 py-2 font-semibold text-slate-500 dark:text-slate-400">Imported</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr key={lead.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                                <td className="px-3 py-2 text-slate-900 dark:text-white font-medium">
                                    {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—'}
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{lead.phone_number || '—'}</td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 truncate max-w-[160px]">{lead.email || '—'}</td>
                                <td className="px-3 py-2 text-slate-500">{formatDate(lead.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-white/10">
                    <span className="text-xs text-slate-500">{total} leads total</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => fetch(page - 1)}
                            disabled={page <= 1}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 text-slate-500"
                        >
                            <span className="material-symbols-outlined text-base">chevron_left</span>
                        </button>
                        <span className="text-xs text-slate-600 dark:text-slate-400 px-1">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => fetch(page + 1)}
                            disabled={page >= totalPages}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 text-slate-500"
                        >
                            <span className="material-symbols-outlined text-base">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function CampaignAccordion({ campaign }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-slate-200/70 dark:border-white/10 rounded-xl overflow-hidden">
            {/* Header row */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
            >
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {campaign.name || 'Untitled Campaign'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span>{(campaign.totalLeads || 0).toLocaleString()} leads</span>
                        {campaign.duplicatesSkipped > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
                                {campaign.duplicatesSkipped} skipped
                            </span>
                        )}
                        {campaign.linkedFbCampaignName && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined text-[12px]">link</span>
                                {campaign.linkedFbCampaignName}
                            </span>
                        )}
                        <span>{formatDate(campaign.createdAt)}</span>
                    </div>
                </div>
                <span className={`material-symbols-outlined text-slate-400 transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {/* Expanded leads table */}
            {open && (
                <div className="border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
                    <LeadsTable campaignId={campaign.campaignId} />
                </div>
            )}
        </div>
    );
}

export default function ImportedLeadsTab() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [page, setPage]           = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCampaigns = useCallback(async (pg) => {
        setLoading(true);
        try {
            const res = await listCampaigns({ page: pg, limit: 20 });
            setCampaigns(res.data?.campaigns || []);
            setTotalPages(res.data?.totalPages || 1);
            setPage(pg);
        } catch {
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCampaigns(1); }, [fetchCampaigns]);

    if (loading) return (
        <div className="flex justify-center py-12">
            <span className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
    );

    if (!campaigns.length) return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">upload_file</span>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No campaigns yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload a CSV or Excel file to create your first campaign.</p>
        </div>
    );

    return (
        <div className="space-y-2.5">
            {campaigns.map(c => (
                <CampaignAccordion key={c.campaignId} campaign={c} />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                    <button
                        onClick={() => fetchCampaigns(page - 1)}
                        disabled={page <= 1}
                        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                        <span className="material-symbols-outlined text-base">chevron_left</span>
                        Prev
                    </button>
                    <span className="text-xs text-slate-500 self-center">{page} / {totalPages}</span>
                    <button
                        onClick={() => fetchCampaigns(page + 1)}
                        disabled={page >= totalPages}
                        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                        Next
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                </div>
            )}
        </div>
    );
}
