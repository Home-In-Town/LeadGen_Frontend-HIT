import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

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

  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(!leadId);

  const [isSaving, setIsSaving] = useState(false);

  const [newAutomation, setNewAutomation] = useState({
    templateName: '',
    time: '09:00',
    projectId: '',
  });

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

  /* ---------------------------------- */
  /* HELPERS */
  /* ---------------------------------- */

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getTemplateLabel = (id) => {
    const found = templates.find((t) => t.id === id);
    return found?.label || id;
  };

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (year, month) =>
    new Date(year, month, 1).getDay();

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

  const getAutomationsForDate = useCallback(
    (dateObj) => {
      if (!dateObj) return [];

      const target = dateObj.toDateString();

      return automations.filter((auto) => {
        const autoDate = new Date(auto.scheduledAt);
        return autoDate.toDateString() === target;
      });
    },
    [automations]
  );

  /* ---------------------------------- */
  /* FETCH */
  /* ---------------------------------- */

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const [
        usersRes,
        templatesRes,
        automationsRes,
      ] = await Promise.all([
        api.getAllUsers({
          userId: user.id,
          role: user.role,
        }),

        // Fetch live Meta WhatsApp templates (APPROVED only)
        api.listWATemplates().catch(() => ({ data: { success: false, data: [] } })),

        api.getCreatorAutomations(user.id),
      ]);

      const fetchedUsers = usersRes?.data || [];
      setUsers(fetchedUsers);

      // Map Meta templates to { id, label } format for the dropdown
      if (templatesRes?.data?.success) {
        const metaTemplates = (templatesRes.data.data || [])
          .filter(t => t.status === 'APPROVED')
          .map(t => ({ id: t.name, label: t.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
        setTemplates(metaTemplates.length > 0 ? metaTemplates : []);
      }

      // Projects no longer fetched from HIT — removed
      setProjects([]);

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

      if (automationsRes?.data?.success) {
        const allAutos = automationsRes.data.data || [];

        const filtered = resolvedLead
          ? allAutos.filter(
              (a) => a.leadId === resolvedLead.id
            )
          : [];

        setAutomations(filtered);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load automation data.');
    } finally {
      setLoading(false);
    }
  }, [leadId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------------------------- */
  /* SOCKETS */
  /* ---------------------------------- */

  useEffect(() => {
    if (!socket || !leadId) return;

    socket.emit('join_lead', leadId);

    const handleRealtime = (payload) => {
      if (!payload) return;

      if (
        payload.linkActivity ||
        payload.status
      ) {
        setAutomations((prev) =>
          prev.map((auto) => {
            const payloadId =
              payload.automationId || payload._id;

            if (auto._id === payloadId) {
              return {
                ...auto,
                status: payload.status || auto.status,
                linkActivity: {
                  ...auto.linkActivity,
                  ...payload.linkActivity,
                },
              };
            }

            return auto;
          })
        );
      }

      if (
        payload.templateName &&
        payload.leadId === leadId
      ) {
        setAutomations((prev) => {
          if (
            prev.some(
              (a) =>
                a._id ===
                (payload._id ||
                  payload.automationId)
            )
          ) {
            return prev;
          }

          return [...prev, payload].sort(
            (a, b) =>
              new Date(a.scheduledAt) -
              new Date(b.scheduledAt)
          );
        });
      }

      if (
        payload.automationId &&
        !payload.linkActivity &&
        !payload.status
      ) {
        setAutomations((prev) =>
          prev.filter(
            (a) =>
              a._id !== payload.automationId
          )
        );
      }
    };

    socket.on('automation_update', handleRealtime);
    socket.on('link_update', handleRealtime);
    socket.on('automation_created', handleRealtime);
    socket.on('automation_deleted', handleRealtime);

    return () => {
      socket.off(
        'automation_update',
        handleRealtime
      );
      socket.off('link_update', handleRealtime);
      socket.off(
        'automation_created',
        handleRealtime
      );
      socket.off(
        'automation_deleted',
        handleRealtime
      );
    };
  }, [socket, leadId]);

  /* ---------------------------------- */
  /* ACTIONS */
  /* ---------------------------------- */

  const openScheduleModal = (date) => {
    setSelectedDate(date);

    setNewAutomation({
      templateName: '',
      time: '09:00',
      projectId: '',
    });

    setIsScheduleModalOpen(true);
  };

  const openHistoryModal = (date) => {
    setSelectedHistoryDate(date);
    setIsHistoryModalOpen(true);
  };

  const handleSaveAutomation = async () => {
    if (
      !newAutomation.templateName ||
      !selectedDate ||
      !lead
    ) {
      return;
    }

    try {
      setIsSaving(true);

      const [hours, minutes] =
        newAutomation.time.split(':');

      const scheduledAt = new Date(selectedDate);

      scheduledAt.setHours(
        parseInt(hours),
        parseInt(minutes),
        0,
        0
      );

      const payload = {
        leadId: lead.id,
        templateName:
          newAutomation.templateName,
        scheduledAt:
          scheduledAt.toISOString(),

        createdBy: {
          userId: user?.id,
          role: user?.role,
          name: user?.name,
        },
      };

      if (
        newAutomation.templateName ===
          'lead_street_view' &&
        newAutomation.projectId
      ) {
        payload.button_0 = `${newAutomation.projectId}#street`;
      }

      const res =
        await api.createLeadAutomation(
          payload
        );

      if (res?.data?.success) {
  const newAuto = res.data.data;

  setAutomations((prev) => {
    const exists = prev.some(
      (a) =>
        a._id === newAuto._id ||
        (
          a.leadId === newAuto.leadId &&
          a.templateName === newAuto.templateName &&
          new Date(a.scheduledAt).getTime() ===
            new Date(newAuto.scheduledAt).getTime()
        )
    );

    if (exists) return prev;

    return [...prev, newAuto].sort(
      (a, b) =>
        new Date(a.scheduledAt) -
        new Date(b.scheduledAt)
    );
  });

        addToast?.(
          'success',
          'Automation Scheduled',
          'Message scheduled successfully.'
        );

        playChime?.();

        setIsScheduleModalOpen(false);
      }
    } catch (err) {
      console.error(err);

      addToast?.(
        'error',
        'Failed',
        'Unable to save automation.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (
    automationId,
    e
  ) => {
    e.stopPropagation();

    const confirmed = confirm(
      'Delete this automation?'
    );

    if (!confirmed) return;

    try {
      const res =
        await api.deleteLeadAutomation(
          automationId
        );

      if (res?.data?.success) {
        setAutomations((prev) =>
          prev.filter(
            (a) => a._id !== automationId
          )
        );

        addToast?.(
          'info',
          'Deleted',
          'Automation removed.'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------------------------- */
  /* LOADING */
  /* ---------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Loading
          </p>
        </div>
      </div>
    );
  }

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
                  <span className="material-symbols-outlined text-sm">
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
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />

                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                      {lead.first_name} {lead.last_name}
                    </span>
                  </div>
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
                  className={buttonSecondary}
                >
                  Next
                </button>

              </div>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-[18px] border border-red-300 bg-red-50 p-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
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
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />

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

                  return (
                    <div
                      key={dateObj.toISOString()}
                      onClick={() =>
                        openHistoryModal(
                          dateObj
                        )
                      }
                      className="group relative aspect-square cursor-pointer border-r border-b border-slate-200 bg-white transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:hover:bg-white/[0.03]"
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
                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-lg">
                          {
                            dayAutomations.length
                          }
                        </div>
                      )}

                      {/* LIST */}

                      <div className="flex h-full flex-col justify-end gap-1 p-3">

                        {dayAutomations
                          .slice(0, 2)
                          .map((auto) => (
                            <div
                              key={auto._id}
                              className="truncate rounded-[10px] bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-primary"
                            >
                              {getTemplateLabel(
                                auto.templateName
                              )}
                            </div>
                          ))}

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

                      {!isPast && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            openScheduleModal(
                              dateObj
                            );
                          }}
                          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white opacity-0 shadow-sm transition-all hover:border-primary hover:text-primary group-hover:opacity-100 dark:border-white/10 dark:bg-slate-900"
                        >
                          <span className="material-symbols-outlined text-base">
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

    <div className={`${cardClass} w-full max-w-lg overflow-hidden`}>

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 py-5">

        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Schedule Automation
          </h3>

          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            {selectedDate?.toLocaleDateString()}
          </p>
        </div>

        {/* CLOSE BUTTON */}

        <button
          onClick={() => setIsScheduleModalOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all hover:border-primary hover:text-primary dark:border-white/10"
        >
          <span className="material-symbols-outlined text-[18px]">
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
              {`${lead.first_name} ${lead.last_name}`.toUpperCase()}
            </div>

            <div className="text-sm text-slate-500">
              {lead.phone_number}
            </div>

          </div>
        )}

        {/* TEMPLATE */}

        <div>

          <label className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-slate-900/45 dark:text-slate-300/50">

            <span className="material-symbols-outlined text-[14px] text-primary">
              auto_awesome
            </span>

            Template

          </label>

          <select
            value={newAutomation.templateName}
            onChange={(e) =>
              setNewAutomation({
                ...newAutomation,
                templateName: e.target.value,
              })
            }
            className={inputClass}
          >

            <option
              value=""
              className="bg-white text-slate-900 dark:bg-[#111827] dark:text-white"
            >
              Select Template
            </option>

            {templates.map((t) => (
              <option
                key={t.id}
                value={t.id}
                className="bg-white text-slate-900 dark:bg-[#111827] dark:text-white"
              >
                {t.label}
              </option>
            ))}

          </select>

        </div>

        {/* PROJECT — removed: HIT projects no longer used */}

        {/* TIME */}

        <div>

          <label className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-slate-900/45 dark:text-slate-300/50">

            <span className="material-symbols-outlined text-[14px] text-primary">
              schedule
            </span>

            Time

          </label>

          <input
            type="time"
            value={newAutomation.time}
            onChange={(e) =>
              setNewAutomation({
                ...newAutomation,
                time: e.target.value,
              })
            }
            className={`${inputClass} dark:[color-scheme:dark]`}
          />

        </div>

      </div>

      {/* FOOTER */}

      <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-white/10 px-6 py-5">

        <button
          onClick={() =>
            setIsScheduleModalOpen(false)
          }
          className={buttonSecondary}
        >
          Cancel
        </button>

        <button
          disabled={isSaving}
          onClick={handleSaveAutomation}
          className={buttonPrimary}
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

    <div className={`${cardClass} w-full max-w-xl overflow-hidden`}>

      {/* HEADER */}

      <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 px-6 py-5">

        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Automation History
          </h3>

          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            {selectedHistoryDate?.toLocaleDateString()}
          </p>
        </div>

        {/* CLOSE BUTTON */}

        <button
          onClick={() => setIsHistoryModalOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <span className="material-symbols-outlined text-[20px]">
            close
          </span>
        </button>

      </div>

      {/* BODY */}

      <div className="max-h-[65vh] overflow-y-auto p-6">

        {getAutomationsForDate(
          selectedHistoryDate
        ).length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-slate-300 p-10 text-center dark:border-white/10">

            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-white/20">
              history
            </span>

            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              No history found
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {getAutomationsForDate(
              selectedHistoryDate
            ).map((auto) => (
              <div
                key={auto._id}
                className="flex items-center justify-between rounded-[16px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
              >

                <div>

                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {getTemplateLabel(
                      auto.templateName
                    )}
                  </div>

                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    {formatTime(
                      auto.scheduledAt
                    )}
                  </div>

                </div>

                <div className="flex items-center gap-3">

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${
                      auto.status === 'sent'
                        ? 'bg-green-100 text-green-700'
                        : auto.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {auto.status}
                  </span>

                  {auto.status === 'pending' && (
                    <button
                      onClick={(e) =>
                        handleDelete(
                          auto._id,
                          e
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-500 transition-all hover:bg-red-50"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                    </button>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>

  </div>
)}
      {/* USER PICKER */}

      {isUserPickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className={`${cardClass} w-full max-w-3xl overflow-hidden`}>

            <div className="border-b border-slate-200 dark:border-white/10 px-6 py-5">

              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
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
                        'error',
                        'Failed',
                        'Unable to open lead automation.'
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

                  <span className="material-symbols-outlined text-slate-400 transition-all group-hover:text-primary">
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
