import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { syncIntegrationStatus } from '../api';

/* ── stat card definitions ── */
const STATS = [
  { icon: 'group',     label: 'People',      path: '/users',           iconColor: '#1877F2', iconBg: '#E3F2FD', darkBg: '#0D1B2A', barColor: '#1877F2' },
  { icon: 'person',    label: 'Leads',        path: '/crm',             iconColor: '#0EA5E9', iconBg: '#E0F2FE', darkBg: '#0C2234', barColor: '#0EA5E9' },
  { icon: 'campaign',  label: 'Campaigns',    path: '/campaigns',       iconColor: '#F59E0B', iconBg: '#FEF3C7', darkBg: '#2A1E06', barColor: '#F59E0B' },
  { icon: 'chat',      label: 'Unread Chats', path: '/chat/whatsapp',   iconColor: '#10B981', iconBg: '#D1FAE5', darkBg: '#062A1C', barColor: '#10B981' },
  { icon: 'call',      label: 'Calls',        path: '/call-logs',       iconColor: '#42A5F5', iconBg: '#E3F2FD', darkBg: '#0D1B2A', barColor: '#42A5F5' },
  { icon: 'smart_toy', label: 'Pending Auto', path: '/lead-automation', iconColor: '#EC4899', iconBg: '#FCE7F3', darkBg: '#2A0A1C', barColor: '#EC4899' },
];

const QUICK_ACTIONS = [
  { icon: 'person_add', label: 'Add People',  iconColor: '#1877F2', iconBg: '#E3F2FD', darkBg: '#0D1B2A' },
  { icon: 'download',   label: 'Import File', iconColor: '#0EA5E9', iconBg: '#E0F2FE', darkBg: '#0C2234' },
  { icon: 'call',       label: 'Voice Calls', iconColor: '#42A5F5', iconBg: '#E3F2FD', darkBg: '#0D1B2A' },
  { icon: 'pie_chart',  label: 'Reports',     iconColor: '#F59E0B', iconBg: '#FEF3C7', darkBg: '#2A1E06' },
];

const INTEGRATIONS = [
  { k: 'wa', label: 'WhatsApp', icon: 'chat',             color: '#10B981', bg: '#D1FAE5', darkBg: '#062A1C', path: '/whatsapp-setup',        ok: (d) => d?.whatsapp?.connected && d?.whatsapp?.tokenValid },
  { k: 'fb', label: 'Facebook', icon: 'data_exploration', color: '#3B82F6', bg: '#DBEAFE', darkBg: '#0C1D38', path: '/integrations/facebook', ok: (d) => d?.facebook?.connected && d?.facebook?.tokenValid },
  { k: 'em', label: 'Email',    icon: 'mail',             color: '#42A5F5', bg: '#E3F2FD', darkBg: '#0D1B2A', path: '/integrations',          ok: (d) => d?.email?.connected    && d?.email?.healthy       },
  { k: 'vo', label: 'AI Voice', icon: 'record_voice_over',color: '#F59E0B', bg: '#FEF3C7', darkBg: '#2A1E06', path: '/call-logs',             ok: (d) => d?.voice?.configured },
];

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ──────────────────────────────────────────────── */
const DashboardPage = () => {
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const { theme }      = useTheme();
  const dark           = theme === 'dark';

  const [users,         setUsers]         = useState([]);
  const [leads,         setLeads]         = useState({ leads: [], total: 0 });
  const [campaigns,     setCampaigns]     = useState({ campaigns: [], total: 0 });
  const [conversations, setConversations] = useState([]);
  const [callLogs,      setCallLogs]      = useState([]);
  const [automations,   setAutomations]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [manualForm,    setManualForm]    = useState({ name: '', phone: '' });
  const [file,          setFile]          = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [fileLoading,   setFileLoading]   = useState(false);
  const [error,         setError]         = useState('');
  const [syncData,      setSyncData]      = useState(null);
  const [syncing,       setSyncing]       = useState(false);
  const [syncedAt,      setSyncedAt]      = useState(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [showImport,    setShowImport]    = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const p = { userId: user.id, role: user.role };
    try {
      const [uR, lR, cR, chR, clR, aR] = await Promise.allSettled([
        api.getAllUsers(p),
        api.getAllLeads({ ...p, limit: 5 }),
        api.listCampaigns(p),
        api.getChatConversations(),
        api.getCallLogs(p),
        api.getCreatorAutomations(user.id),
      ]);
      if (uR.status  === 'fulfilled') setUsers(uR.value.data || []);
      if (lR.status  === 'fulfilled') setLeads(lR.value.data || { leads: [], total: 0 });
      if (cR.status  === 'fulfilled') setCampaigns(cR.value.data || { campaigns: [], total: 0 });
      if (chR.status === 'fulfilled') {
        const d = chR.value.data;
        setConversations(Array.isArray(d) ? d : (d?.data || []));
      }
      if (clR.status === 'fulfilled') setCallLogs(clR.value.data?.logs || clR.value.data || []);
      if (aR.status  === 'fulfilled') setAutomations(aR.value.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await syncIntegrationStatus();
      if (res.data.success) { setSyncData(res.data.integrations); setSyncedAt(new Date(res.data.synced_at)); }
    } catch (e) { console.error(e); }
    finally { setSyncing(false); }
  }, []);

  const totalLeads         = leads.total || 0;
  const activeCampaigns    = Array.isArray(campaigns.campaigns) ? campaigns.campaigns.filter(c => c.status === 'active').length : 0;
  const totalCampaigns     = campaigns.total || 0;
  const unreadChats        = Array.isArray(conversations) ? conversations.reduce((s, c) => s + (c.unreadCount || 0), 0) : 0;
  const recentLeads        = Array.isArray(leads.leads) ? leads.leads.slice(0, 5) : [];
  const pendingAutomations = Array.isArray(automations) ? automations.filter(a => a.status === 'pending').length : 0;
  const totalCalls         = Array.isArray(callLogs) ? callLogs.length : 0;
  const statValues         = [users.length, totalLeads, `${activeCampaigns}/${totalCampaigns}`, unreadChats, totalCalls, pendingAutomations];

  const handleManualSubmit = async (e) => {
    e.preventDefault(); setManualLoading(true); setError('');
    try {
      const cb = user ? { userId: user.id, role: user.role, name: user.name } : null;
      await api.createUser({ ...manualForm, createdBy: cb });
      setManualForm({ name: '', phone: '' }); setShowAdd(false);
      await fetchDashboardData(); navigate('/users');
    } catch (e) { console.error(e); setError('Failed to add user.'); }
    finally { setManualLoading(false); }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault(); if (!file) return;
    setFileLoading(true); setError('');
    try {
      const cb = user ? { userId: user.id, role: user.role, name: user.name } : null;
      await api.uploadUser(file, cb);
      setFile(null); setShowImport(false);
      await fetchDashboardData(); navigate('/users');
    } catch (e) { console.error(e); setError('Failed to process document.'); }
    finally { setFileLoading(false); }
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  /* ── design tokens ── */
  const T = {
    cardBg:    dark ? '#161B27' : '#FFFFFF',
    cardBorder:dark ? '#2D3748' : '#E2E8F0',
    text:      dark ? '#E2E8F0' : '#1E1B3A',
    text2:     dark ? '#94A3B8' : '#64748B',
    text3:     dark ? '#4B5563' : '#94A3B8',
    inputBg:   dark ? '#1E2A3A' : '#F5F7FA',
    rowHover:  dark ? '#1A2235' : '#F8FAFF',
    divider:   dark ? '#1F2937' : '#F1F5F9',
    pillBg:    dark ? '#252F40' : '#F0F2F8',
  };

  /* shared modal wrapper */
  const Modal = ({ show, onClose, title, children }) => !show ? null : (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-[22px] p-6 animate-slide-up"
        style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-[17px] font-bold" style={{ color: T.text }}>{title}</p>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
            style={{ background: T.pillBg, color: T.text2 }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? '#2D3A55' : '#E3F2FD'}
            onMouseLeave={e => e.currentTarget.style.background = T.pillBg}>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-28 sm:pb-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ══ WELCOME BANNER ════════════════════════════════ */}
      <div className="rounded-[20px] p-6 mb-6 relative overflow-hidden"
        style={{ background: dark ? '#0D1B2A' : '#0D47A1' }}>
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(24,119,242,0.35) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute bottom-0 left-12 w-28 h-28 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(24,119,242,0.25) 0%, transparent 70%)' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium mb-1" style={{ color: 'rgba(144,202,249,0.7)' }}>
              {greet()},
            </p>
            <h1 className="font-black text-white uppercase tracking-tight leading-tight mb-2"
              style={{ fontSize: 'clamp(18px,4vw,24px)' }}>
              {user?.name || 'Dashboard'}
            </h1>
            <p className="text-[13px]" style={{ color: 'rgba(144,202,249,0.55)' }}>
              Here&#39;s what&#39;s happening with your system today.
            </p>
          </div>
          <div className="flex-shrink-0 w-12 h-12 rounded-[16px] flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span className="material-symbols-outlined text-[24px]"
              style={{ color: '#90CAF9', fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          </div>
        </div>
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-4">
        <p className="sec-lbl">Overview</p>
        <button onClick={() => navigate('/crm')}
          className="flex items-center gap-0.5 text-[12px] font-semibold bg-transparent border-none cursor-pointer"
          style={{ color: '#1877F2' }}>
          View All <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </button>
      </div>

      {/* ── Stats 3×2 ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {STATS.map((s, i) => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className="c3 text-left p-4 border-none w-full"
            style={{ background: T.cardBg, borderColor: T.cardBorder }}>
            <div className="ipill w-10 h-10 mb-3"
              style={{ background: dark ? s.darkBg : s.iconBg }}>
              <span className="material-symbols-outlined text-[19px]"
                style={{ color: s.iconColor, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <p className="text-[22px] sm:text-[24px] font-black leading-none mb-1" style={{ color: T.text }}>
              {loading ? <span className="skeleton inline-block w-9 h-5 align-middle" /> : statValues[i]}
            </p>
            <p className="text-[11px] leading-tight mb-3" style={{ color: T.text2 }}>{s.label}</p>
            <div className="w-6 h-[3px] rounded-full" style={{ background: s.barColor }} />
          </button>
        ))}
      </div>

      {/* ══ INTEGRATION STATUS ════════════════════════════ */}
      <div className="c p-5 mb-5" style={{ background: T.cardBg, borderColor: T.cardBorder }}>
        <div className="flex items-center gap-4">
          <div className="ipill flex-shrink-0 w-[52px] h-[52px]"
            style={{ background: dark ? '#0D1B2A' : '#E3F2FD' }}>
            <span className={`material-symbols-outlined text-[24px] ${syncing ? 'animate-spin' : ''}`}
              style={{ color: '#1877F2', fontVariationSettings: "'FILL' 1" }}>sync</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold mb-0.5" style={{ color: T.text }}>Integration Status</p>
            <p className="text-[12px] leading-relaxed" style={{ color: T.text2 }}>
              {syncedAt ? `Last synced ${timeAgo(syncedAt)}` : 'Click Sync All to check live status of all your integrations.'}
            </p>
          </div>
          <button onClick={handleSync} disabled={syncing} className="btn-pri flex-shrink-0">
            <span className={`material-symbols-outlined text-[15px] ${syncing ? 'animate-spin' : ''}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
            {syncing ? 'Syncing…' : 'Sync All'}
          </button>
        </div>
        {syncData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4"
            style={{ borderTop: `1px solid ${T.cardBorder}` }}>
            {INTEGRATIONS.map(item => {
              const ok = item.ok(syncData);
              return (
                <button key={item.k} onClick={() => navigate(item.path)}
                  className="c3 p-3 text-left border-none w-full"
                  style={{ background: T.cardBg, borderColor: T.cardBorder }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="ipill w-8 h-8" style={{ background: dark ? item.darkBg : item.bg }}>
                      <span className="material-symbols-outlined text-[15px]"
                        style={{ color: item.color, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: ok ? (dark ? '#062A1C' : '#D1FAE5') : T.pillBg,
                               color:      ok ? '#10B981' : T.text3 }}>
                      {ok ? 'OK' : 'Off'}
                    </span>
                  </div>
                  <p className="text-[12px] font-semibold" style={{ color: T.text }}>{item.label}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ QUICK ACTIONS ═════════════════════════════════ */}
      <p className="sec-lbl mb-4">Quick Actions</p>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map((item, i) => {
          const action = [
            () => setShowAdd(true),
            () => setShowImport(true),
            () => navigate('/call-logs'),
            () => navigate('/crm'),
          ][i];
          return (
            <button key={item.label} onClick={action}
              className="c3 flex flex-col items-center gap-3 py-5 px-2 border-none w-full"
              style={{ background: T.cardBg, borderColor: T.cardBorder }}>
              <div className="ipill w-12 h-12" style={{ background: dark ? item.darkBg : item.iconBg }}>
                <span className="material-symbols-outlined text-[22px]"
                  style={{ color: item.iconColor, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              </div>
              <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: T.text }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══ RECENT LEADS ══════════════════════════════════ */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-4">
          <p className="sec-lbl">Recent Leads</p>
          <button onClick={() => navigate('/crm')}
            className="text-[12px] font-semibold bg-transparent border-none cursor-pointer"
            style={{ color: '#1877F2' }}>View All →</button>
        </div>
        <div className="c overflow-hidden" style={{ background: T.cardBg, borderColor: T.cardBorder }}>
          {loading ? (
            <div className="p-5 space-y-4">
              {[1,2,3].map(n => (
                <div key={n} className="flex items-center gap-3">
                  <div className="skeleton w-9 h-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-36" />
                    <div className="skeleton h-2 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: T.text3 }}>person_search</span>
              <p className="text-[13px]" style={{ color: T.text2 }}>No leads yet — add people or run a campaign.</p>
            </div>
          ) : recentLeads.map((lead, idx) => (
            <div key={lead.id || lead._id} onClick={() => navigate('/crm')}
              className="flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors"
              style={{ borderBottom: idx < recentLeads.length - 1 ? `1px solid ${T.divider}` : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = T.rowHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[13px]"
                style={{ background: dark ? '#0D1B2A' : '#E3F2FD', color: '#1877F2' }}>
                {(lead.first_name || lead.name || '?')[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>
                  {lead.first_name || lead.name}{lead.last_name ? ` ${lead.last_name}` : ''}
                </p>
                <p className="text-[11px] truncate" style={{ color: T.text3 }}>
                  {lead.phone_number || lead.email || 'No contact'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {lead.source && (
                  <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full block mb-0.5"
                    style={{ background: dark ? '#0D1B2A' : '#E3F2FD', color: '#1877F2' }}>
                    {lead.source}
                  </span>
                )}
                <p className="text-[10px]" style={{ color: T.text3 }}>{timeAgo(lead.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ ADD PERSON MODAL ══════════════════════════════ */}
      <Modal show={showAdd} onClose={() => { setShowAdd(false); setError(''); }} title="Add Person">
        <form onSubmit={handleManualSubmit} className="space-y-3">
          {[['Full name', 'text', 'name'], ['Phone number', 'tel', 'phone']].map(([ph, type, key]) => (
            <input key={key} type={type} placeholder={ph} required
              value={manualForm[key]}
              onChange={e => setManualForm({ ...manualForm, [key]: e.target.value })}
              className="w-full px-4 py-3 rounded-[12px] text-[14px] outline-none transition-all"
              style={{ background: T.inputBg, border: `1.5px solid ${T.cardBorder}`, color: T.text }}
              onFocus={e => e.target.style.borderColor = '#1877F2'}
              onBlur={e  => e.target.style.borderColor = T.cardBorder} />
          ))}
          {error && <p className="text-[12px] px-3 py-2 rounded-[10px]"
            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}>{error}</p>}
          <button type="submit" disabled={manualLoading} className="btn-pri w-full">
            {manualLoading ? 'Adding…' : 'Add Person'}
          </button>
        </form>
      </Modal>

      {/* ══ IMPORT FILE MODAL ═════════════════════════════ */}
      <Modal show={showImport} onClose={() => { setShowImport(false); setFile(null); setError(''); }} title="Import File">
        <form onSubmit={handleFileUpload} className="space-y-3">
          <label className="relative block rounded-[14px] p-6 text-center cursor-pointer transition-all"
            style={{ border: `2px dashed ${file ? '#1877F2' : T.cardBorder}`,
                     background: file ? (dark ? '#0D1B2A' : '#E3F2FD') : T.inputBg }}>
            <input type="file" accept=".docx,.xlsx,.csv" onChange={e => setFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <span className="material-symbols-outlined text-[32px] mb-2 block"
              style={{ color: file ? '#1877F2' : T.text3 }}>
              {file ? 'task_alt' : 'cloud_upload'}
            </span>
            <p className="text-[12px] font-medium" style={{ color: file ? '#1877F2' : T.text2 }}>
              {file ? file.name : 'Click to select  DOCX · XLSX · CSV'}
            </p>
          </label>
          {error && <p className="text-[12px] px-3 py-2 rounded-[10px]"
            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}>{error}</p>}
          <button type="submit" disabled={!file || fileLoading} className="btn-pri w-full">
            {fileLoading ? 'Processing…' : 'Upload & Process'}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default DashboardPage;
