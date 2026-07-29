import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { getFBCampaigns, listProjects, uploadCampaign } from '../api';
import { useNotifications } from '../context/NotificationContext';

const UsersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [bulkMode, setBulkMode] = useState('lead'); // 'lead' or 'automate'

  const itemsPerPage = 15;

  /* ---------------------------------- */
  /* Fetch Users */
  /* ---------------------------------- */

  const fetchUsers = useCallback(async () => {
    try {
      if (!user) return;

      const params = {
        userId: user.id,
        role: user.role,
      };

      const res = await api.getAllUsers(params);

      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ---------------------------------- */
  /* Search */
  /* ---------------------------------- */

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName =
        `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();

      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [users, searchQuery]);

  /* ---------------------------------- */
  /* Pagination */
  /* ---------------------------------- */

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  /* ---------------------------------- */
  /* Selection */
  /* ---------------------------------- */

  const handleSelectAll = (e) => {
    const updated = new Set(selectedUsers);

    if (e.target.checked) {
      filteredUsers.forEach((u) => updated.add(u.id));
    } else {
      filteredUsers.forEach((u) => updated.delete(u.id));
    }

    setSelectedUsers(updated);
  };

  const handleSelectUser = (userId) => {
    const updated = new Set(selectedUsers);

    if (updated.has(userId)) {
      updated.delete(userId);
    } else {
      updated.add(userId);
    }

    setSelectedUsers(updated);
  };

  /* ---------------------------------- */
  /* Bulk Lead */
  /* ---------------------------------- */

  const handleBulkCreateLead = async (mode = 'lead') => {
    if (selectedUsers.size === 0) return;

    setFetchingProjects(true);

    try {
      // HIT-connected users: show projects; others: show FB campaigns
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
        if (!campaignList.length) {
          addToast('No campaigns found. Sync your Facebook campaigns first.', 'warning');
          return;
        }
        setCampaigns(campaignList);
      }
      // Store the mode so executeBulkCreate knows whether to trigger automation
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
      if (!user) {
        addToast('Please login first.', 'error');
        return;
      }

      const creatorData = {
        creatorId:   user.id || user._id,
        creatorName: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        creatorRole: user.role || 'agent',
        projectSlug: campaignId,
        projectName: campaignName,
      };

      const userIds = Array.from(selectedUsers);
      const CONCURRENCY = 5;
      let successCount = 0;
      let failCount = 0;
      let processed = 0;
      const createdLeadIds = [];

      // Step 1: Convert users to leads
      for (let i = 0; i < userIds.length; i += CONCURRENCY) {
        const batch = userIds.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(
          batch.map(id => api.createLeadFromUser(id, creatorData))
        );
        results.forEach(r => {
          if (r.status === 'fulfilled') {
            successCount++;
            const leadId = r.value?.data?.id || r.value?.data?._id;
            if (leadId) createdLeadIds.push(leadId);
          } else {
            failCount++;
          }
        });
        processed += batch.length;
        setProcessingMessage(`Creating leads ${processed}/${userIds.length}...`);
      }

      // Step 2: If "automate" mode, create a quick CSV and upload as campaign to trigger voice calls
      if (bulkMode === 'automate' && createdLeadIds.length > 0) {
        setProcessingMessage('Starting automation — queuing voice calls...');
        try {
          // Build a CSV from the selected users so the campaign upload service creates AutomationJobs
          const selectedUserData = users.filter(u => selectedUsers.has(u.id));
          const csvLines = ['first_name,last_name,phone_number'];
          selectedUserData.forEach(u => {
            csvLines.push(`${u.first_name || ''},${u.last_name || ''},${u.phone_number || ''}`);
          });
          const csvContent = csvLines.join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const csvFile = new File([blob], `auto_${Date.now()}.csv`, { type: 'text/csv' });

          await uploadCampaign(csvFile, `Auto - ${campaignName}`, campaignId);
          addToast(
            `Automation started! ${successCount} lead${successCount !== 1 ? 's' : ''} will receive voice calls shortly.`,
            'success'
          );
        } catch (autoErr) {
          console.error('Campaign auto-upload failed:', autoErr);
          addToast(
            `Leads created (${successCount}) but automation failed to start. Try uploading a campaign manually.`,
            'warning'
          );
        }
      } else {
        addToast(
          `Done! ${successCount} lead${successCount !== 1 ? 's' : ''} created${failCount > 0 ? ` · ${failCount} failed` : ''}`,
          successCount > 0 ? 'success' : 'error'
        );
      }

      setSelectedUsers(new Set());
    } catch (err) {
      console.error('Bulk create failed:', err);
      addToast('Failed to process some requests.', 'error');
    } finally {
      setProcessing(false);
      setProcessingMessage('');
      setBulkMode('lead');
    }
  };

  /* ---------------------------------- */
  /* Bulk Delete */
  /* ---------------------------------- */

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    if (!window.confirm(`Delete ${selectedUsers.size} selected users? This cannot be undone.`)) return;

    setProcessing(true);

    try {
      await Promise.allSettled(
        Array.from(selectedUsers).map(userId => api.deleteUser(userId))
      );
      setUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
      addToast(`${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''} deleted.`, 'success');
    } catch (err) {
      console.error('Bulk delete failed:', err);
      addToast('Failed to delete some users.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative animate-fade-in font-display pb-10">

      {/* ---------------------------------- */}
      {/* Header - compact */}
      {/* ---------------------------------- */}

      <div className="mb-3">
        <h1 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          User Management
        </h1>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {filteredUsers.length} registered users
        </p>
      </div>

      {/* Search + Add */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-[14px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A2030] pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button
          onClick={() => navigate('/add-user')}
          className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-primary text-white border-none cursor-pointer shadow-sm"
          title="Add User"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
        </button>
      </div>

      {/* ---------------------------------- */}
      {/* Toolbar */}
      {/* ---------------------------------- */}

      <div className="mb-5 flex flex-col gap-3">
        {/* Row 1: label */}
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">list_alt</span>
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-700 dark:text-slate-300">
            User Records
          </h2>
        </div>

        {/* Row 2: action buttons — always visible when items selected */}
        <div className="flex flex-wrap items-center gap-2">
          {processingMessage && (
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
              <span className="material-symbols-outlined animate-spin text-primary text-[16px]">sync</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {processingMessage}
              </span>
            </div>
          )}

          {selectedUsers.size > 0 && (
            <>
              {/* Selected count badge */}
              <div className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A2030] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
                {selectedUsers.size} Selected
              </div>

              {/* Start Lead → convert selected users to leads AND trigger voice automation */}
              <button
                onClick={() => handleBulkCreateLead('automate')}
                disabled={processing || fetchingProjects}
                className="flex items-center gap-1.5 rounded-[12px] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-white transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer border-none"
                style={{ background: '#10B981', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
              >
                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                {fetchingProjects ? 'Loading…' : 'Start Lead'}
              </button>

              {/* Delete */}
              <button
                onClick={handleBulkDelete}
                disabled={processing}
                className="flex items-center gap-1.5 rounded-[12px] border border-red-500 bg-red-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white transition-all hover:bg-red-600 disabled:opacity-50 shadow-md shadow-red-500/20"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---------------------------------- */}
      {/* Table */}
      {/* ---------------------------------- */}

      {filteredUsers.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161B27] p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-white/10">
            person_off
          </span>

          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            No users found
          </p>

          <button
            onClick={() => navigate('/add-user')}
            className="mt-6 rounded-[14px] bg-charcoal px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-primary"
          >
            Add First User
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B27] shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_60px_36px] sm:grid-cols-[40px_1fr_180px_70px_36px] items-center gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2030] px-4 py-3">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={
                filteredUsers.length > 0 &&
                filteredUsers.every((u) =>
                  selectedUsers.has(u.id)
                )
              }
              className="h-4 w-4 accent-primary"
            />

            <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              User
            </div>

            <div className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Phone
            </div>

            <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Date
            </div>

            <div></div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedUsers.map((u) => (
              <div
                key={u.id}
                className={`grid grid-cols-[40px_1fr_60px_36px] sm:grid-cols-[40px_1fr_180px_70px_36px] items-center gap-3 px-4 py-3 transition-all ${
                  selectedUsers.has(u.id)
                    ? 'bg-indigo-50 dark:bg-indigo-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.has(u.id)}
                  onChange={() => handleSelectUser(u.id)}
                  className="h-4 w-4 accent-primary"
                />

                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {u.first_name} {u.last_name}
                  </div>

                  <div className="sm:hidden mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {u.phone_number}
                  </div>
                </div>

                <div className="hidden sm:block truncate font-mono text-xs text-slate-600 dark:text-slate-300">
                  {u.phone_number}
                </div>

                <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/crm'); }}
                  className="flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary hover:text-primary transition-all cursor-pointer"
                  title="View in CRM"
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------- */}
      {/* Pagination */}
      {/* ---------------------------------- */}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.max(prev - 1, 1))
            }
            disabled={currentPage === 1}
            className="rounded-[12px] border border-slate-300 dark:border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-40"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const page = idx + 1;

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-10 w-10 rounded-[12px] text-[11px] font-black transition-all ${
                  currentPage === page
                    ? 'bg-primary text-white shadow-lg'
                    : 'border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, totalPages)
              )
            }
            disabled={currentPage === totalPages}
            className="rounded-[12px] border border-slate-300 dark:border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.04] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* ---------------------------------- */}
      {/* Footer */}
      {/* ---------------------------------- */}

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-slate-200 dark:border-slate-800 pt-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Database Growth
          </p>

          <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            {users.length} Registered Users
          </div>
        </div>

        <div className="text-center sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Navigation
          </p>

          <div className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages || 1}
          </div>
        </div>
      </div>

      {/* ---------------------------------- */}
      {/* Modal */}
      {/* ---------------------------------- */}

      {showProjectModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md overflow-hidden rounded-[22px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 py-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {user?.hitLinked ? 'Select Project' : 'Select Campaign'}
                  </h2>

                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {user?.hitLinked ? 'Choose project to link leads' : 'Choose campaign to link leads'}
                  </p>
                </div>

                <button
                  onClick={() => setShowProjectModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/70 dark:border-white/10 bg-white dark:bg-white/[0.05]
                    text-slate-700 dark:text-white/80
                    hover:bg-slate-100 dark:hover:bg-white/[0.12]
                    hover:text-slate-900 dark:hover:text-white
                    transition-all duration-200
                  "
                >
                  <span className="material-symbols-outlined text-[20px] font-bold">
                    close
                  </span>
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5 space-y-3">
                {campaigns.map((c) => (
                  <button
                    key={c.campaignId || c._id}
                    onClick={() =>
                      executeBulkCreate(
                        c.campaignId,
                        c.campaignName
                      )
                    }
                    className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-4 py-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex h-2 w-2 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {c.campaignName}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      <span>{c.status || 'Unknown'}</span>
                      {c.leadsCount > 0 && <span>· {c.leadsCount} leads</span>}
                    </div>
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

