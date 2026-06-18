import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { getStatusClasses, getStatusLabel } from '../utils/leadUtils';

/* -------------------------------------------------------------------------- */
/*                        ADS LEAD CARD — HELPER UTILS                        */
/* -------------------------------------------------------------------------- */

/** Build a compact automation summary string from a history array */
const buildAutomationSummary = (history = []) => {
  const calls    = history.filter((e) => e.type === 'call').length;
  const wa       = history.filter((e) => e.type === 'whatsapp').length;
  const emails   = history.filter((e) => e.type === 'email').length;

  const parts = [];
  if (calls  > 0) parts.push(`📞 ${calls} call${calls > 1 ? 's' : ''}`);
  if (wa     > 0) parts.push(`💬 WhatsApp sent`);
  if (emails > 0) parts.push(`📧 Email sent`);

  return parts.length > 0 ? parts.join(' · ') : null;
};

/** Icon + label for a single timeline event type */
const eventMeta = (type) => {
  switch (type) {
    case 'call':      return { icon: 'call',          label: 'Call',      color: 'text-blue-500',    bg: 'bg-blue-500/10'    };
    case 'whatsapp':  return { icon: 'chat',           label: 'WhatsApp',  color: 'text-green-500',   bg: 'bg-green-500/10'   };
    case 'email':     return { icon: 'mail',           label: 'Email',     color: 'text-purple-500',  bg: 'bg-purple-500/10'  };
    default:          return { icon: 'bolt',           label: type,        color: 'text-slate-500',   bg: 'bg-slate-500/10'   };
  }
};

/** Status chip colour */
const statusChipClass = (status) => {
  if (!status) return 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400';
  const s = status.toLowerCase();
  if (['completed', 'delivered', 'sent'].includes(s)) return 'bg-emerald-500/10 text-emerald-600';
  if (['failed', 'error'].includes(s))                 return 'bg-red-500/10 text-red-500';
  return 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400';
};

const CRMPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [leads, setLeads] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [activeTab, setActiveTab] = useState('site');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedAutomationGroup, setSelectedAutomationGroup] = useState(null);

  const itemsPerPage = 10;
  const debounceRef = useRef(null);

  const [leadTypeFilter, setLeadTypeFilter] = useState('ALL');

  /* Ads-lead-specific: expandable automation history */
  const [expandedLeadIds, setExpandedLeadIds] = useState(new Set());
  const [leadHistories, setLeadHistories]     = useState({});   // leadId → event[]
  const [historyLoading, setHistoryLoading]   = useState({});   // leadId → bool

  /* -------------------------------------------------------------------------- */
  /*                                   SEARCH                                   */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  /* -------------------------------------------------------------------------- */
  /*                                   FETCH                                    */
  /* -------------------------------------------------------------------------- */

  const fetchLeads = useCallback(async () => {
  try {
    if (!user) return;

    const params = {
      userId: user.id,
      role: user.role,
      limit: 200
    };

    const [leadsRes, automationsRes] = await Promise.all([
      api.getAllLeads(params),
      api.getCreatorAutomations(user.id)
    ]);

      const leadsData = leadsRes.data;

      setLeads(
        Array.isArray(leadsData)
          ? leadsData
          : (leadsData?.leads || [])
      );

      if (automationsRes.data?.success) {
        setAutomations(automationsRes.data.data);
      }
    } catch (err) {
    console.error('Failed to fetch CRM data:', err);
  } finally {
    setLoading(false);
  }
}, [user]);

useEffect(() => {
  if (user) {
    fetchLeads();
  }
}, [user, fetchLeads]);

useEffect(() => {
  setCurrentPage(1);
  setSelectedAutomationGroup(null);
}, [debouncedSearch, activeTab, leadTypeFilter]);

/* -------------------------------------------------------------------------- */
/*                       ADS LEAD — EXPAND / COLLAPSE                        */
/* -------------------------------------------------------------------------- */

  const toggleLeadHistory = useCallback(async (leadId) => {
    setExpandedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });

    // Fetch only once per lead
    if (leadHistories[leadId] !== undefined) return;

    setHistoryLoading((prev) => ({ ...prev, [leadId]: true }));
    try {
      const res = await api.getLeadAutomationHistory(leadId);
      const events = Array.isArray(res.data)
        ? res.data
        : (res.data?.data || res.data?.events || []);
      setLeadHistories((prev) => ({ ...prev, [leadId]: events }));
    } catch {
      setLeadHistories((prev) => ({ ...prev, [leadId]: [] }));
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [leadId]: false }));
    }
  }, [leadHistories]);

/* -------------------------------------------------------------------------- */
/*                                   FILTERS                                  */
/* -------------------------------------------------------------------------- */

const filteredLeads = useMemo(() => {
  return leads.filter((lead) => {
    const isAdsLead = ['facebook', 'google'].includes(lead.source);

    /* ------------------------------- TAB FILTER ------------------------------ */

    if (activeTab === 'automation') return false;

    if (activeTab === 'ads' && !isAdsLead) {
      return false;
    }

    if (activeTab === 'site' && isAdsLead) {
      return false;
    }

    /* ---------------------------- LEAD TYPE FILTER --------------------------- */

    if (leadTypeFilter !== 'ALL') {
      const leadStatus = getStatusLabel(
        lead.score,
        lead.status
      );

      if (leadStatus !== leadTypeFilter) {
        return false;
      }
    }

    return true;
  });
}, [leads, activeTab, leadTypeFilter]);

const searchFilteredLeads = useMemo(() => {
  const term = debouncedSearch.toLowerCase();

  return filteredLeads.filter((lead) => {
    const name =
      `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase();

    const phone = (lead.phone_number || '').toLowerCase();

    return (
      name.includes(term) ||
      phone.includes(term)
    );
  });
}, [filteredLeads, debouncedSearch]);

  /* -------------------------------------------------------------------------- */
  /*                              AUTOMATION GROUPS                             */
  /* -------------------------------------------------------------------------- */

  const groupedAutomations = useMemo(() => {
    const groupsMap = {};

    automations.forEach((auto) => {
      if (!groupsMap[auto.leadId]) {
        groupsMap[auto.leadId] = {
          leadId: auto.leadId,
          leadName: auto.leadName,
          automations: []
        };

        const matchingLead = leads.find((l) => l.id === auto.leadId);

        if (matchingLead) {
          groupsMap[auto.leadId].phone_number = matchingLead.phone_number;
          groupsMap[auto.leadId].createdAt = matchingLead.createdAt;
        }
      }

      groupsMap[auto.leadId].automations.push(auto);
    });

    return Object.values(groupsMap).sort((a, b) => {
      const latestA = Math.max(
        ...a.automations.map((x) => new Date(x.scheduledAt).getTime())
      );

      const latestB = Math.max(
        ...b.automations.map((x) => new Date(x.scheduledAt).getTime())
      );

      return latestB - latestA;
    });
  }, [automations, leads]);

  const searchFilteredAutomations = useMemo(() => {
    const term = debouncedSearch.toLowerCase();

    return groupedAutomations.filter((group) => {
      const name = (group.leadName || '').toLowerCase();
      const phone = (group.phone_number || '').toLowerCase();

      return name.includes(term) || phone.includes(term);
    });
  }, [groupedAutomations, debouncedSearch]);

  /* -------------------------------------------------------------------------- */
  /*                                 PAGINATION                                 */
  /* -------------------------------------------------------------------------- */

  const activeList =
    activeTab === 'automation'
      ? searchFilteredAutomations
      : searchFilteredLeads;

  const totalItems = activeList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedItems = activeList.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  /* -------------------------------------------------------------------------- */
  /*                                   LOADER                                   */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Verifying CRM records...
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      <div className="animate-fade-in pb-10 font-display text-slate-900 dark:text-slate-100">
        {/* ------------------------------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------------------------------ */}

        <div
          className="
            mb-5
            overflow-hidden
            rounded-[26px]
            border
            border-slate-200/70
            bg-white/80
            p-4
            shadow-sm
            backdrop-blur-xl
            transition-colors
            duration-300

            dark:border-white/10
            dark:bg-white/[0.03]
          "
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                {/* <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-2xl
                    bg-primary/10
                    text-primary
                  "
                >
                  <span className="material-symbols-outlined text-[20px]">
                    hub
                  </span>
                </div> */}

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                    Workspace
                  </p>

                  <h1 className="text-xl font-black tracking-tight">
                    Lead CRM
                  </h1>
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage leads, automations, and follow-up records.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-[320px]">
              <span
                className="
                  material-symbols-outlined
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-[18px]
                  text-slate-400
                "
              >
                search
              </span>

              <input
                type="text"
                placeholder="Search lead name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  h-12
                  w-full
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  pl-12
                  pr-4
                  text-sm
                  font-medium
                  outline-none
                  transition-all

                  focus:border-primary
                  focus:bg-white

                  dark:border-white/10
                  dark:bg-white/[0.04]
                  dark:text-white
                  dark:placeholder:text-slate-500
                  dark:focus:bg-white/[0.06]
                "
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TABS */}
        {/* ------------------------------------------------------------------ */}

        <div
          className="
            mb-5
            flex
            rounded-[22px]
            border
            border-slate-200/70
            bg-white/70
            p-1
            backdrop-blur-xl

            dark:border-white/10
            dark:bg-white/[0.03]
          "
        >
          {[
            {
              id: 'site',
              label: 'Site Leads',
              icon: 'language',
              active:
                'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
            },
            {
              id: 'ads',
              label: 'Ads Leads',
              icon: 'campaign',
              active: 'bg-primary text-white'
            },
            {
              id: 'automation',
              label: 'Automation',
              icon: 'bolt',
              active: 'bg-emerald-500 text-white'
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`
                flex
                flex-1
                items-center
                justify-center
                gap-2
                rounded-[16px]
                px-4
                py-3
                text-[11px]
                font-black
                uppercase
                tracking-[0.18em]
                transition-all
                duration-300

                ${
                  activeTab === tab.id
                    ? tab.active
                    : `
                      text-slate-500
                      hover:bg-slate-100
                      hover:text-slate-900

                      dark:text-slate-400
                      dark:hover:bg-white/[0.05]
                      dark:hover:text-white
                    `
                }
              `}
            >
              <span className="material-symbols-outlined text-[16px]">
                {tab.icon}
              </span>

              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* LEAD TYPE FILTERS */}
        {/* ------------------------------------------------------------------ */}

        {activeTab !== 'automation' && (
          <div
            className="
              mb-5
              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            {[
              {
                label: 'All',
                value: 'ALL',
                active:
                  'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              },
              {
                label: 'Hot',
                value: 'HOT',
                active: 'bg-red-500 text-white'
              },
              {
                label: 'Warm',
                value: 'WARM',
                active: 'bg-orange-500 text-white'
              },
              {
                label: 'Cold',
                value: 'COLD',
                active: 'bg-emerald-500 text-white'
              }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setLeadTypeFilter(filter.value);
                  setCurrentPage(1);
                }}
                className={`
                  rounded-2xl
                  px-4
                  py-2.5
                  text-[11px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  transition-all
                  duration-300

                  ${
                    leadTypeFilter === filter.value
                      ? filter.active
                      : `
                        border
                        border-slate-200
                        bg-white
                        text-slate-600

                        hover:border-primary/30
                        hover:text-primary

                        dark:border-white/10
                        dark:bg-white/[0.03]
                        dark:text-slate-400
                      `
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* LIST */}
        {/* ------------------------------------------------------------------ */}

        {paginatedItems.length === 0 ? (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              rounded-[28px]
              border
              border-dashed
              border-slate-300
              bg-white/60
              px-6
              py-20
              text-center
              backdrop-blur-xl

              dark:border-white/10
              dark:bg-white/[0.03]
            "
          >
            <div
              className="
                mb-5
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                bg-slate-100

                dark:bg-white/[0.04]
              "
            >
              <span className="material-symbols-outlined text-[36px] text-slate-400">
                inventory_2
              </span>
            </div>

            <h3 className="text-lg font-black tracking-tight">
              No Records Found
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try changing your search or selected category.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedItems.map((item) => {
              /* ------------------------------------------------------------ */
              /* AUTOMATION CARD */
              /* ------------------------------------------------------------ */

              if (activeTab === 'automation') {
                const group = item;

                return (
                  <div
                    key={group.leadId}
                    className="
                      rounded-[24px]
                      border
                      border-slate-200/70
                      bg-white/80
                      p-5
                      shadow-sm
                      backdrop-blur-xl
                      transition-all
                      duration-300

                      hover:border-emerald-500/40
                      hover:shadow-lg

                      dark:border-white/10
                      dark:bg-white/[0.03]
                    "
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div
                          className="
                            flex
                            h-12
                            w-12
                            shrink-0
                            items-center
                            justify-center
                            rounded-2xl
                            bg-emerald-500/10
                            text-emerald-500
                          "
                        >
                          <span className="material-symbols-outlined">
                            quick_reference_all
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-black tracking-tight">
                              {group.leadName || 'Unknown Lead'}
                            </h3>

                            <span
                              className="
                                rounded-full
                                bg-emerald-500/10
                                px-2.5
                                py-1
                                text-[10px]
                                font-black
                                uppercase
                                tracking-[0.2em]
                                text-emerald-500
                              "
                            >
                              {group.automations.length} Sent
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <span>{group.phone_number}</span>
                            <span>•</span>
                            <span>Automation Records</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            navigate(`/lead-automation/${group.leadId}`)
                          }
                          className="
                            rounded-2xl
                            bg-emerald-500
                            px-5
                            py-3
                            text-[11px]
                            font-black
                            uppercase
                            tracking-[0.18em]
                            text-white
                            transition-all
                            hover:scale-[1.02]
                            hover:bg-emerald-600
                          "
                        >
                          Manage
                        </button>

                        <button
                          onClick={() =>
                            setSelectedAutomationGroup(group)
                          }
                          className="
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            px-5
                            py-3
                            text-[11px]
                            font-black
                            uppercase
                            tracking-[0.18em]
                            transition-all

                            hover:border-slate-300
                            hover:bg-slate-100

                            dark:border-white/10
                            dark:bg-white/[0.04]
                            dark:hover:bg-white/[0.08]
                          "
                        >
                          History
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              /* ------------------------------------------------------------ */
              /* LEAD CARD — SITE TAB                                         */
              /* ------------------------------------------------------------ */

              if (activeTab !== 'ads') {
                const lead = item;

                return (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/lead/${lead.id}`)}
                    className="
                      group
                      cursor-pointer
                      rounded-[24px]
                      border
                      border-slate-200/70
                      bg-white/80
                      p-5
                      shadow-sm
                      backdrop-blur-xl
                      transition-all
                      duration-300

                      hover:-translate-y-0.5
                      hover:border-primary/40
                      hover:shadow-lg

                      dark:border-white/10
                      dark:bg-white/[0.03]
                    "
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div
                          className="
                            flex
                            h-12
                            w-12
                            shrink-0
                            items-center
                            justify-center
                            rounded-2xl
                            bg-slate-100
                            text-slate-600
                            transition-all
                            group-hover:bg-primary/10
                            group-hover:text-primary

                            dark:bg-white/[0.04]
                            dark:text-slate-300
                          "
                        >
                          <span className="material-symbols-outlined">
                            assignment_turned_in
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black tracking-tight">
                            {lead.first_name} {lead.last_name}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <span>{lead.phone_number}</span>

                            <span>•</span>

                            <span>
                              {new Date(
                                lead.createdAt || Date.now()
                              ).toLocaleDateString()}
                            </span>

                            {user?.role === 'admin' &&
                              lead.createdBy?.name && (
                                <>
                                  <span>•</span>

                                  <span
                                    className="
                                      rounded-full
                                      bg-primary/10
                                      px-2
                                      py-1
                                      text-[10px]
                                      font-black
                                      uppercase
                                      tracking-[0.18em]
                                      text-primary
                                    "
                                  >
                                    {lead.createdBy.name}
                                  </span>
                                </>
                              )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/lead-automation/${lead.id}`);
                          }}
                          className="
                            flex
                            items-center
                            gap-2
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-3
                            text-[11px]
                            font-black
                            uppercase
                            tracking-[0.16em]
                            transition-all

                            hover:border-primary
                            hover:bg-primary
                            hover:text-white

                            dark:border-white/10
                            dark:bg-white/[0.04]
                            dark:hover:bg-primary
                          "
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            calendar_month
                          </span>

                          Automation
                        </button>

                        <div
                          className={`
                            rounded-2xl
                            border
                            px-4
                            py-3
                            text-[11px]
                            font-black
                            uppercase
                            tracking-[0.16em]
                            ${getStatusClasses(
                              lead.score,
                              lead.status
                            )}
                          `}
                        >
                          {getStatusLabel(
                            lead.score,
                            lead.status
                          )}{' '}
                          ({lead.score}%)
                        </div>

                        <span
                          className="
                            material-symbols-outlined
                            text-slate-400
                            transition-all
                            duration-300
                            group-hover:translate-x-1
                            group-hover:text-primary
                          "
                        >
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              /* ------------------------------------------------------------ */
              /* ADS LEAD CARD — ENHANCED                                      */
              /* ------------------------------------------------------------ */

              const lead           = item;
              const isExpanded     = expandedLeadIds.has(lead.id);
              const history        = leadHistories[lead.id] || [];
              const isLoadingHist  = historyLoading[lead.id] === true;
              const hasFetched     = leadHistories[lead.id] !== undefined;

              // Compute automation summary from already-fetched history
              const summaryLine    = hasFetched ? buildAutomationSummary(history) : null;

              const campaignName   = lead.metadata?.campaignName || lead.metadata?.campaignId || null;
              const formName       = lead.metadata?.formName || null;

              return (
                <div
                  key={lead.id}
                  className="
                    rounded-[24px]
                    border
                    border-slate-200/70
                    bg-white/80
                    shadow-sm
                    backdrop-blur-xl
                    transition-all
                    duration-300

                    hover:border-primary/30
                    hover:shadow-lg

                    dark:border-white/10
                    dark:bg-white/[0.03]
                  "
                >
                  {/* ---- Top row (always visible) ---- */}
                  <div
                    className="flex cursor-pointer flex-col gap-4 p-5 xl:flex-row xl:items-start xl:justify-between"
                    onClick={() => navigate(`/lead/${lead.id}`)}
                  >
                    {/* Left: avatar + info */}
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className="
                          flex
                          h-12
                          w-12
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl
                          bg-primary/10
                          text-primary
                        "
                      >
                        <span className="material-symbols-outlined">campaign</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Name */}
                        <h3 className="truncate text-lg font-black tracking-tight">
                          {lead.first_name} {lead.last_name}
                        </h3>

                        {/* Phone · Date · Created by */}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <span>{lead.phone_number}</span>
                          <span>•</span>
                          <span>
                            {new Date(lead.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                          {user?.role === 'admin' && lead.createdBy?.name && (
                            <>
                              <span>•</span>
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                                {lead.createdBy.name}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Campaign · Form tags */}
                        {(campaignName || formName) && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {campaignName && (
                              <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined text-[12px]">campaign</span>
                                {campaignName}
                              </span>
                            )}
                            {formName && (
                              <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                                <span className="material-symbols-outlined text-[12px]">description</span>
                                {formName}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Automation summary (shown once loaded) */}
                        {summaryLine && (
                          <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {summaryLine}
                          </p>
                        )}
                        {hasFetched && !summaryLine && (
                          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                            No automation activity yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: status badge + action buttons */}
                    <div
                      className="flex flex-wrap items-center gap-3 xl:shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Score + status badge */}
                      <div
                        className={`
                          rounded-2xl
                          border
                          px-4
                          py-3
                          text-[11px]
                          font-black
                          uppercase
                          tracking-[0.16em]
                          ${getStatusClasses(lead.score, lead.status)}
                        `}
                      >
                        {getStatusLabel(lead.score, lead.status)} ({lead.score}%)
                      </div>

                      {/* Automation page button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lead-automation/${lead.id}`);
                        }}
                        className="
                          flex
                          items-center
                          gap-2
                          rounded-2xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-3
                          text-[11px]
                          font-black
                          uppercase
                          tracking-[0.16em]
                          transition-all

                          hover:border-primary
                          hover:bg-primary
                          hover:text-white

                          dark:border-white/10
                          dark:bg-white/[0.04]
                          dark:hover:bg-primary
                        "
                      >
                        <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                        Automation
                      </button>

                      {/* Expand / collapse history button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLeadHistory(lead.id);
                        }}
                        className={`
                          flex
                          items-center
                          gap-2
                          rounded-2xl
                          border
                          px-4
                          py-3
                          text-[11px]
                          font-black
                          uppercase
                          tracking-[0.16em]
                          transition-all

                          ${
                            isExpanded
                              ? 'border-primary bg-primary text-white'
                              : `
                                border-slate-200
                                bg-white
                                text-slate-700
                                hover:border-primary/50
                                hover:text-primary

                                dark:border-white/10
                                dark:bg-white/[0.04]
                                dark:text-slate-300
                              `
                          }
                        `}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isExpanded ? 'expand_less' : 'history'}
                        </span>
                        {isExpanded ? 'Collapse' : 'History'}
                      </button>
                    </div>
                  </div>

                  {/* ---- Expanded history timeline ---- */}
                  {isExpanded && (
                    <div
                      className="
                        border-t
                        border-slate-200/70
                        px-5
                        pb-5
                        pt-4

                        dark:border-white/10
                      "
                    >
                      {isLoadingHist ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
                        </div>
                      ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-200 py-10 dark:border-white/10">
                          <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600">
                            history
                          </span>
                          <p className="mt-3 text-sm font-semibold text-slate-400 dark:text-slate-500">
                            No automation history yet
                          </p>
                        </div>
                      ) : (
                        <div className="relative space-y-3 pl-6">
                          {/* vertical line */}
                          <div className="absolute left-[9px] top-0 h-full w-[2px] rounded-full bg-slate-200 dark:bg-white/10" />

                          {history.map((event, idx) => {
                            const meta = eventMeta(event.type);
                            return (
                              <div key={idx} className="relative flex items-start gap-4">
                                {/* dot */}
                                <div
                                  className={`
                                    absolute
                                    -left-[17px]
                                    top-3
                                    flex
                                    h-5
                                    w-5
                                    items-center
                                    justify-center
                                    rounded-full
                                    border-2
                                    border-white
                                    dark:border-[#0b0f19]

                                    ${meta.bg}
                                  `}
                                >
                                  <span className={`material-symbols-outlined text-[11px] ${meta.color}`}>
                                    {meta.icon}
                                  </span>
                                </div>

                                <div
                                  className="
                                    flex-1
                                    rounded-[18px]
                                    border
                                    border-slate-200/70
                                    bg-slate-50/80
                                    p-4

                                    dark:border-white/10
                                    dark:bg-white/[0.03]
                                  "
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${meta.color}`}>
                                        {meta.label}
                                      </span>
                                      {event.status && (
                                        <span
                                          className={`
                                            rounded-full
                                            px-2
                                            py-0.5
                                            text-[10px]
                                            font-black
                                            uppercase
                                            tracking-[0.15em]
                                            ${statusChipClass(event.status)}
                                          `}
                                        >
                                          {event.status}
                                        </span>
                                      )}
                                    </div>
                                    {event.timestamp && (
                                      <span className="text-[11px] text-slate-400">
                                        {new Date(event.timestamp).toLocaleString()}
                                      </span>
                                    )}
                                  </div>

                                  {/* Event-specific detail line */}
                                  {event.type === 'call' && (
                                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                                      {event.duration != null && (
                                        <span>⏱ {event.duration}s</span>
                                      )}
                                      {event.transcript && (
                                        <details className="w-full">
                                          <summary className="cursor-pointer select-none font-semibold text-primary">
                                            View transcript
                                          </summary>
                                          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-3 text-[11px] leading-relaxed dark:bg-white/[0.04]">
                                            {event.transcript}
                                          </p>
                                        </details>
                                      )}
                                    </div>
                                  )}

                                  {event.type === 'whatsapp' && event.templateName && (
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                      Template: <span className="font-semibold">{event.templateName}</span>
                                    </p>
                                  )}

                                  {event.type === 'email' && event.subject && (
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                      Subject: <span className="font-semibold">{event.subject}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PAGINATION */}
        {/* ------------------------------------------------------------------ */}

        {totalPages > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              }
              disabled={currentPage === 1}
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-5
                py-3
                text-[11px]
                font-black
                uppercase
                tracking-[0.18em]
                transition-all

                hover:bg-slate-100

                disabled:cursor-not-allowed
                disabled:opacity-40

                dark:border-white/10
                dark:bg-white/[0.04]
                dark:hover:bg-white/[0.08]
              "
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(
                Math.max(currentPage - 3, 0),
                Math.max(currentPage - 3, 0) + 5
              )
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`
                    h-11
                    w-11
                    rounded-2xl
                    text-[11px]
                    font-black
                    transition-all

                    ${
                      currentPage === page
                        ? activeTab === 'ads'
                          ? 'bg-primary text-white'
                          : activeTab === 'automation'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : `
                          border
                          border-slate-200
                          bg-white
                          hover:bg-slate-100

                          dark:border-white/10
                          dark:bg-white/[0.04]
                          dark:hover:bg-white/[0.08]
                        `
                    }
                  `}
                >
                  {page}
                </button>
              ))}

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, totalPages)
                )
              }
              disabled={currentPage === totalPages}
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-5
                py-3
                text-[11px]
                font-black
                uppercase
                tracking-[0.18em]
                transition-all

                hover:bg-slate-100

                disabled:cursor-not-allowed
                disabled:opacity-40

                dark:border-white/10
                dark:bg-white/[0.04]
                dark:hover:bg-white/[0.08]
              "
            >
              Next
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* FOOTER STATS */}
        {/* ------------------------------------------------------------------ */}

        <div
          className="
            mt-8
            flex
            flex-col
            gap-4
            rounded-[24px]
            border
            border-slate-200/70
            bg-white/70
            p-5
            backdrop-blur-xl

            sm:flex-row
            sm:items-center
            sm:justify-between

            dark:border-white/10
            dark:bg-white/[0.03]
          "
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Total Records
            </p>

            <h3 className="mt-1 text-2xl font-black tracking-tight">
              {filteredLeads.length}
            </h3>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Navigation
            </p>

            <h3 className="mt-1 text-lg font-black tracking-tight">
              Page {currentPage} / {totalPages}
            </h3>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL */}
      {/* -------------------------------------------------------------------- */}

      {selectedAutomationGroup && (
        <div
          className="
            fixed
            inset-0
            z-[120]
            flex
            items-center
            justify-center
            bg-black/60
            p-4
            backdrop-blur-md
          "
        >
          <div
            className="
              flex
              max-h-[90vh]
              w-full
              max-w-3xl
              flex-col
              overflow-hidden
              rounded-[32px]
              border
              border-slate-200/70
              bg-white
              shadow-2xl

              dark:border-white/10
              dark:bg-[#0b0f19]
            "
          >
            {/* Header */}
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-200
                p-6

                dark:border-white/10
              "
            >
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight">
                    {selectedAutomationGroup.leadName}
                  </h2>

                  <span
                    className="
                      rounded-full
                      bg-emerald-500/10
                      px-2.5
                      py-1
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.2em]
                      text-emerald-500
                    "
                  >
                    Live
                  </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedAutomationGroup.phone_number}
                </p>
              </div>

              <button
                onClick={() => setSelectedAutomationGroup(null)}
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-slate-200
                  transition-all
                  hover:bg-red-500
                  hover:text-white

                  dark:border-white/10
                  dark:hover:border-red-500
                "
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedAutomationGroup.automations.map((auto) => (
                  <div
                    key={auto._id || auto.id}
                    className="
                      rounded-[24px]
                      border
                      border-slate-200/70
                      bg-slate-50
                      p-5

                      dark:border-white/10
                      dark:bg-white/[0.03]
                    "
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`
                            flex
                            h-12
                            w-12
                            items-center
                            justify-center
                            rounded-2xl

                            ${
                              auto.status === 'sent'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : auto.status === 'failed'
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-slate-200 text-slate-500 dark:bg-white/10'
                            }
                          `}
                        >
                          <span className="material-symbols-outlined">
                            {auto.status === 'sent'
                              ? 'done_all'
                              : auto.status === 'failed'
                              ? 'error'
                              : 'schedule'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wide">
                            {auto.templateName.replace(/_/g, ' ')}
                          </h3>

                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {new Date(
                              auto.scheduledAt
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Opened
                          </p>

                          <p
                            className={`
                              mt-1
                              text-sm
                              font-black

                              ${
                                auto.linkActivity?.opened
                                  ? 'text-emerald-500'
                                  : 'text-slate-400'
                              }
                            `}
                          >
                            {auto.linkActivity?.opened
                              ? 'Yes'
                              : 'No'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Duration
                          </p>

                          <p className="mt-1 text-sm font-black">
                            {auto.linkActivity?.timeSpentSeconds
                              ? auto.linkActivity.timeSpentSeconds >= 60
                                ? `${Math.floor(
                                    auto.linkActivity
                                      .timeSpentSeconds / 60
                                  )}m`
                                : `${auto.linkActivity.timeSpentSeconds}s`
                              : '0s'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              className="
                flex
                justify-end
                gap-3
                border-t
                border-slate-200
                p-5

                dark:border-white/10
              "
            >
              <button
                onClick={() => {
                  navigate(
                    `/lead-automation/${selectedAutomationGroup.leadId}`
                  );

                  setSelectedAutomationGroup(null);
                }}
                className="
                  rounded-2xl
                  bg-slate-900
                  px-5
                  py-3
                  text-[11px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-white
                  transition-all
                  hover:bg-emerald-500

                  dark:bg-white
                  dark:text-slate-900
                "
              >
                New Automation
              </button>

              <button
                onClick={() => setSelectedAutomationGroup(null)}
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  px-5
                  py-3
                  text-[11px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  transition-all
                  hover:bg-slate-100

                  dark:border-white/10
                  dark:hover:bg-white/[0.08]
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CRMPage;