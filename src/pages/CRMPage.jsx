/**
 * CRMPage — Production SaaS CRM Leads Table
 *
 * Features:
 * - Server-side pagination, search, filtering, sorting
 * - Status tabs with counts
 * - Source/status/date filters
 * - Bulk selection with actions (delete, change status)
 * - Delete confirmation modal
 * - Skeleton loading states
 * - Responsive design
 * - Phase 1 (Web Magnet Media) branding
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { BRAND_COLOR } from '../config/phase';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

const STATUS_TABS = [
  { key: 'ALL', label: 'All Leads' },
  { key: 'CREATED', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'INTERESTED', label: 'Interested' },
  { key: 'HOT', label: 'Hot' },
  { key: 'WARM', label: 'Warm' },
  { key: 'COLD', label: 'Cold' },
  { key: 'CONVERTED', label: 'Converted' },
  { key: 'LOST', label: 'Lost' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'manual', label: 'Manual' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'whatsapp_incoming', label: 'WhatsApp' },
  { value: 'whatsapp_ad', label: 'WhatsApp Ad' },
  { value: 'bulk_import', label: 'Import' },
  { value: 'webhook', label: 'Webhook' },
];

const STATUS_COLORS = {
  CREATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  CONTACTED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  INTERESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  HOT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  WARM: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  COLD: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
  CONVERTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  LOST: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
};

const SOURCE_BADGES = {
  facebook: { label: 'Facebook', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  google: { label: 'Google', color: 'bg-green-50 text-green-600 border-green-200' },
  manual: { label: 'Manual', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  whatsapp_incoming: { label: 'WhatsApp', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  whatsapp_ad: { label: 'WA Ad', color: 'bg-teal-50 text-teal-600 border-teal-200' },
  whatsapp_chat: { label: 'WA Chat', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  bulk_import: { label: 'Import', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  webhook: { label: 'Webhook', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
};

// ─── Helper Components ────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-14 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></td>
  </tr>
);

const ConfirmModal = ({ open, title, message, onConfirm, onCancel, confirmLabel = 'Delete', destructive = true }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold rounded-lg text-white ${destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CRMPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotifications();

  // Data state
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Filters
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, leadId: null, bulk: false });
  const [statusModal, setStatusModal] = useState({ open: false, newStatus: '' });

  const debounceRef = useRef(null);
  const totalPages = Math.ceil(total / pageSize) || 1;

  // ── Debounced Search ──────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // ── Fetch Leads ───────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = {
        userId: user.id,
        role: user.role,
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
      };
      if (activeStatus !== 'ALL') params.status = activeStatus;
      if (sourceFilter) params.source = sourceFilter;
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await api.getAllLeads(params);
      const data = res.data;
      setLeads(data.leads || (Array.isArray(data) ? data : []));
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, activeStatus, sourceFilter, search, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [activeStatus, sourceFilter, dateFrom, dateTo]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDeleteLead = async () => {
    const { leadId, bulk } = deleteModal;
    try {
      if (bulk) {
        await api.bulkDeleteLeads([...selectedIds]);
        addToast?.('Leads deleted successfully', 'success');
        setSelectedIds(new Set());
      } else {
        await api.deleteLead(leadId);
        addToast?.('Lead deleted successfully', 'success');
      }
      fetchLeads();
    } catch {
      addToast?.('Failed to delete lead(s)', 'error');
    }
    setDeleteModal({ open: false, leadId: null, bulk: false });
  };

  const handleBulkStatus = async () => {
    if (!statusModal.newStatus) return;
    try {
      await api.bulkUpdateStatus([...selectedIds], statusModal.newStatus);
      addToast?.(`${selectedIds.size} leads updated to ${statusModal.newStatus}`, 'success');
      setSelectedIds(new Set());
      fetchLeads();
    } catch {
      addToast?.('Failed to update leads', 'error');
    }
    setStatusModal({ open: false, newStatus: '' });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setActiveStatus('ALL');
    setSourceFilter('');
    setDateFrom('');
    setDateTo('');
    setShowMoreFilters(false);
    setPage(1);
  };

  const hasActiveFilters = search || activeStatus !== 'ALL' || sourceFilter || dateFrom || dateTo;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getScoreColor = (score) => {
    if (score >= 71) return 'text-red-600 font-bold';
    if (score >= 31) return 'text-orange-500 font-semibold';
    return 'text-slate-500';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Leads</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage and track all your leads in one place.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Import Leads
          </button>
          <button
            onClick={() => navigate('/users')}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg text-white transition-colors"
            style={{ background: BRAND_COLOR }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Lead
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 border-b border-slate-200 dark:border-slate-700 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`whitespace-nowrap px-3 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 ${
              activeStatus === tab.key
                ? 'border-[var(--brand)] text-[var(--brand)] bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            style={{ '--brand': BRAND_COLOR }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
          <input
            type="text"
            placeholder="Search leads by name, phone, company..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            style={{ '--brand': BRAND_COLOR }}
          />
        </div>

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
        >
          {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* More Filters */}
        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className={`flex items-center gap-1 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
            showMoreFilters ? 'border-[var(--brand)] text-[var(--brand)] bg-orange-50 dark:bg-orange-900/10' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          style={{ '--brand': BRAND_COLOR }}
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          More Filters
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* More Filters Panel */}
      {showMoreFilters && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase text-slate-500">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-300" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase text-slate-500">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-300" />
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
            {selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={statusModal.newStatus}
              onChange={e => setStatusModal({ open: false, newStatus: e.target.value })}
              className="px-2 py-1.5 text-xs rounded border border-blue-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="">Change Status...</option>
              {STATUS_TABS.filter(t => t.key !== 'ALL').map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            {statusModal.newStatus && (
              <button onClick={handleBulkStatus} className="px-3 py-1.5 text-xs font-bold rounded bg-blue-500 text-white hover:bg-blue-600">
                Apply
              </button>
            )}
            <button
              onClick={() => setDeleteModal({ open: true, leadId: null, bulk: true })}
              className="px-3 py-1.5 text-xs font-bold rounded bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selectedIds.size === leads.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort('first_name')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700">
                    Lead
                    {sortBy === 'first_name' && <span className="material-symbols-outlined text-[14px]">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Contact</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Source</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort('score')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700">
                    Score
                    {sortBy === 'score' && <span className="material-symbols-outlined text-[14px]">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700">
                    Added On
                    {sortBy === 'createdAt' && <span className="material-symbols-outlined text-[14px]">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                  </button>
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => <SkeletonRow key={i} />)
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3">person_search</span>
                      <p className="text-sm font-bold text-slate-500 mb-1">
                        {hasActiveFilters ? 'No leads found' : 'No leads yet'}
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        {hasActiveFilters ? 'Try changing your filters or search terms.' : 'Add your first lead to get started.'}
                      </p>
                      {hasActiveFilters ? (
                        <button onClick={clearFilters} className="text-xs font-bold text-[var(--brand)] hover:underline" style={{ '--brand': BRAND_COLOR }}>
                          Clear Filters
                        </button>
                      ) : (
                        <button onClick={() => navigate('/users')} className="px-4 py-2 text-xs font-bold rounded-lg text-white" style={{ background: BRAND_COLOR }}>
                          + Add Lead
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map(lead => {
                  const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
                  const status = lead.status?.toUpperCase() || 'CREATED';
                  const source = lead.source || 'manual';
                  const sourceBadge = SOURCE_BADGES[source] || SOURCE_BADGES.manual;
                  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.COLD;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/lead/${lead.id}`)}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: BRAND_COLOR }}>
                            {(lead.first_name?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{name || 'Unknown'}</p>
                            {lead.email && <p className="text-[11px] text-slate-400 truncate">{lead.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{lead.phone_number || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded border ${sourceBadge.color}`}>
                          {sourceBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${getScoreColor(lead.score)}`}>{lead.score}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">{formatDate(lead.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/lead/${lead.id}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, leadId: lead.id, bulk: false })}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
            <p className="text-xs text-slate-500 mb-2 sm:mb-0">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()} leads
            </p>
            <div className="flex items-center gap-2">
              {/* Page Size */}
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
              </select>
              {/* Prev */}
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Prev
              </button>
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      page === p
                        ? 'text-white'
                        : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    style={page === p ? { background: BRAND_COLOR } : {}}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 5 && page < totalPages - 2 && <span className="text-xs text-slate-400">...</span>}
              {totalPages > 5 && page < totalPages - 2 && (
                <button onClick={() => setPage(totalPages)} className="px-2.5 py-1 text-xs font-bold rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                  {totalPages}
                </button>
              )}
              {/* Next */}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        title={deleteModal.bulk ? `Delete ${selectedIds.size} Leads?` : 'Delete Lead?'}
        message={deleteModal.bulk
          ? `This action will permanently remove ${selectedIds.size} leads and their associated records. This cannot be undone.`
          : 'This action will permanently remove this lead and its associated records. This cannot be undone.'
        }
        confirmLabel={deleteModal.bulk ? `Delete ${selectedIds.size} Leads` : 'Delete Lead'}
        onConfirm={handleDeleteLead}
        onCancel={() => setDeleteModal({ open: false, leadId: null, bulk: false })}
      />
    </div>
  );
}
