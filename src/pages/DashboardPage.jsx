import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { syncIntegrationStatus } from '../api';

/* ── stat card definitions ── */
const STATS = [
  { icon: 'group',     label: 'People',      path: '/users',           iconColor: '#6366F1', iconBg: '#EEF2FF', darkBg: '#1E2040', barColor: '#6366F1' },
  { icon: 'person',    label: 'Leads',        path: '/crm',             iconColor: '#0EA5E9', iconBg: '#E0F2FE', darkBg: '#0C2234', barColor: '#0EA5E9' },
  { icon: 'campaign',  label: 'Campaigns',    path: '/campaigns',       iconColor: '#F59E0B', iconBg: '#FEF3C7', darkBg: '#2A1E06', barColor: '#F59E0B' },
  { icon: 'chat',      label: 'Unread Chats', path: '/chat/whatsapp',   iconColor: '#10B981', iconBg: '#D1FAE5', darkBg: '#062A1C', barColor: '#10B981' },
  { icon: 'call',      label: 'Calls',        path: '/call-logs',       iconColor: '#8B5CF6', iconBg: '#EDE9FE', darkBg: '#1C1040', barColor: '#8B5CF6' },
  { icon: 'smart_toy', label: 'Pending Auto', path: '/lead-automation', iconColor: '#EC4899', iconBg: '#FCE7F3', darkBg: '#2A0A1C', barColor: '#EC4899' },
];

const QUICK_ACTIONS = [
  { icon: 'person_add', label: 'Add People',  iconColor: '#6366F1', iconBg: '#EEF2FF', darkBg: '#1E2040' },
  { icon: 'download',   label: 'Import File', iconColor: '#0EA5E9', iconBg: '#E0F2FE', darkBg: '#0C2234' },
  { icon: 'call',       label: 'Voice Calls', iconColor: '#8B5CF6', iconBg: '#EDE9FE', darkBg: '#1C1040' },
  { icon: 'pie_chart',  label: 'Reports',     iconColor: '#F59E0B', iconBg: '#FEF3C7', darkBg: '#2A1E06' },
];

const INTEGRATIONS = [
  { k: 'wa', label: 'WhatsApp', icon: 'chat',             color: '#10B981', bg: '#D1FAE5', darkBg: '#062A1C', path: '/whatsapp-setup',        ok: (d) => d?.whatsapp?.connected && d?.whatsapp?.tokenValid },
  { k: 'fb', label: 'Facebook', icon: 'data_exploration', color: '#3B82F6', bg: '#DBEAFE', darkBg: '#0C1D38', path: '/integrations/facebook', ok: (d) => d?.facebook?.connected && d?.facebook?.tokenValid },
  { k: 'em', label: 'Email',    icon: 'mail',             color: '#8B5CF6', bg: '#EDE9FE', darkBg: '#1C1040', path: '/integrations',          ok: (d) => d?.email?.connected    && d?.email?.healthy       },
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
            onMouseEnter={e => e.currentTarget.style.background = dark ? '#2D3A55' : '#EEF2FF'}
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
      <div className="rounded-[14px] px-4 py-3 mb-3 relative overflow-hidden"
        style={{ background: dark ? '#1A1033' : '#1E1B4B' }}>
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium" style={{ color: 'rgba(199,210,254,0.7)' }}>
              {greet()},
            </p>
            <h1 className="font-black text-white uppercase tracking-tight leading-tight"
              style={{ fontSize: 'clamp(15px,3.5vw,20px)' }}>
              {user?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-[12px] flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span className="material-symbols-outlined text-[18px]"
              style={{ color: '#A5B4FC', fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          </div>
        </div>
      </div>

      {/* ══ INTEGRATION STATUS (compact) ══════════════ */}
      <div className="c px-3 py-2 mb-3" style={{ background: T.cardBg, borderColor: T.cardBorder }}>
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[16px] ${syncing ? 'animate-spin' : ''}`}
            style={{ color: '#6366F1', fontVariationSettings: "'FILL' 1" }}>sync</span>
          <span className="text-[11px] font-semibold flex-1" style={{ color: T.text }}>
            {syncedAt ? `Synced ${timeAgo(syncedAt)}` : 'Integration Status'}
          </span>
          <button onClick={handleSync} disabled={syncing}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px] text-[10px] font-semibold text-white border-none cursor-pointer"
            style={{ background: '#6366F1' }}>
            <span className={`material-symbols-outlined text-[12px] ${syncing ? 'animate-spin' : ''}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
            Sync
          </button>
        </div>
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-3">
        <p className="sec-lbl">Overview</p>
        <button onClick={() => navigate('/crm')}
          className="flex items-center gap-0.5 text-[11px] font-semibold bg-transparent border-none cursor-pointer"
          style={{ color: '#6366F1' }}>
          View All <span className="material-symbols-outlined text-[13px]">chevron_right</span>
        </button>
      </div>

      {/* ── Stats 3×2 (compact) ── */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {STATS.map((s, i) => (
          <button key={s.label} onClick={() => navigate(s.path)}
            className="c3 text-left p-3 border-none w-full"
            style={{ background: T.cardBg, borderColor: T.cardBorder }}>
            <div className="ipill w-8 h-8 mb-2"
              style={{ background: dark ? s.darkBg : s.iconBg }}>
              <span className="material-symbols-outlined text-[16px]"
                style={{ color: s.iconColor, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <p className="text-[18px] sm:text-[20px] font-black leading-none mb-0.5" style={{ color: T.text }}>
              {loading ? <span className="skeleton inline-block w-8 h-4 align-middle" /> : statValues[i]}
            </p>
            <p className="text-[10px] leading-tight mb-2" style={{ color: T.text2 }}>{s.label}</p>
            <div className="w-5 h-[2px] rounded-full" style={{ background: s.barColor }} />
          </button>
        ))}
      </div>

      {/* ══ ACTIVITY GRAPH ════════════════════════════════ */}
      <div className="c p-4 mb-5" style={{ background: T.cardBg, borderColor: T.cardBorder }}>
        <div className="flex items-center justify-between mb-3">
          <p className="sec-lbl">Activity Overview</p>
          <span className="text-[10px] font-medium" style={{ color: T.text3 }}>Last 7 days</span>
        </div>
        <div className="relative h-36 sm:h-44">
          {(() => {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const peopleData = [65, 45, 80, 55, 90, 35, 70];
            const leadsData = [40, 60, 35, 75, 50, 85, 45];
            const visitsData = [30, 55, 70, 40, 65, 50, 60];
            const maxVal = 100;
            const h = 100;
            const w = 100;
            const stepX = w / (days.length - 1);

            const toPath = (data) => {
              return data.map((v, i) => {
                const x = i * stepX;
                const y = h - (v / maxVal) * h;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');
            };

            const toArea = (data) => {
              const line = data.map((v, i) => {
                const x = i * stepX;
                const y = h - (v / maxVal) * h;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');
              return `${line} L ${w} ${h} L 0 ${h} Z`;
            };

            return (
              <svg viewBox={`0 0 ${w} ${h + 10}`} className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(v => (
                  <line key={v} x1="0" y1={h - (v / maxVal) * h} x2={w} y2={h - (v / maxVal) * h}
                    stroke={dark ? '#2D3748' : '#E2E8F0'} strokeWidth="0.3" />
                ))}
                {/* Area fills */}
                <path d={toArea(peopleData)} fill="#6366F1" opacity="0.08" />
                <path d={toArea(leadsData)} fill="#0EA5E9" opacity="0.08" />
                <path d={toArea(visitsData)} fill="#10B981" opacity="0.08" />
                {/* Lines */}
                <path d={toPath(peopleData)} fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={toPath(leadsData)} fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={toPath(visitsData)} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Dots */}
                {peopleData.map((v, i) => (
                  <circle key={`p${i}`} cx={i * stepX} cy={h - (v / maxVal) * h} r="1.5" fill="#6366F1" />
                ))}
                {leadsData.map((v, i) => (
                  <circle key={`l${i}`} cx={i * stepX} cy={h - (v / maxVal) * h} r="1.5" fill="#0EA5E9" />
                ))}
                {visitsData.map((v, i) => (
                  <circle key={`v${i}`} cx={i * stepX} cy={h - (v / maxVal) * h} r="1.5" fill="#10B981" />
                ))}
              </svg>
            );
          })()}
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-0">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <span key={d} className="text-[8px] font-medium" style={{ color: T.text3 }}>{d}</span>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${T.cardBorder}` }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-[2px] rounded-full" style={{ background: '#6366F1' }} />
            <span className="text-[10px] font-medium" style={{ color: T.text2 }}>People</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-[2px] rounded-full" style={{ background: '#0EA5E9' }} />
            <span className="text-[10px] font-medium" style={{ color: T.text2 }}>Leads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-[2px] rounded-full" style={{ background: '#10B981' }} />
            <span className="text-[10px] font-medium" style={{ color: T.text2 }}>Visits</span>
          </div>
        </div>
      </div>

      {/* ══ RECENT LEADS ══════════════════════════════════ */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-4">
          <p className="sec-lbl">Recent Leads</p>
          <button onClick={() => navigate('/crm')}
            className="text-[12px] font-semibold bg-transparent border-none cursor-pointer"
            style={{ color: '#6366F1' }}>View All →</button>
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
                style={{ background: dark ? '#1E2040' : '#EEF2FF', color: '#6366F1' }}>
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
                    style={{ background: dark ? '#1E2040' : '#EEF2FF', color: '#6366F1' }}>
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
              onFocus={e => e.target.style.borderColor = '#6366F1'}
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
            style={{ border: `2px dashed ${file ? '#6366F1' : T.cardBorder}`,
                     background: file ? (dark ? '#1E2040' : '#EEF2FF') : T.inputBg }}>
            <input type="file" accept=".docx,.xlsx,.csv" onChange={e => setFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <span className="material-symbols-outlined text-[32px] mb-2 block"
              style={{ color: file ? '#6366F1' : T.text3 }}>
              {file ? 'task_alt' : 'cloud_upload'}
            </span>
            <p className="text-[12px] font-medium" style={{ color: file ? '#6366F1' : T.text2 }}>
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
