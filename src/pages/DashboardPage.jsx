import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { syncIntegrationStatus } from '../api';

const THEME_STORAGE_KEY = 'hit-landing-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/* ---------------------------------- */
/* Main Component */
/* ---------------------------------- */

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [theme] = useState(getInitialTheme);
  const isDark = theme === 'dark';

  // Data states
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState({ leads: [], total: 0 });
  const [campaigns, setCampaigns] = useState({ campaigns: [], total: 0 });
  const [conversations, setConversations] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [manualForm, setManualForm] = useState({ name: '', phone: '' });
  const [file, setFile] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState('');

  // Integration sync state
  const [syncData, setSyncData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState(null);

  /* -------------------- */
  /* FETCH ALL DATA */
  /* -------------------- */

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = { userId: user.id, role: user.role };

    try {
      const [usersRes, leadsRes, campaignsRes, chatsRes, callsRes, automationsRes] =
        await Promise.allSettled([
          api.getAllUsers(params),
          api.getAllLeads({ ...params, limit: 5 }),
          api.listCampaigns(params),
          api.getChatConversations(),
          api.getCallLogs(params),
          api.getCreatorAutomations(user.id),
        ]);

      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || []);
      if (leadsRes.status === 'fulfilled') setLeads(leadsRes.value.data || { leads: [], total: 0 });
      if (campaignsRes.status === 'fulfilled') setCampaigns(campaignsRes.value.data || { campaigns: [], total: 0 });
      if (chatsRes.status === 'fulfilled') {
        const chatData = chatsRes.value.data;
        // Handle both paginated response { success, data: [...] } and flat array
        setConversations(Array.isArray(chatData) ? chatData : (chatData?.data || []));
      }
      if (callsRes.status === 'fulfilled') setCallLogs(callsRes.value.data?.logs || callsRes.value.data || []);
      if (automationsRes.status === 'fulfilled') setAutomations(automationsRes.value.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await syncIntegrationStatus();
      if (res.data.success) {
        setSyncData(res.data.integrations);
        setSyncedAt(new Date(res.data.synced_at));
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  }, []);

  /* -------------------- */
  /* DERIVED DATA */
  /* -------------------- */

  const totalLeads = leads.total || 0;
  const activeCampaigns = Array.isArray(campaigns.campaigns)
    ? campaigns.campaigns.filter((c) => c.status === 'active').length
    : 0;
  const totalCampaigns = campaigns.total || 0;
  const unreadChats = Array.isArray(conversations)
    ? conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    : 0;
  const recentLeads = Array.isArray(leads.leads) ? leads.leads.slice(0, 5) : [];
  const pendingAutomations = Array.isArray(automations)
    ? automations.filter((a) => a.status === 'pending').length
    : 0;
  const totalCalls = Array.isArray(callLogs) ? callLogs.length : 0;

  /* -------------------- */
  /* FORM HANDLERS */
  /* -------------------- */

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    setError('');
    try {
      const creatorData = user ? { userId: user.id, role: user.role, name: user.name } : null;
      await api.createUser({ ...manualForm, createdBy: creatorData });
      setManualForm({ name: '', phone: '' });
      await fetchDashboardData();
      navigate('/users');
    } catch (err) {
      console.error(err);
      setError('Failed to add user.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setFileLoading(true);
    setError('');
    try {
      const creatorData = user ? { userId: user.id, role: user.role, name: user.name } : null;
      await api.uploadUser(file, creatorData);
      setFile(null);
      await fetchDashboardData();
      navigate('/users');
    } catch (err) {
      console.error(err);
      setError('Failed to process document.');
    } finally {
      setFileLoading(false);
    }
  };

  /* -------------------- */
  /* HELPERS */
  /* -------------------- */

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`relative animate-fade-in font-display pb-10 transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 landing-gradient-mesh opacity-10 dark:opacity-25" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 landing-grid-bg opacity-10 dark:opacity-30" aria-hidden />

      <div className="min-h-[50vh] bg-transparent text-slate-900 dark:text-slate-100 transition-colors duration-300">

        {/* Header */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-white/10 backdrop-blur-xl p-4 sm:p-5 mb-6 shadow-sm rounded-[18px]">
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Welcome{user?.name ? `, ${user.name}` : ''}
              </h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600/70 dark:text-slate-300/70">
                Your system at a glance
              </p>
            </div>
            <div className="mt-3 sm:mt-0 flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: 'groups', label: 'People', value: loading ? '...' : users.length, path: '/users' },
              { icon: 'contact_page', label: 'Leads', value: loading ? '...' : totalLeads, path: '/crm' },
              { icon: 'campaign', label: 'Campaigns', value: loading ? '...' : `${activeCampaigns}/${totalCampaigns}`, path: '/campaigns' },
              { icon: 'chat', label: 'Unread Chats', value: loading ? '...' : unreadChats, path: '/chat' },
              { icon: 'call', label: 'Calls', value: loading ? '...' : totalCalls, path: '/call-logs' },
              { icon: 'schedule_send', label: 'Pending Auto', value: loading ? '...' : pendingAutomations, path: '/lead-automation' },
            ].map((stat) => (
              <div
                key={stat.label}
                onClick={() => navigate(stat.path)}
                role="button"
                tabIndex={0}
                className="flex flex-col items-center justify-center bg-white/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 rounded-[14px] p-3 shadow-sm hover:shadow-md hover:-translate-y-px transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-xl mb-1">{stat.icon}</span>
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{stat.value}</span>
                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Main Grid: Add People + Recent Leads */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-6">

        {/* ── Integration Sync Panel ─────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-6">
          <div className="bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-[18px] shadow-sm overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">sync</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Integration Status</span>
                {syncedAt && (
                  <span className="text-[9px] text-slate-400 ml-1">· synced {timeAgo(syncedAt)}</span>
                )}
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] hover:brightness-110 disabled:opacity-50 transition-all"
              >
                <span className={`material-symbols-outlined text-sm ${syncing ? 'animate-spin' : ''}`}>sync</span>
                {syncing ? 'Syncing…' : 'Sync All'}
              </button>
            </div>

            {/* Integration cards */}
            {!syncData && !syncing && (
              <div className="px-5 py-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Click Sync All to check live status of all your integrations</p>
              </div>
            )}

            {syncing && !syncData && (
              <div className="px-5 py-5 flex items-center justify-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Checking integrations…</p>
              </div>
            )}

            {syncData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-white/[0.06]">
                {/* WhatsApp */}
                {(() => {
                  const wa = syncData.whatsapp;
                  const ok = wa.connected && wa.tokenValid && wa.metaStatus !== 'TOKEN_EXPIRED';
                  const warn = wa.connected && (!wa.tokenValid || wa.metaStatus === 'TOKEN_EXPIRED');
                  return (
                    <div
                      className="flex flex-col gap-2 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                      onClick={() => navigate('/whatsapp-setup')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-[8px] bg-[#25D366]/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#25D366] text-base">chat</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : warn ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                        }`}>
                          {ok ? 'OK' : warn ? 'Fix needed' : 'Not connected'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">WhatsApp</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {ok ? `${wa.displayNumber || 'Connected'} · ${wa.metaStatus || 'Active'}` :
                         warn ? 'Token invalid — re-connect' : 'No number connected'}
                      </p>
                    </div>
                  );
                })()}

                {/* Facebook */}
                {(() => {
                  const fb = syncData.facebook;
                  const ok = fb.connected && fb.tokenValid;
                  const warn = fb.connected && (!fb.tokenValid || fb.tokenExpired);
                  return (
                    <div
                      className="flex flex-col gap-2 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                      onClick={() => navigate('/integrations/facebook')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-[8px] bg-blue-600/10 flex items-center justify-center">
                          <span className="text-sm font-black text-blue-600">f</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : warn ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                        }`}>
                          {ok ? 'OK' : warn ? 'Token expired' : 'Not connected'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">Facebook</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {ok ? `${fb.pageName || 'Connected'} · ${fb.pageCount} page${fb.pageCount !== 1 ? 's' : ''}` :
                         warn ? 'Token expired — reconnect FB' : 'No Facebook account connected'}
                      </p>
                    </div>
                  );
                })()}

                {/* Email */}
                {(() => {
                  const em = syncData.email;
                  const ok = em.connected && em.healthy;
                  const warn = em.connected && !em.healthy;
                  return (
                    <div
                      className="flex flex-col gap-2 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                      onClick={() => navigate('/integrations')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-[8px] bg-violet-500/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-violet-500 text-base">mail</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : warn ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                        }`}>
                          {ok ? 'OK' : warn ? 'Revoked' : 'Not connected'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">Email</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {ok ? `${em.email || ''} · ${em.provider || ''}` :
                         warn ? 'Token revoked — re-auth' : 'Gmail / Outlook not connected'}
                      </p>
                    </div>
                  );
                })()}

                {/* AI Voice */}
                {(() => {
                  const v = syncData.voice;
                  const ok = v.configured;
                  return (
                    <div
                      className="flex flex-col gap-2 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                      onClick={() => navigate('/call-logs')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-base">record_voice_over</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                             : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                        }`}>
                          {ok ? 'Configured' : 'Default'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">AI Voice</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {ok
                          ? `${v.agentName || 'Agent'} · ${v.sector} · ${v.documentsCount} doc${v.documentsCount !== 1 ? 's' : ''}`
                          : 'Using default settings'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </section>

        {/* Main Grid: Add People + Recent Leads */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left: Add People (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-base">add_circle</span>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600/60 dark:text-slate-300/60">Add People</h2>
              </div>

              {/* Manual Entry */}
              <form onSubmit={handleManualSubmit} className="bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-[16px] p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-base">person_add</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Manual Entry</span>
                </div>
                <div className="space-y-2">
                  <input type="text" placeholder="Full name" value={manualForm.name} onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })} required className="w-full p-2.5 bg-white/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[10px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all text-sm" />
                  <input type="tel" placeholder="Phone number" value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} required className="w-full p-2.5 bg-white/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[10px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all text-sm" />
                  <button type="submit" disabled={manualLoading} className="w-full bg-primary text-white py-2.5 rounded-[10px] font-black uppercase tracking-[0.15em] text-[9px] hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {manualLoading ? 'ADDING...' : 'ADD'}
                  </button>
                </div>
              </form>

              {/* Import File */}
              <form onSubmit={handleFileUpload} className="bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-[16px] p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-[8px] bg-blue-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-500 text-base">upload_file</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Import File</span>
                  <span className="text-[8px] font-bold text-slate-400 ml-auto uppercase">DOCX / XLSX / CSV</span>
                </div>
                <div className={`relative border border-dashed rounded-[10px] p-4 transition-all ${file ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-300 dark:border-white/10'}`}>
                  <input type="file" accept=".docx,.xlsx,.csv" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex items-center justify-center gap-2">
                    <span className={`material-symbols-outlined text-xl ${file ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {file ? 'task_alt' : 'cloud_upload'}
                    </span>
                    <span className={`text-[10px] font-black uppercase ${file ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {file ? file.name : 'Click to select'}
                    </span>
                  </div>
                </div>
                <button type="submit" disabled={!file || fileLoading} className="w-full mt-3 bg-primary text-white py-2.5 rounded-[10px] font-black uppercase tracking-[0.15em] text-[9px] hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  {fileLoading ? 'PROCESSING...' : 'UPLOAD & PROCESS'}
                </button>
              </form>

              {error && (
                <div className="p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-red-400 text-center">
                  <p className="text-[9px] font-black uppercase">{error}</p>
                </div>
              )}
            </div>

            {/* Right: Recent Leads (3 cols) */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">contact_page</span>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600/60 dark:text-slate-300/60">Recent Leads</h2>
                </div>
                <button onClick={() => navigate('/crm')} className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline cursor-pointer bg-transparent border-none">
                  View All →
                </button>
              </div>

              <div className="bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-[16px] shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-white/10" />
                          <div className="h-2 w-20 rounded bg-slate-200 dark:bg-white/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentLeads.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 mb-2">person_search</span>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500/70 dark:text-slate-400/70">
                      No leads yet — add people or run a campaign to start.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {recentLeads.map((lead) => (
                      <div
                        key={lead.id || lead._id}
                        onClick={() => navigate('/crm')}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-primary">
                            {(lead.first_name || lead.name || '?')[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {lead.first_name || lead.name}{lead.last_name ? ` ${lead.last_name}` : ''}
                          </p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                            {lead.phone_number || lead.email || 'No contact'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {lead.source && (
                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                              {lead.source}
                            </span>
                          )}
                          <p className="text-[8px] text-slate-400 mt-0.5">{timeAgo(lead.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Conversations */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-base">chat</span>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600/60 dark:text-slate-300/60">Recent Chats</h2>
                    {unreadChats > 0 && (
                      <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadChats}</span>
                    )}
                  </div>
                  <button onClick={() => navigate('/chat')} className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline cursor-pointer bg-transparent border-none">
                    Open Chat →
                  </button>
                </div>

                <div className="bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-[16px] shadow-sm overflow-hidden">
                  {loading ? (
                    <div className="p-4 animate-pulse space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 rounded bg-slate-200 dark:bg-white/10" />
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-500/60">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {conversations.slice(0, 4).map((conv, idx) => (
                        <div
                          key={idx}
                          onClick={() => navigate('/chat')}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-blue-500">
                              {(conv.lead?.first_name || '?')[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                              {conv.lead?.first_name || 'Unknown'} {conv.lead?.last_name || ''}
                            </p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                              {conv.latestMessage?.content || 'No messages'}
                            </p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="text-[8px] font-black bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
