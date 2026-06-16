import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';

const UsersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  const [showProjectModal, setShowProjectModal] = useState(false);
  // projects and fetchingProjects state removed — Select Project feature retired

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

  const handleBulkCreateLead = async () => {
    if (selectedUsers.size === 0) return;
    // Execute bulk create directly without project selection
    // (HIT Backend project bridge has been removed)
    await executeBulkCreate(null, null);
  };

  const executeBulkCreate = async (projectSlug, projectName) => {
    setShowProjectModal(false);
    setProcessing(true);

    try {
      if (!user) {
        alert('Please login first.');
        return;
      }

      const creatorData = {
        creatorId: user.id || user._id,
        creatorName:
          user.name ||
          `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        creatorRole: user.role || 'agent',
        projectSlug,
        projectName,
      };

      const userIds = Array.from(selectedUsers);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < userIds.length; i++) {
        setProcessingMessage(
          `PROCESSING ${i + 1}/${userIds.length}...`
        );

        try {
          await api.createLeadFromUser(userIds[i], creatorData);

          successCount++;
        } catch (err) {
          console.error(err);
          failCount++;
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      alert(
        `PROCESS COMPLETE!\n\nSUCCESS: ${successCount}\nFAILED: ${failCount}`
      );

      setSelectedUsers(new Set());
    } catch (err) {
      console.error('Bulk create failed:', err);

      alert('FAILED TO PROCESS SOME REQUESTS.');
    } finally {
      setProcessing(false);
      setProcessingMessage('');
    }
  };

  /* ---------------------------------- */
  /* Bulk Delete */
  /* ---------------------------------- */

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    if (
      !window.confirm(
        `Delete ${selectedUsers.size} selected users?`
      )
    ) {
      return;
    }

    setProcessing(true);

    try {
      const promises = Array.from(selectedUsers).map((userId) =>
        api.deleteUser(userId).catch((err) => ({
          error: err,
          userId,
        }))
      );

      await Promise.all(promises);

      setUsers((prev) =>
        prev.filter((u) => !selectedUsers.has(u.id))
      );

      setSelectedUsers(new Set());
    } catch (err) {
      console.error('Bulk delete failed:', err);

      alert('Failed to delete some users.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative animate-fade-in font-display pb-10">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 landing-gradient-mesh opacity-10 dark:opacity-20"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 -z-10 landing-grid-bg opacity-10 dark:opacity-25"
        aria-hidden
      />

      {/* ---------------------------------- */}
      {/* Header */}
      {/* ---------------------------------- */}

      <div className="mb-8 rounded-[20px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                User Management
              </h1>

              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600/70 dark:text-slate-300/60">
                Manage registered users
              </p>
            </div>

            <div className="hidden sm:block h-12 w-px bg-slate-200 dark:bg-white/10" />

            <div className="rounded-[16px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">
                    groups
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Total Users
                  </p>

                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {filteredUsers.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Add */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>

              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <button
              onClick={() => navigate('/add-user')}
              className="w-full sm:w-auto rounded-[14px] bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-charcoal shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>

                Add User
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------- */}
      {/* Toolbar */}
      {/* ---------------------------------- */}

      <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            list_alt
          </span>

          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-700 dark:text-slate-300">
            User Records
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {processingMessage && (
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
              <span className="material-symbols-outlined animate-spin text-primary text-[16px]">
                sync
              </span>

              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {processingMessage}
              </span>
            </div>
          )}

          {selectedUsers.size > 0 && (
            <>
              <div className="rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
                {selectedUsers.size} Selected
              </div>

              <button
                onClick={handleBulkCreateLead}
                disabled={processing || fetchingProjects}
                className="rounded-[12px] bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-charcoal disabled:opacity-50"
              >
                Start Lead
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={processing}
                className="rounded-[12px] border border-red-500 bg-red-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
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
        <div className="rounded-[20px] border border-dashed border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-12 text-center backdrop-blur-xl">
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
        <div className="overflow-hidden rounded-[20px] border border-slate-200/70 dark:border-white/10 bg-white/75 dark:bg-slate-950/40 backdrop-blur-xl shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_140px] sm:grid-cols-[40px_1fr_180px_160px] items-center gap-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] px-4 py-3">
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

            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              User
            </div>

            <div className="hidden sm:block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              Phone
            </div>

            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              Source
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-200/70 dark:divide-white/5">
            {paginatedUsers.map((u) => (
              <div
                key={u.id}
                className={`grid grid-cols-[40px_1fr_140px] sm:grid-cols-[40px_1fr_180px_160px] items-center gap-4 px-4 py-4 transition-all ${
                  selectedUsers.has(u.id)
                    ? 'bg-primary/5 dark:bg-primary/10'
                    : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.has(u.id)}
                  onChange={() => handleSelectUser(u.id)}
                  className="h-4 w-4 accent-primary"
                />

                <div className="min-w-0">
                  <div className="truncate text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    {u.first_name} {u.last_name}
                  </div>

                  <div className="sm:hidden mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {u.phone_number}
                  </div>
                </div>

                <div className="hidden sm:block truncate font-mono text-xs text-slate-600 dark:text-slate-300">
                  {u.phone_number}
                </div>

                <div className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {u.createdBy?.name || '—'}
                </div>
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

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-slate-200 dark:border-white/10 pt-6">
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
      {/* Modal removed: Select Project feature has been retired */}
      {/* (HIT Backend project bridge removed — project selection no longer available) */}
      {/* ---------------------------------- */}
    </div>
  );
};

export default UsersPage;

