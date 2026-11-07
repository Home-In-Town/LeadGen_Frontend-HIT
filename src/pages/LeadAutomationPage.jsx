import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { KIND_LABEL } from '../utils/templateNames';
import {
  describeAutomation,
  describeLadder,
  inCallWindowIST,
  newIdempotencyKey,
  formatIST,
  formatISTTime,
  istDateKey,
  dayKey,
  istDateTime,
  TONE_CLASSES,
} from '../utils/automationStatus';
import CallHistorySection from '../components/CallHistorySection';

// Socket events that change what this page shows. Each one triggers a
// debounced reload of the overview (no client-side merging).
const REALTIME_EVENTS = [
  'automation_created',
  'automation_update',
  'automation_deleted',
  'link_update',
  'call_update',
];
const REFETCH_DEBOUNCE_MS = 800;

// Codes that don't stop the owner from scheduling a call for later.
const SCHEDULE_OK_CODES = new Set(['OUTSIDE_CALLING_HOURS', 'CALL_IN_PROGRESS', 'DAILY_CALL_LIMIT']);

const EMPTY_OVERVIEW = {
  lead: null,
  automations: [],
  ladder: null,
  templateOptions: { project: [], own: [], warning: null },
  voice: null,
};

/** Readable text of an API error ({ success:false, error, code } bodies). */
const errorText = (err, fallback) => {
  if (!err?.response) return 'Could not reach the server. Check your connection and try again.';
  const data = err.response.data || {};
  return data.error || data.message || fallback;
};

const fmtDuration = (s) => {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${Math.floor(n / 60)}m ${String(Math.round(n % 60)).padStart(2, '0')}s`;
};

const LeadAutomationPage = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { socket, addToast, playChime } = useNotifications();

  /* ---------------------------------- */
  /* STATE */
  /* ---------------------------------- */

  const [lead, setLead] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [overviewError, setOverviewError] = useState('');
  const [users, setUsers] = useState([]);

  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(!leadId);
  const [callResultRow, setCallResultRow] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  const [newAutomation, setNewAutomation] = useState({
    mode: 'whatsapp', // 'whatsapp' | 'voice'
    templateName: '',
    time: '09:00',
  });

  const [nurtureBusy, setNurtureBusy] = useState(false);
  const [callBusy, setCallBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState({}); // { [rowId]: 'retry' | 'cancel' | 'delete' }

  // One idempotency key per "Call now" / "Schedule call" press sequence: a
  // double click or a retry after a network error reuses it, so the backend
  // never places two calls. Reset after a final server response.
  const callKeyRef = useRef(null);
  const callBusyRef = useRef(false);
  const scheduleKeyRef = useRef(null);

  /* ---------------------------------- */
  /* THEME */
  /* ---------------------------------- */

  const cardClass =
    'bg-white/75 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-[18px] shadow-sm';

  const inputClass =
  'w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none transition-all focus:border-primary appearance-none';

  const buttonPrimary =
    'bg-primary text-white border border-primary hover:bg-charcoal hover:border-charcoal transition-all rounded-[14px] font-black uppercase tracking-widest text-[10px] px-5 py-3';

  const buttonSecondary =
    'bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all rounded-[14px] font-black uppercase tracking-widest text-[10px] px-5 py-3';

  const rowButton =
    'inline-flex items-center gap-1 rounded-[12px] border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const optionClass = 'bg-white text-slate-900 dark:bg-[#111827] dark:text-white';

  /* ---------------------------------- */
  /* HELPERS */
  /* ---------------------------------- */

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (year, month) =>
    new Date(year, month, 1).getDay();

  const leadName = lead
    ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || overview.lead?.name || 'this lead'
    : '';

  const projectName = overview.lead?.projectName || '';

  /* ---------------------------------- */
  /* CALENDAR */
  /* ---------------------------------- */

  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const grid = [];

    let dayCount = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];

      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          week.push(null);
        } else if (dayCount > daysInMonth) {
          week.push(null);
        } else {
          week.push(new Date(year, month, dayCount));
          dayCount++;
        }
      }

      grid.push(week);

      if (dayCount > daysInMonth) break;
    }

    return grid;
  }, [currentDate]);

  const automations = overview.automations;

  const getAutomationsForDate = useCallback(
    (dateObj) => {
      if (!dateObj) return [];

      const target = dateObj.toDateString();
      const targetKey = dayKey(dateObj);

      // AI calls are planned in IST, so they sit on their IST day; WhatsApp
      // rows keep the browser's day.
      return automations.filter((auto) => {
        if (auto.channel === 'voice') return istDateKey(auto.scheduledAt) === targetKey;
        const autoDate = new Date(auto.scheduledAt);
        return autoDate.toDateString() === target;
      });
    },
    [automations]
  );

  /* ---------------------------------- */
  /* FETCH */
  /* ---------------------------------- */

  // Rows, ladder progress, template options and AI-call availability for one lead.
  const loadOverview = useCallback(async (id) => {
    if (!id) return;

    try {
      const res = await api.getLeadAutomationOverview(id);

      if (res?.data?.success) {
        const data = res.data.data || {};
        setOverview({
          lead: data.lead || null,
          automations: Array.isArray(data.automations) ? data.automations : [],
          ladder: data.ladder || null,
          templateOptions: {
            project: data.templateOptions?.project || [],
            own: data.templateOptions?.own || [],
            warning: data.templateOptions?.warning || null,
          },
          voice: data.voice || null,
        });
        setOverviewError('');
      }
    } catch (err) {
      console.error(err);
      setOverviewError(errorText(err, 'Could not load automations for this lead.'));
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const usersRes = await api.getAllUsers({
        userId: user.id,
        role: user.role,
      });

      // GET /users returns { users, total, page, totalPages } — an OBJECT, not an
      // array. Reading usersRes.data directly made `users` an object, so the later
      // `users.map(...)` threw "P.map is not a function" and white-screened the
      // whole Automation page. Always normalise to an array.
      const fetchedUsers = Array.isArray(usersRes?.data)
        ? usersRes.data
        : (usersRes?.data?.users || []);
      setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);

      let resolvedLead = null;

      if (leadId) {
        try {
          const leadRes = await api.getSummary(leadId);

          if (leadRes?.data?.id) {
            resolvedLead = leadRes.data;
          }
        } catch {
          const matchedUser = fetchedUsers.find(
            (u) => u.id === leadId || u._id === leadId
          );

          if (matchedUser) {
            try {
              const promoteRes = await api.createLeadFromUser(
                matchedUser.id,
                {
                  creatorId: user.id,
                  creatorName: user.name,
                  creatorRole: user.role,
                  skipCall: true,
                }
              );

              resolvedLead = promoteRes.data;
            } catch (err) {
              console.error(err);
            }
          }
        }
      }

      setLead(resolvedLead);

      if (resolvedLead?.id) {
        await loadOverview(resolvedLead.id);
      } else {
        setOverview(EMPTY_OVERVIEW);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load automation data.');
    } finally {
      setLoading(false);
    }
  }, [leadId, user, loadOverview]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------------------------- */
  /* SOCKETS */
  /* ---------------------------------- */

  const roomLeadId = lead?.id || null;

  useEffect(() => {
    if (!socket || !roomLeadId) return;

    socket.emit('join_lead', roomLeadId);

    let timer = null;

    const handleRealtime = (payload) => {
      if (payload?.leadId && payload.leadId !== roomLeadId) return;

      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        loadOverview(roomLeadId);
      }, REFETCH_DEBOUNCE_MS);
    };

    REALTIME_EVENTS.forEach((ev) => socket.on(ev, handleRealtime));

    return () => {
      REALTIME_EVENTS.forEach((ev) => socket.off(ev, handleRealtime));
      clearTimeout(timer);
    };
  }, [socket, roomLeadId, loadOverview]);

  /* ---------------------------------- */
  /* MODALS: Escape closes the top one */
  /* ---------------------------------- */

  useEffect(() => {
    if (!callResultRow && !isHistoryModalOpen && !isScheduleModalOpen) return;

    const handleKey = (e) => {
      if (e.key !== 'Escape') return;

      if (callResultRow) setCallResultRow(null);
      else if (isHistoryModalOpen) setIsHistoryModalOpen(false);
      else if (isScheduleModalOpen && !isSaving) setIsScheduleModalOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [callResultRow, isHistoryModalOpen, isScheduleModalOpen, isSaving]);

  /* ---------------------------------- */
  /* ACTIONS */
  /* ---------------------------------- */

  const handleEnrollNurture = async () => {
    if (!lead?.id || nurtureBusy) return;

    try {
      setNurtureBusy(true);

      const res = await api.enrollLeadNurture(lead.id);

      if (res?.data?.success) {
        const count = res.data.scheduled ?? res.data.data?.length ?? 0;

        addToast?.(
          count
            ? `${count} follow-up message${count === 1 ? '' : 's'} scheduled for this lead.`
            : (res.data.message || 'Nurturing ladder enrolled for this lead.'),
          count ? 'success' : 'info',
          'Nurturing Started'
        );

        await loadOverview(lead.id);
      } else {
        addToast?.(
          res?.data?.error || res?.data?.message || 'Unable to start nurturing for this lead.',
          'error',
          'Could Not Enroll'
        );
      }
    } catch (err) {
      console.error(err);

      addToast?.(
        errorText(err, 'Unable to start nurturing for this lead.'),
        'error',
        'Could Not Enroll'
      );
    } finally {
      setNurtureBusy(false);
    }
  };

  const handleCancelNurture = async () => {
    if (!lead?.id || nurtureBusy) return;

    try {
      setNurtureBusy(true);

      const res = await api.cancelLeadNurture(lead.id);

      if (res?.data?.success) {
        const count = res.data.removed ?? 0;

        addToast?.(
          count
            ? `${count} pending follow-up${count === 1 ? '' : 's'} cancelled.`
            : 'Pending nurturing follow-ups cancelled.',
          'info',
          'Nurturing Stopped'
        );

        await loadOverview(lead.id);
      } else {
        addToast?.(
          res?.data?.error || res?.data?.message || 'Unable to stop nurturing for this lead.',
          'error',
          'Could Not Stop'
        );
      }
    } catch (err) {
      console.error(err);

      addToast?.(
        errorText(err, 'Unable to stop nurturing for this lead.'),
        'error',
        'Could Not Stop'
      );
    } finally {
      setNurtureBusy(false);
    }
  };

  const handleCallNow = async () => {
    if (!lead?.id || callBusyRef.current) return;

    if (!window.confirm(`Start an AI call to ${leadName} now?`)) return;

    callBusyRef.current = true;
    setCallBusy(true);

    if (!callKeyRef.current) callKeyRef.current = newIdempotencyKey();

    try {
      const res = await api.callLeadNow(lead.id, callKeyRef.current);
      callKeyRef.current = null;

      addToast?.(
        res?.data?.message || 'AI call queued. It will start within a minute.',
        res?.data?.duplicate ? 'info' : 'success',
        res?.data?.duplicate ? 'Already requested' : 'AI call started'
      );
    } catch (err) {
      console.error(err);
      // Keep the key when there was no server answer, so pressing again
      // can't place a second call if the first one went through.
      if (err?.response) callKeyRef.current = null;

      addToast?.(errorText(err, 'Could not start the AI call.'), 'error', 'AI call not started');
    } finally {
      callBusyRef.current = false;
      setCallBusy(false);
      loadOverview(lead.id);
    }
  };

  const openScheduleModal = (date) => {
    setSelectedDate(date);

    setNewAutomation({
      mode: 'whatsapp',
      templateName: '',
      time: '09:00',
    });

    setScheduleError('');
    scheduleKeyRef.current = null;
    setIsScheduleModalOpen(true);
  };

  const openHistoryModal = (date) => {
    setSelectedHistoryDate(date);
    setIsHistoryModalOpen(true);
  };

  const failSchedule = (message, title) => {
    setScheduleError(message);
    addToast?.(message, 'error', title);
  };

  const handleSaveAutomation = async () => {
    if (!selectedDate || !lead || isSaving) return;

    const isVoice = newAutomation.mode === 'voice';
    const errorTitle = isVoice ? 'Call not scheduled' : 'Not scheduled';

    // AI call times are IST wall-clock times whatever the browser timezone;
    // WhatsApp times stay in the browser's time.
    let scheduledAt;
    if (isVoice) {
      scheduledAt = istDateTime(selectedDate, newAutomation.time);
    } else {
      const [hours, minutes] = String(newAutomation.time || '').split(':');
      scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }

    if (!Number.isFinite(scheduledAt.getTime())) {
      failSchedule('Pick a time.', errorTitle);
      return;
    }

    if (!isVoice && !newAutomation.templateName) {
      failSchedule('Choose a template to send.', errorTitle);
      return;
    }

    if (isVoice) {
      if (!inCallWindowIST(scheduledAt)) {
        failSchedule('AI calls can only be placed between 9:00 AM and 9:00 PM IST.', errorTitle);
        return;
      }

      if (scheduledAt.getTime() < Date.now() + 60 * 1000) {
        failSchedule('Pick a time at least a minute from now.', errorTitle);
        return;
      }
    }

    setScheduleError('');

    try {
      setIsSaving(true);

      if (isVoice) {
        if (!scheduleKeyRef.current) scheduleKeyRef.current = newIdempotencyKey();

        const res = await api.scheduleLeadCall(
          lead.id,
          scheduledAt.toISOString(),
          scheduleKeyRef.current
        );
        scheduleKeyRef.current = null;

        addToast?.(
          res?.data?.message || 'AI call scheduled.',
          res?.data?.duplicate ? 'info' : 'success',
          res?.data?.duplicate ? 'Already requested' : 'AI call scheduled'
        );
      } else {
        await api.createLeadAutomation({
          leadId: lead.id,
          templateName: newAutomation.templateName,
          scheduledAt: scheduledAt.toISOString(),
        });

        addToast?.('Message scheduled successfully.', 'success', 'Automation Scheduled');
      }

      playChime?.();
      setIsScheduleModalOpen(false);
      loadOverview(lead.id);
    } catch (err) {
      console.error(err);
      if (err?.response) scheduleKeyRef.current = null;

      failSchedule(
        errorText(err, isVoice ? 'Unable to schedule the AI call.' : 'Unable to save automation.'),
        errorTitle
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runRowAction = async (id, kind, action) => {
    if (!id || rowBusy[id]) return;

    setRowBusy((prev) => ({ ...prev, [id]: kind }));

    try {
      await action();
    } finally {
      setRowBusy((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      if (lead?.id) loadOverview(lead.id);
    }
  };

  const handleRetry = (row) =>
    runRowAction(row._id, 'retry', async () => {
      try {
        const res = await api.retryLeadAutomation(row._id);
        addToast?.(res?.data?.message || 'Retry queued.', 'success', 'Retry queued');
      } catch (err) {
        console.error(err);
        const data = err?.response?.data;

        if (data?.code === 'ALREADY_SENT') {
          addToast?.(data.error || 'WhatsApp confirms this was sent; not sending again.', 'info', 'Already sent');
        } else {
          addToast?.(errorText(err, 'Could not retry this message.'), 'error', 'Retry failed');
        }
      }
    });

  const handleCancelCall = (row) => {
    if (!window.confirm('Cancel this AI call?')) return;

    return runRowAction(row._id, 'cancel', async () => {
      try {
        const res = await api.cancelLeadCall(row._id);
        addToast?.(res?.data?.message || 'AI call cancelled.', 'info', 'Call cancelled');
      } catch (err) {
        console.error(err);
        addToast?.(errorText(err, 'Could not cancel this call.'), 'error', 'Could not cancel');
      }
    });
  };

  const handleDelete = (row) => {
    if (!window.confirm('Delete this automation?')) return;

    return runRowAction(row._id, 'delete', async () => {
      try {
        await api.deleteLeadAutomation(row._id);
        addToast?.('Automation removed.', 'info', 'Deleted');
      } catch (err) {
        console.error(err);
        addToast?.(errorText(err, 'Could not delete this automation.'), 'error', 'Could not delete');
      }
    });
  };

  /* ---------------------------------- */
  /* LOADING */
  /* ---------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4" role="status">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Loading
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------- */
  /* DERIVED */
  /* ---------------------------------- */

  const voice = overview.voice;
  const ladderLine = describeLadder(overview.ladder);

  let callDisabledReason = null;
  if (!voice) {
    callDisabledReason = overviewError ? 'AI calling status is unavailable.' : 'Checking AI calling…';
  } else if (voice.inProgress) {
    callDisabledReason = 'A call to this lead is already in progress.';
  } else if (!voice.available) {
    callDisabledReason = voice.reason || 'AI calling is not available for this lead right now.';
  }

  const voiceScheduleNote =
    voice && !voice.available && voice.reason && !SCHEDULE_OK_CODES.has(voice.code)
      ? voice.reason
      : null;

  const { project: projectOptions, own: ownOptions, warning: templateWarning } = overview.templateOptions;

  const historyRows = getAutomationsForDate(selectedHistoryDate);
  const pageError = error || overviewError;

  /* ---------------------------------- */
  /* RENDER */
  /* ---------------------------------- */

  return (
    <>
      <div className="relative animate-fade-in font-display pb-10">

        {/* BACKGROUND */}

        <div className="pointer-events-none absolute inset-0 -z-10 landing-gradient-mesh opacity-10 dark:opacity-25" />

        <div className="pointer-events-none absolute inset-0 -z-10 landing-grid-bg opacity-10 dark:opacity-30" />

        <div className="mx-auto max-w-7xl px-3 sm:px-0">

          {/* HEADER */}

          <div className={`${cardClass} p-4 sm:p-6 mb-6`}>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <button
                  onClick={() => navigate(-1)}
                  className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                    arrow_back
                  </span>

                  Dashboard
                </button>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Automation Calendar
                </h1>

                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Schedule & monitor lead workflows
                </p>

                {lead && (
                  <>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />

                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                          {lead.first_name} {lead.last_name}
                        </span>
                      </div>

                      <button
                        onClick={handleEnrollNurture}
                        disabled={nurtureBusy}
                        className={`${buttonPrimary} inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                          {nurtureBusy ? 'hourglass_top' : 'rocket_launch'}
                        </span>
                        Enroll in Nurturing
                      </button>

                      <button
                        onClick={handleCancelNurture}
                        disabled={nurtureBusy}
                        className={`${buttonSecondary} inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                          stop_circle
                        </span>
                        Stop Nurturing
                      </button>

                      <button
                        onClick={handleCallNow}
                        disabled={callBusy || !!callDisabledReason}
                        aria-busy={callBusy}
                        aria-describedby={callDisabledReason && !callBusy ? 'call-now-reason' : undefined}
                        className={`${buttonSecondary} inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span
                          className={`material-symbols-outlined text-[14px] ${callBusy ? 'animate-spin' : ''}`}
                          aria-hidden="true"
                        >
                          {callBusy ? 'progress_activity' : 'call'}
                        </span>
                        {callBusy ? 'Calling…' : 'Call now'}
                      </button>
                    </div>

                    {callDisabledReason && !callBusy && (
                      <p
                        id="call-now-reason"
                        className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                          info
                        </span>
                        {callDisabledReason}
                      </p>
                    )}

                    {ladderLine && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">
                          timeline
                        </span>
                        {ladderLine}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-3">

                <button
                  onClick={() =>
                    setCurrentDate(new Date())
                  }
                  className={buttonSecondary}
                >
                  Today
                </button>

                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() - 1,
                        1
                      )
                    )
                  }
                  aria-label="Previous month"
                  className={buttonSecondary}
                >
                  Prev
                </button>

                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        1
                      )
                    )
                  }
                  aria-label="Next month"
                  className={buttonSecondary}
                >
                  Next
                </button>

              </div>

            </div>

          </div>

          {/* ERROR */}

          {pageError && (
            <div
              role="alert"
              className="mb-6 rounded-[18px] border border-red-300 bg-red-50 p-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
            >
              {pageError}
            </div>
          )}

          {/* CALENDAR */}

          <div className={`${cardClass} overflow-hidden`}>

            {/* MONTH */}

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 py-4">

              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-700 dark:text-slate-300">
                {currentDate.toLocaleDateString(
                  'default',
                  {
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              </h2>

              <div className="hidden sm:flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />

                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Live
                </span>
              </div>

            </div>

            {/* DAYS */}

            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">

              {[
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
              ].map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500"
                >
                  {day}
                </div>
              ))}

            </div>

            {/* GRID */}

            <div className="grid grid-cols-7">

              {monthGrid.flat().map(
                (dateObj, idx) => {
                  if (!dateObj) {
                    return (
                      <div
                        key={idx}
                        className="aspect-square border-r border-b border-slate-200 bg-slate-50/40 dark:border-white/10 dark:bg-white/[0.02]"
                      />
                    );
                  }

                  const isToday =
                    new Date().toDateString() ===
                    dateObj.toDateString();

                  const isPast =
                    dateObj <
                    new Date(
                      new Date().setHours(
                        0,
                        0,
                        0,
                        0
                      )
                    );

                  const dayAutomations =
                    getAutomationsForDate(
                      dateObj
                    );

                  const dayLabel = dateObj.toLocaleDateString(undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  });

                  return (
                    <div
                      key={dateObj.toISOString()}
                      role="button"
                      tabIndex={0}
                      aria-label={`${dayLabel}: ${dayAutomations.length} ${dayAutomations.length === 1 ? 'entry' : 'entries'}. Open history`}
                      onClick={() =>
                        openHistoryModal(
                          dateObj
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openHistoryModal(dateObj);
                        }
                      }}
                      className="group relative aspect-square cursor-pointer border-r border-b border-slate-200 bg-white transition-all hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-transparent dark:hover:bg-white/[0.03]"
                    >

                      {/* DATE */}

                      <div className="absolute left-3 top-3">

                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                            isToday
                              ? 'bg-primary text-white'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {dateObj.getDate()}
                        </div>

                      </div>

                      {/* COUNT */}

                      {dayAutomations.length >
                        0 && (
                        <div
                          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-lg"
                          aria-hidden="true"
                        >
                          {
                            dayAutomations.length
                          }
                        </div>
                      )}

                      {/* LIST */}

                      <div className="flex h-full flex-col justify-end gap-1 p-3">

                        {dayAutomations
                          .slice(0, 2)
                          .map((auto) => {
                            const d = describeAutomation(auto, undefined, projectName);

                            return (
                              <div
                                key={auto._id}
                                title={`${d.title} — ${d.statusLabel}`}
                                className={`min-w-0 rounded-[10px] px-2 py-1 text-[9px] font-black tracking-wide ${TONE_CLASSES[d.tone] || TONE_CLASSES.slate}`}
                              >
                                <div className="flex min-w-0 items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
                                    {d.channel === 'voice' ? 'call' : 'chat'}
                                  </span>
                                  <span className="truncate">{d.title}</span>
                                </div>
                                <div className="truncate text-[8px] uppercase opacity-80">
                                  {d.statusLabel}
                                </div>
                              </div>
                            );
                          })}

                        {dayAutomations.length >
                          2 && (
                          <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                            +
                            {dayAutomations.length -
                              2}{' '}
                            more
                          </div>
                        )}

                      </div>

                      {/* ADD */}

                      {!isPast && lead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            openScheduleModal(
                              dateObj
                            );
                          }}
                          aria-label={`Schedule on ${dayLabel}`}
                          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white opacity-0 shadow-sm transition-all hover:border-primary hover:text-primary focus:opacity-100 group-hover:opacity-100 dark:border-white/10 dark:bg-slate-900"
                        >
                          <span className="material-symbols-outlined text-base" aria-hidden="true">
                            add
                          </span>
                        </button>
                      )}

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>
      </div>

      {/* SCHEDULE MODAL */}

{isScheduleModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      className={`${cardClass} w-full max-w-lg overflow-hidden`}
    >

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 py-5">

        <div>
          <h3 id="schedule-modal-title" className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Schedule Automation
          </h3>

          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            {selectedDate?.toLocaleDateString()}
          </p>
        </div>

        {/* CLOSE BUTTON */}

        <button
          onClick={() => setIsScheduleModalOpen(false)}
          disabled={isSaving}
          aria-label="Close"
          autoFocus
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all hover:border-primary hover:text-primary dark:border-white/10"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            close
          </span>
        </button>

      </div>

      {/* BODY */}

      <div className="space-y-5 p-6">

        {/* USER */}

        {lead && (
          <div className="rounded-[16px] border border-primary/20 bg-primary/5 p-4">

            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Recipient
            </div>

            <div className="mt-2 text-lg font-black text-slate-900 dark:text-white">
              {`${lead.first_name || ''} ${lead.last_name || ''}`.toUpperCase()}
            </div>

            <div className="text-sm text-slate-500">
              {lead.phone_number}
            </div>

          </div>
        )}

        {/* TYPE */}

        <fieldset>

          <legend className="mb-2 text-[9px] font-black uppercase tracking-[0.35em] text-slate-900/45 dark:text-slate-300/50">
            What to schedule
          </legend>

          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'whatsapp', label: 'WhatsApp template', icon: 'chat' },
              { value: 'voice', label: 'AI call', icon: 'call' },
            ].map((opt) => {
              const checked = newAutomation.mode === opt.value;

              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-bold transition-all focus-within:ring-2 focus-within:ring-primary ${
                    checked
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 text-slate-700 hover:border-primary/40 dark:border-white/10 dark:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="schedule-mode"
                    value={opt.value}
                    checked={checked}
                    onChange={() => {
                      setNewAutomation((prev) => ({ ...prev, mode: opt.value }));
                      setScheduleError('');
                    }}
                    className="sr-only"
                  />
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    {opt.icon}
                  </span>
                  {opt.label}
                </label>
              );
            })}
          </div>

        </fieldset>

        {/* TEMPLATE */}

        {newAutomation.mode === 'whatsapp' && (
          <div>

            <label
              htmlFor="automation-template"
              className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-slate-900/45 dark:text-slate-300/50"
            >

              <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">
                auto_awesome
              </span>

              Template

            </label>

            <select
              id="automation-template"
              value={newAutomation.templateName}
              onChange={(e) => {
                const templateName = e.target.value;
                setNewAutomation((prev) => ({ ...prev, templateName }));
                setScheduleError('');
              }}
              className={inputClass}
            >

              <option value="" className={optionClass}>
                Select Template
              </option>

              {projectOptions.length > 0 && (
                <optgroup label={projectName || 'Project templates'}>
                  {projectOptions.map((o) => {
                    const pn = o.projectName || projectName;
                    const kindLabel = KIND_LABEL[o.kind] || o.kind;

                    return (
                      <option key={o.templateName} value={o.templateName} className={optionClass}>
                        {pn ? `${pn} · ${kindLabel}` : kindLabel}
                      </option>
                    );
                  })}
                </optgroup>
              )}

              {ownOptions.length > 0 && (
                <optgroup label="Your templates">
                  {ownOptions.map((o) => (
                    <option key={o.templateName} value={o.templateName} className={optionClass}>
                      {o.templateName}
                    </option>
                  ))}
                </optgroup>
              )}

            </select>

            {projectOptions.length === 0 && ownOptions.length === 0 && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                No approved templates are available for this lead yet.
              </p>
            )}

            {templateWarning && (
              <p
                role="status"
                className="mt-2 flex items-start gap-1 rounded-[12px] bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                  warning
                </span>
                {templateWarning}
              </p>
            )}

          </div>
        )}

        {/* PROJECT — removed: HIT projects no longer used */}

        {/* TIME */}

        <div>

          <label
            htmlFor="automation-time"
            className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-slate-900/45 dark:text-slate-300/50"
          >

            <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">
              schedule
            </span>

            Time

          </label>

          <input
            id="automation-time"
            type="time"
            value={newAutomation.time}
            onChange={(e) => {
              const time = e.target.value;
              setNewAutomation((prev) => ({ ...prev, time }));
              setScheduleError('');
            }}
            aria-describedby={newAutomation.mode === 'voice' ? 'automation-call-hint' : undefined}
            className={`${inputClass} dark:[color-scheme:dark]`}
          />

          {newAutomation.mode === 'voice' && (
            <p id="automation-call-hint" className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Time is India time (IST). Calls run 9:00 AM – 9:00 PM IST
            </p>
          )}

          {newAutomation.mode === 'voice' && voiceScheduleNote && (
            <p className="mt-2 flex items-start gap-1 rounded-[12px] bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                warning
              </span>
              {voiceScheduleNote}
            </p>
          )}

        </div>

        {scheduleError && (
          <div
            role="alert"
            className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            {scheduleError}
          </div>
        )}

      </div>

      {/* FOOTER */}

      <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-white/10 px-6 py-5">

        <button
          onClick={() =>
            setIsScheduleModalOpen(false)
          }
          disabled={isSaving}
          className={buttonSecondary}
        >
          Cancel
        </button>

        <button
          disabled={isSaving}
          aria-busy={isSaving}
          onClick={handleSaveAutomation}
          className={`${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving ? 'Saving...' : 'Schedule'}
        </button>

      </div>

    </div>

  </div>
)}

      {/* HISTORY MODAL */}

{isHistoryModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      className={`${cardClass} w-full max-w-xl overflow-hidden`}
    >

      {/* HEADER */}

      <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 px-6 py-5">

        <div>
          <h3 id="history-modal-title" className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Automation History
          </h3>

          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            {selectedHistoryDate?.toLocaleDateString()}
          </p>
        </div>

        {/* CLOSE BUTTON */}

        <button
          onClick={() => setIsHistoryModalOpen(false)}
          aria-label="Close"
          autoFocus
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            close
          </span>
        </button>

      </div>

      {/* BODY */}

      <div className="max-h-[65vh] overflow-y-auto p-6">

        {historyRows.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-slate-300 p-10 text-center dark:border-white/10">

            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-white/20" aria-hidden="true">
              history
            </span>

            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              No history found
            </p>

          </div>
        ) : (
          <ul className="space-y-3">

            {historyRows.map((auto) => {
              const d = describeAutomation(auto, undefined, projectName);
              const busy = rowBusy[auto._id];
              const duration = d.channel === 'voice' ? fmtDuration(auto.callDuration) : null;
              const hasActions = d.canRetry || d.canCancelCall || d.canDelete || d.hasCallResult;

              return (
                <li
                  key={auto._id}
                  className="rounded-[16px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                        <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
                          {d.channel === 'voice' ? 'call' : 'chat'}
                        </span>
                        <span className="break-words">{d.title}</span>
                      </div>

                      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                        {d.channel === 'voice'
                          ? `${formatISTTime(auto.scheduledAt)} IST`
                          : formatTime(auto.scheduledAt)}
                        {duration ? ` · ${duration}` : ''}
                      </div>

                      {d.reason && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                          {d.reason}
                        </p>
                      )}

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${TONE_CLASSES[d.tone] || TONE_CLASSES.slate}`}
                    >
                      {d.statusLabel}
                    </span>

                  </div>

                  {hasActions && (
                    <div className="mt-3 flex flex-wrap gap-2">

                      {d.canRetry && (
                        <button
                          onClick={() => handleRetry(auto)}
                          disabled={!!busy}
                          aria-label={`Retry ${d.title}`}
                          aria-busy={busy === 'retry'}
                          className={`${rowButton} border-primary/30 text-primary hover:bg-primary/10`}
                        >
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                            refresh
                          </span>
                          {busy === 'retry' ? 'Retrying…' : 'Retry'}
                        </button>
                      )}

                      {d.canCancelCall && (
                        <button
                          onClick={() => handleCancelCall(auto)}
                          disabled={!!busy}
                          aria-label="Cancel this AI call"
                          aria-busy={busy === 'cancel'}
                          className={`${rowButton} border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300`}
                        >
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                            phone_disabled
                          </span>
                          {busy === 'cancel' ? 'Cancelling…' : 'Cancel call'}
                        </button>
                      )}

                      {d.hasCallResult && (
                        <button
                          onClick={() => setCallResultRow(auto)}
                          aria-label="View call result"
                          className={`${rowButton} border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.08]`}
                        >
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                            description
                          </span>
                          View call result
                        </button>
                      )}

                      {d.canDelete && (
                        <button
                          onClick={() => handleDelete(auto)}
                          disabled={!!busy}
                          aria-label={`Delete ${d.title}`}
                          aria-busy={busy === 'delete'}
                          className={`${rowButton} border-red-200 text-red-500 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300`}
                        >
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                            delete
                          </span>
                          {busy === 'delete' ? 'Deleting…' : 'Delete'}
                        </button>
                      )}

                    </div>
                  )}

                </li>
              );
            })}

          </ul>
        )}

      </div>

    </div>

  </div>
)}

      {/* CALL RESULT MODAL */}

      {callResultRow && lead && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-result-modal-title"
            className={`${cardClass} w-full max-w-2xl overflow-hidden`}
          >

            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 px-6 py-5">

              <div>
                <h3 id="call-result-modal-title" className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  AI call result
                </h3>

                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  {`${formatIST(callResultRow.dialedAt || callResultRow.scheduledAt)} IST`}
                </p>
              </div>

              <button
                onClick={() => setCallResultRow(null)}
                aria-label="Close"
                autoFocus
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  close
                </span>
              </button>

            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">

              <CallHistorySection
                leadId={lead.id}
                highlightCallId={callResultRow.callId || null}
                highlightCallNumber={callResultRow.callNumber || undefined}
              />

              <Link
                to={`/lead/${lead.id}`}
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary hover:underline"
              >
                Open lead page
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>

            </div>

          </div>

        </div>
      )}

      {/* USER PICKER */}

      {isUserPickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-picker-title"
            className={`${cardClass} w-full max-w-3xl overflow-hidden`}
          >

            <div className="border-b border-slate-200 dark:border-white/10 px-6 py-5">

              <h3 id="user-picker-title" className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Select User
              </h3>

              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Choose a user to manage automations
              </p>

            </div>

            <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">

              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={async () => {
                    try {
                      setIsUserPickerOpen(false);

                      // Try creating/fetching lead first

                      const promoteRes =
                        await api.createLeadFromUser(
                          u.id,
                          {
                            creatorId: user.id,
                            creatorName: user.name,
                            creatorRole: user.role,
                            skipCall: true,
                          }
                        );

                      const createdLead =
                        promoteRes?.data;

                      if (createdLead?.id) {
                        navigate(
                          `/lead-automation/${createdLead.id}`
                        );
                      }
                    } catch (err) {
                      console.error(err);

                      addToast?.(
                        'Unable to open lead automation.',
                        'error',
                        'Failed'
                      );
                    }
                  }}
                  className="group flex items-center gap-4 rounded-[18px] border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-px hover:border-primary hover:shadow-md dark:border-white/10 dark:bg-white/[0.03]"
                >

                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10 text-lg font-black text-primary">
                    {u.first_name?.[0]?.toUpperCase()}
                    {u.last_name?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 overflow-hidden">

                    <div className="truncate text-sm font-black text-slate-900 dark:text-white">
                      {`${u.first_name || ''} ${u.last_name || ''}`
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </div>

                    <div className="truncate text-xs text-slate-500">
                      {u.phone_number}
                    </div>

                  </div>

                  <span className="material-symbols-outlined text-slate-400 transition-all group-hover:text-primary" aria-hidden="true">
                    arrow_forward
                  </span>

                </button>
              ))}

            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 px-6 py-5">

              <button
                onClick={() =>
                  navigate('/dashboard')
                }
                className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 transition-colors hover:text-primary"
              >
                Cancel
              </button>

              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Total Users: {users.length}
              </div>

            </div>

          </div>

        </div>
      )}
    </>
  )};

export default LeadAutomationPage;
