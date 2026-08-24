/**
 * UsersPage — Production SaaS Users/Contacts Management Table
 *
 * Features:
 * - Server-side pagination with search
 * - Professional data table layout
 * - Bulk selection with actions (Start Lead, Delete)
 * - Campaign/Project modal for bulk lead creation
 * - Delete confirmation modal
 * - Skeleton loading states
 * - Responsive design matching Phase 1 branding
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { getFBCampaigns, listProjects, uploadCampaign } from '../api';
import { useNotifications } from '../context/NotificationContext';
import { BRAND_COLOR } from '../config/phase';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

// ─── Helper Components ────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></td>
    <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" /></td>
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
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-bold rounded-lg text-white ${destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const UsersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotifications();

  // Data
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Selection
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Processing
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Campaign modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [bulkMode, setBulkMode] = useState('lead');

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, userId: null, bulk: false });

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

  // ── Fetch Users (server-side) ─────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = {
        userId: user.id,
        role: user.role,
        page,
        limit: pageSize,
      };
      if (search) params.search = search;

      const res = await api.getAllUsers(params);
      const data = res.data;

      // Handle both old format (array) and new format ({ users, total })
      if (Array.isArray(data)) {
        setUsers(data);
        setTotal(data.length);
      } else {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const { userId, bulk } = deleteModal;
    try {
      if (bulk) {
        await Promise.allSettled(
          Array.from(selectedUsers).map(id => api.deleteUser(id))
        );
        addToast(`${selectedUsers.size} users deleted`, 'success');
        setSelectedUsers(new Set());
      } else {
        await api.deleteUser(userId);
        addToast('User deleted successfully', 'success');
      }
      fetchUsers();
    } catch {
      addToast('Failed to delete user(s)', 'error');
    }
    setDeleteModal({ open: false, userId: null, bulk: false });
  };

  // ── Bulk Start Lead ───────────────────────────────────────────────────────
  const handleBulkCreateLead = async (mode = 'lead') => {
    if (selectedUsers.size === 0) return;
    setFetchingProjects(true);
    try {
      if (user?.hitLinked) {
        const res = await listProjects();
        const projectList = (res.data?.projects || []).map(p => ({
          campaignId: p.hitProjectId,
          campaignName: p.projectName,
          status: 'ACTIVE',
          leadsCount: 0,
          city: p.city,
        }));
        if (!projectList.length) {
          addToast('No projects found. Sync your HomeInTown projects first.', 'warning');
          return;
        }
        setCampaigns(projectList);
      } else {
        const res = await getFBCampaigns({ limit: 200 });
        const campaignList = res.data?.campaigns || res.data?.data || [];
        // Default campaigns (isDefault: true) are already included from the backend
        // and sorted first — no need for a synthetic '__default__' option
        setCampaigns(campaignList);
      }
      setBulkMode(mode);
      setShowProjectModal(true);
    } catch (err) {
      console.error('Failed to fetch campaigns/projects:', err);
      addToast('Failed to fetch data. Please try again.', 'error');
    } finally {
      setFetchingProjects(false);
    }
  };

  const executeBulkCreate = async (campaignId, campaignName) => {
    setShowProjectModal(false);
    setProcessing(true);
    try {
      if (!user) { addToast('Please login first.', 'error'); return; }
      const creatorData = {
        creatorId: user.id || user._id,
        creatorName: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        creatorRole: user.role || 'agent',
        projectSlug: campaignId || undefined,
        projectName: campaignName || undefined,
      };
      const userIds = Array.from(selectedUsers);
      const CONCURRENCY = 5;
      let successCount = 0;
      let failCount = 0;
      let processed = 0;

      for (let i = 0; i < userIds.length; i += CONCURRENCY) {
        const batch = userIds.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
          batch.map(id => api.createLeadFromUser(id, creatorData))
        );
        results.forEach(r => r.status === 'fulfilled' ? successCount++ : failCount++);
        processed += batch.length;
        setProcessingMessage(`Creating leads ${processed}/${userIds.length}...`);
      }

      if (bulkMode === 'automate' && successCount > 0) {
        setProcessingMessage('Starting automation...');
        try {
          const selectedUserData = users.filter(u => selectedUsers.has(u.id));
          const csvLines = ['first_name,last_name,phone_number'];
          selectedUserData.forEach(u => csvLines.push(`${u.first_name || ''},${u.last_name || ''},${u.phone_number || ''}`));
          const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
          const csvFile = new File([blob], `auto_${Date.now()}.csv`, { type: 'text/csv' });
          await uploadCampaign(csvFile, `Auto - ${campaignName || 'Default'}`, campaignId || null);
          addToast(`Automation started! ${successCount} leads will receive calls shortly.`, 'success');
        } catch {
          addToast(`Leads created (${successCount}) but automation failed.`, 'warning');
        }
      } else {
        addToast(`${successCount} leads created${failCount > 0 ? ` · ${failCount} failed` : ''}`, successCount > 0 ? 'success' : 'error');
      }
      setSelectedUsers(new Set());
    } catch {
      addToast('Failed to process requests.', 'error');
    } finally {
      setProcessing(false);
      setProcessingMessage('');
      setBulkMode('lead');
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage team members and contacts.
          </p>
        </div>
        <button
          onClick={() => navigate('/add-user')}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg text-white mt-4 sm:mt-0 transition-colors"
          style={{ background: BRAND_COLOR }}
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          Add User
        </button>
      </div>

      {/* Search & Info Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
          <input
            type="text"
            placeholder="Search users by name, email or phone..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            style={{ '--brand': BRAND_COLOR }}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
          <span className="material-symbols-outlined text-[16px] text-slate-400">groups</span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{total.toLocaleString()} users</span>
        </div>
      </div>

      {/* Processing Banner */}
      {processingMessage && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{processingMessage}</span>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleBulkCreateLead('automate')}
              disabled={processing || fetchingProjects}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">rocket_launch</span>
              {fetchingProjects ? 'Loading...' : 'Start Lead'}
            </button>
            <button
              onClick={() => setDeleteModal({ open: true, userId: null, bulk: true })}
              disabled={processing}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
            >
              Delete
            </button>
            <button onClick={() => setSelectedUsers(new Set())} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700">
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
                  <input type="checkbox" checked={users.length > 0 && selectedUsers.size === users.length} onChange={toggleSelectAll} className="rounded border-slate-300" />
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">User</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">Phone</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 hidden lg:table-cell">Created By</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 hidden lg:table-cell">Added On</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3">person_off</span>
                      <p className="text-sm font-bold text-slate-500 mb-1">
                        {search ? 'No users found' : 'No users yet'}
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        {search ? 'Try a different search term.' : 'Add your first user to get started.'}
                      </p>
                      {!search && (
                        <button onClick={() => navigate('/add-user')} className="px-4 py-2 text-xs font-bold rounded-lg text-white" style={{ background: BRAND_COLOR }}>
                          + Add User
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded border-slate-300" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: BRAND_COLOR }}>
                            {(u.first_name?.[0] || '?').toUpperCase()}
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{name || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{u.phone_number || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-500">{u.email || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{u.createdBy?.name || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{formatDate(u.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedUsers(new Set([u.id]));
                              handleBulkCreateLead('automate');
                            }}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 hover:text-emerald-600 transition-colors"
                            title="Start Lead"
                          >
                            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, userId: u.id, bulk: false })}
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
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()} users
            </p>
            <div className="flex items-center gap-2">
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
              </select>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700">
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${page === p ? 'text-white' : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    style={page === p ? { background: BRAND_COLOR } : {}}>
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
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        title={deleteModal.bulk ? `Delete ${selectedUsers.size} Users?` : 'Delete User?'}
        message={deleteModal.bulk
          ? `Are you sure you want to remove ${selectedUsers.size} users? This cannot be undone.`
          : 'Are you sure you want to remove this user? This cannot be undone.'}
        confirmLabel={deleteModal.bulk ? `Delete ${selectedUsers.size} Users` : 'Delete User'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, userId: null, bulk: false })}
      />

      {/* Campaign/Project Selection Modal */}
      {showProjectModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user?.hitLinked ? 'Select Project' : 'Select Campaign'}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {user?.hitLinked ? 'Choose project to link leads' : 'Choose campaign settings for automation'}
                </p>
              </div>
              <button onClick={() => setShowProjectModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="material-symbols-outlined text-[20px] text-slate-500">close</span>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {campaigns.map(c => (
                <button
                  key={c.campaignId || c._id}
                  onClick={() => executeBulkCreate(c.campaignId, c.campaignName)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left transition-all hover:border-[var(--brand)]/50 hover:bg-orange-50/50 dark:hover:bg-orange-900/10"
                  style={{ '--brand': BRAND_COLOR }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{c.campaignName}</span>
                  </div>
                  {c.leadsCount > 0 && (
                    <p className="mt-1 text-[10px] text-slate-400">{c.leadsCount} leads</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UsersPage;
