import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getCallLogs } from '../api';

const STATUS_STYLES = {
  completed:
    'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  analytics:
    'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-500 border border-red-500/20',
  default:
    'bg-amber-500/10 text-amber-600 border border-amber-500/20',
};

const PAGE_LIMIT = 20;

const StatCard = ({ title, value, icon }) => (
  <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          {title}
        </p>

        <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {value}
        </h3>
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[24px]">
          {icon}
        </span>
      </div>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />

      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
        Loading Voice Logs...
      </p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="rounded-[22px] border border-dashed border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-16 text-center backdrop-blur-xl">
    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.05]">
      <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-500">
        call_end
      </span>
    </div>

    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
      No Call Logs Found
    </h2>

    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
      Voice agent activity will appear here
    </p>
  </div>
);

const PaginationButton = ({
  children,
  active = false,
  disabled = false,
  onClick,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex h-10 min-w-[40px] items-center justify-center rounded-[12px]
      border text-[10px] font-black uppercase tracking-widest
      transition-all duration-200
      ${
        active
          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
          : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300'
      }
      ${
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'cursor-pointer hover:-translate-y-px'
      }
    `}
  >
    {children}
  </button>
);

const CallLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [expandedRow, setExpandedRow] = useState(null);

  const debounceRef = useRef(null);

  /* ---------------------------------- */
  /* Debounced Search */
  /* ---------------------------------- */

  useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  /* ---------------------------------- */
  /* Fetch Logs */
  /* ---------------------------------- */

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: PAGE_LIMIT,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const res = await getCallLogs(params);

      const data = res.data;

      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch call logs:', err);

      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /* ---------------------------------- */
  /* Helpers */
  /* ---------------------------------- */

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '—';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '—';

    const date = new Date(dateStr);

    const now = new Date();

    const diffMs = now - date;

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';

    if (diffMins < 60) return `${diffMins}m ago`;

    if (diffHours < 24) return `${diffHours}h ago`;

    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getStatusStyle = (status) => {
    const normalized = (status || '').toLowerCase();

    return STATUS_STYLES[normalized] || STATUS_STYLES.default;
  };

  const completedCalls = useMemo(() => {
    return logs.filter(
      (log) =>
        log.status?.toLowerCase() === 'completed' ||
        log.status?.toLowerCase() === 'analytics'
    ).length;
  }, [logs]);

  /* ---------------------------------- */
  /* Loading State */
  /* ---------------------------------- */

  if (loading && logs.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className="animate-fade-in font-display pb-10">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 landing-gradient-mesh opacity-10 dark:opacity-25"
        aria-hidden
      />

      {/* Header */}
      <div className="mb-8 rounded-[24px] border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[28px]">
                  record_voice_over
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Voice Call Logs
                </h1>

                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                  AI Agent Conversation History
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-[320px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>

            <input
              type="text"
              placeholder="Search customer or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                h-14 w-full rounded-[16px]
                border border-slate-200 dark:border-white/10
                bg-white dark:bg-white/[0.04]
                pl-12 pr-4
                text-sm font-semibold
                text-slate-900 dark:text-white
                placeholder:text-slate-400
                outline-none
                transition-all
                focus:border-primary
                focus:ring-4
                focus:ring-primary/10
              "
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Records"
          value={total}
          icon="call"
        />

        <StatCard
          title="Completed"
          value={completedCalls}
          icon="verified"
        />

        <StatCard
          title="Current Page"
          value={currentPage}
          icon="dashboard"
        />

        <StatCard
          title="Pages"
          value={totalPages}
          icon="stacked_bar_chart"
        />
      </div>

      {/* Empty State */}
      {!loading && logs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/70 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
          {/* Desktop Header */}
          <div className="hidden grid-cols-[1.5fr_1fr_0.7fr_2fr_0.8fr_1fr] gap-4 border-b border-slate-200/70 bg-slate-50/70 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03] lg:grid">
            {[
              'Customer',
              'Phone',
              'Duration',
              'Summary',
              'Status',
              'Time',
            ].map((heading) => (
              <span
                key={heading}
                className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400"
              >
                {heading}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-200/70 dark:divide-white/5">
            {logs.map((log) => {
              const rowKey = log.leadId || log._id;

              const isExpanded = expandedRow === rowKey;

              return (
                <div key={rowKey}>
                  {/* Row */}
                  <div
                    onClick={() =>
                      setExpandedRow(isExpanded ? null : rowKey)
                    }
                    className={`
                      grid cursor-pointer grid-cols-1 gap-4 px-5 py-5
                      transition-all duration-200 hover:bg-slate-50/80
                      dark:hover:bg-white/[0.03]
                      lg:grid-cols-[1.5fr_1fr_0.7fr_2fr_0.8fr_1fr]
                      ${isExpanded ? 'bg-slate-50/80 dark:bg-white/[0.03]' : ''}
                    `}
                  >
                    {/* Customer */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-[18px]">
                          person
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                            {log.customerName || 'Unknown'}
                          </h3>

                          <span className="material-symbols-outlined text-slate-400">
                            {isExpanded
                              ? 'keyboard_arrow_up'
                              : 'keyboard_arrow_down'}
                          </span>
                        </div>

                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 lg:hidden">
                          {log.phoneNumber || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="hidden items-center lg:flex">
                      <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {log.phoneNumber || '—'}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center">
                      <span className="rounded-[10px] bg-slate-100 px-3 py-1 font-mono text-[11px] font-black text-slate-700 dark:bg-white/[0.05] dark:text-slate-200">
                        {formatDuration(log.duration)}
                      </span>
                    </div>

                    {/* Summary */}
                    <div className="flex items-center">
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {log.summary || 'No summary available'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <span
                        className={`
                          rounded-full px-3 py-1
                          text-[9px] font-black uppercase tracking-[0.2em]
                          ${getStatusStyle(log.status)}
                        `}
                      >
                        {log.status || 'unknown'}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        {formatTimestamp(log.calledAt)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Transcript */}
                  {isExpanded && log.transcript && (
                    <div className="border-t border-slate-200/70 bg-slate-50/60 px-6 py-5 dark:border-white/10 dark:bg-white/[0.02]">
                      <div className="mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                          description
                        </span>

                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 dark:text-slate-300">
                          Full Transcript
                        </span>
                      </div>

                      <div className="rounded-[18px] border border-slate-200/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                          {log.transcript}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <PaginationButton
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) => Math.max(prev - 1, 1))
            }
          >
            Prev
          </PaginationButton>

          {Array.from(
            { length: Math.min(totalPages, 5) },
            (_, i) => {
              let page;

              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }

              return (
                <PaginationButton
                  key={page}
                  active={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PaginationButton>
              );
            }
          )}

          <PaginationButton
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, totalPages)
              )
            }
          >
            Next
          </PaginationButton>
        </div>
      )}
    </div>
  );
};

export default CallLogsPage;