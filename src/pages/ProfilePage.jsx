import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  getProfile, updateProfile, changePin,
  getHomeinTownStatus, verifyHitAccount, confirmLinkHomeintown, unlinkHomeintown,
  getUsageStats, syncIntegrationStatus,
} from '../api';

const cardClass = 'rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 shadow-sm';
const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-primary/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnOutline = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50';
const labelClass = 'block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5';

// ── Setup Step Definition ─────────────────────────────────────────────────────
const SETUP_STEPS = [
  { id: 'profile', label: 'Company Details', icon: 'business', desc: 'Set your company name, agent name, and contact info' },
  { id: 'facebook', label: 'Connect Facebook', icon: 'data_exploration', desc: 'Link Facebook Lead Ads to capture leads automatically', path: '/integrations/facebook' },
  { id: 'whatsapp', label: 'Connect WhatsApp', icon: 'chat', desc: 'Connect WhatsApp Business to send templates and auto-replies', path: '/whatsapp-setup' },
  { id: 'email', label: 'Connect Email', icon: 'mail', desc: 'Link Gmail/Outlook for automated email follow-ups', path: '/integrations' },
  { id: 'project', label: 'Set Up Project', icon: 'apartment', desc: 'Configure a project with AI prompt and automation settings', path: '/projects' },
  { id: 'homeintown', label: 'HomeInTown Link', icon: 'link', desc: 'Connect your homeintown.in account for project sync' },
];

const ProfilePage = () => {
  const { user, checkAuth } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ name: '', email: '', mobile: '', companyName: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // PIN
  const [showPin, setShowPin] = useState(false);
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [pinSaving, setPinSaving] = useState(false);

  // HIT Link
  const [hitStatus, setHitStatus] = useState({ linked: false, hitUser: null, loading: true });
  const [hitForm, setHitForm] = useState({ phone: '', mpin: '' });
  const [hitVerifying, setHitVerifying] = useState(false);
  const [hitConfirmData, setHitConfirmData] = useState(null);
  const [hitLinking, setHitLinking] = useState(false);

  // Usage stats
  const [stats, setStats] = useState(null);

  // Integration status (for step completion detection)
  const [integrations, setIntegrations] = useState(null);

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [profRes, hitRes, statsRes, intRes] = await Promise.allSettled([
        getProfile(),
        getHomeinTownStatus(),
        getUsageStats(),
        syncIntegrationStatus(),
      ]);

      if (profRes.status === 'fulfilled') {
        const d = profRes.value.data;
        setProfile({ name: d.name || '', email: d.email || '', mobile: d.mobile || '', companyName: d.companyName || '' });
      }
      if (hitRes.status === 'fulfilled') setHitStatus({ linked: hitRes.value.data.linked, hitUser: hitRes.value.data.hitUser, loading: false });
      else setHitStatus(s => ({ ...s, loading: false }));
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.stats);
      if (intRes.status === 'fulfilled') setIntegrations(intRes.value.data.integrations);
    } catch { /* handled per-call */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Compute step completion ─────────────────────────────────────────────────
  const stepDone = {
    profile: !!(profile.companyName && profile.name),
    facebook: !!(integrations?.facebook?.connected),
    whatsapp: !!(integrations?.whatsapp?.connected),
    email: !!(integrations?.email?.connected),
    project: user?.hitLinked || false,
    homeintown: hitStatus.linked,
  };
  const completedCount = Object.values(stepDone).filter(Boolean).length;
  const progressPct = Math.round((completedCount / SETUP_STEPS.length) * 100);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleProfileChange = (f, v) => { setProfile(p => ({ ...p, [f]: v })); setDirty(true); };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({ name: profile.name, companyName: profile.companyName, mobile: profile.mobile });
      addToast('Profile saved', 'success');
      setDirty(false);
      checkAuth();
    } catch (err) { addToast(err.response?.data?.error || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const handlePinChange = async () => {
    const { currentPin, newPin, confirmPin } = pinForm;
    if (!currentPin || !newPin || !confirmPin) { addToast('All fields required', 'error'); return; }
    if (!/^\d{6}$/.test(newPin)) { addToast('PIN must be 6 digits', 'error'); return; }
    if (newPin !== confirmPin) { addToast('PINs do not match', 'error'); return; }
    try {
      setPinSaving(true);
      await changePin({ currentPin, newPin });
      addToast('PIN changed', 'success');
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setShowPin(false);
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setPinSaving(false); }
  };

  const handleHitVerify = async () => {
    if (!hitForm.phone || !hitForm.mpin) { addToast('Phone and MPIN required', 'error'); return; }
    try {
      setHitVerifying(true);
      const res = await verifyHitAccount(hitForm);
      if (res.data.verified) setHitConfirmData(res.data.hitUser);
    } catch (err) { addToast(err.response?.data?.error || 'Verification failed', 'error'); }
    finally { setHitVerifying(false); }
  };

  const handleHitConfirm = async () => {
    try {
      setHitLinking(true);
      await confirmLinkHomeintown({ hitUserId: hitConfirmData.id });
      addToast('HomeInTown connected!', 'success');
      setHitConfirmData(null);
      setHitForm({ phone: '', mpin: '' });
      setHitStatus({ linked: true, hitUser: hitConfirmData, loading: false });
      checkAuth();
    } catch (err) { addToast(err.response?.data?.error || 'Link failed', 'error'); }
    finally { setHitLinking(false); }
  };

  const handleHitUnlink = async () => {
    if (!window.confirm('Disconnect HomeInTown? Project sync will stop.')) return;
    try {
      await unlinkHomeintown();
      addToast('Disconnected', 'success');
      setHitStatus({ linked: false, hitUser: null, loading: false });
      checkAuth();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ═══════ Header + Avatar ═══════ */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white text-2xl font-black shadow-xl shadow-primary/25">
          {(profile.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name || 'Your Profile'}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
        </div>
      </div>

      {/* ═══════ Setup Progress ═══════ */}
      <div className={`${cardClass} p-5`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Setup Progress</h3>
          <span className="text-xs font-black text-primary">{completedCount}/{SETUP_STEPS.length} complete</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
        </div>
        {/* Steps */}
        <div className="grid gap-2">
          {SETUP_STEPS.map((step, i) => {
            const done = stepDone[step.id];
            return (
              <div
                key={step.id}
                onClick={() => step.path && navigate(step.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${
                  done
                    ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5'
                    : 'border-slate-200/70 dark:border-white/10 hover:border-primary/30 hover:bg-primary/5'
                } ${step.path ? 'cursor-pointer' : ''}`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-500 ${
                  done ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  <span className="material-symbols-outlined text-base">{done ? 'check' : step.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${done ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>{step.label}</p>
                  <p className="text-[10px] text-slate-500 truncate">{step.desc}</p>
                </div>
                {done && <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>}
                {!done && step.path && <span className="material-symbols-outlined text-slate-400 text-base">chevron_right</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════ Usage & Costing ═══════ */}
      {stats && (
        <div className={`${cardClass} p-5`}>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Usage Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Leads', value: stats.leads.total, icon: 'people', color: 'primary' },
              { label: 'Voice Minutes', value: stats.voice.totalMinutes, icon: 'call', color: 'blue-500' },
              { label: 'WA Templates Sent', value: stats.whatsapp.templatesSent, icon: 'chat', color: 'green-500' },
              { label: 'WA AI Replies', value: stats.whatsapp.aiReplies, icon: 'smart_toy', color: 'purple-500' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 text-center">
                <span className={`material-symbols-outlined text-lg text-${s.color} mb-1 block`}>{s.icon}</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">{(s.value || 0).toLocaleString('en-IN')}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="rounded-xl bg-red-50 dark:bg-red-500/5 p-2 text-center">
              <p className="text-sm font-black text-red-600">{stats.leads.hot}</p>
              <p className="text-[9px] text-red-500 font-bold">HOT</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 p-2 text-center">
              <p className="text-sm font-black text-amber-600">{stats.leads.warm}</p>
              <p className="text-[9px] text-amber-500 font-bold">WARM</p>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-500/5 p-2 text-center">
              <p className="text-sm font-black text-blue-600">{stats.leads.cold}</p>
              <p className="text-[9px] text-blue-500 font-bold">COLD</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Company Details ═══════ */}
      <div className={`${cardClass} p-5`}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Company Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full Name</label>
            <input type="text" value={profile.name} onChange={e => handleProfileChange('name', e.target.value)} className={inputClass} placeholder="Your name" />
          </div>
          <div>
            <label className={labelClass}>Email (Login ID)</label>
            <input type="email" value={profile.email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input type="text" value={profile.companyName} onChange={e => handleProfileChange('companyName', e.target.value)} className={inputClass} placeholder="Your company name (used in AI calls)" />
          </div>
          <div>
            <label className={labelClass}>Mobile Number</label>
            <input type="tel" value={profile.mobile} onChange={e => handleProfileChange('mobile', e.target.value)} className={inputClass} placeholder="10-digit mobile" maxLength={10} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => setShowPin(!showPin)} className={btnOutline}>
            <span className="material-symbols-outlined text-sm">lock</span>
            {showPin ? 'Cancel' : 'Change PIN'}
          </button>
          <button onClick={handleSave} disabled={!dirty || saving} className={btnPrimary}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* PIN Change */}
        {showPin && (
          <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-white/10 grid gap-3 sm:grid-cols-3">
            <div><label className={labelClass}>Current PIN</label><input type="password" value={pinForm.currentPin} onChange={e => setPinForm(p => ({...p, currentPin: e.target.value}))} className={inputClass} maxLength={6} inputMode="numeric" /></div>
            <div><label className={labelClass}>New PIN</label><input type="password" value={pinForm.newPin} onChange={e => setPinForm(p => ({...p, newPin: e.target.value}))} className={inputClass} maxLength={6} inputMode="numeric" /></div>
            <div><label className={labelClass}>Confirm</label><input type="password" value={pinForm.confirmPin} onChange={e => setPinForm(p => ({...p, confirmPin: e.target.value}))} className={inputClass} maxLength={6} inputMode="numeric" /></div>
            <div className="sm:col-span-3 flex justify-end">
              <button onClick={handlePinChange} disabled={pinSaving} className={btnPrimary}>{pinSaving ? 'Changing...' : 'Update PIN'}</button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ HomeInTown Connection (bottom) ═══════ */}
      <div className={`${cardClass} p-5`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-lg text-primary">link</span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">HomeInTown Connection</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Connect your homeintown.in account to sync real estate projects and manage all lead automation per project.
        </p>

        {hitStatus.loading ? (
          <div className="flex items-center gap-2 py-3"><div className="animate-spin rounded-full h-4 w-4 border-2 border-primary/30 border-t-primary" /><span className="text-xs text-slate-500">Checking...</span></div>
        ) : hitStatus.linked ? (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Connected</p>
                {hitStatus.hitUser && <p className="text-xs text-emerald-600">{hitStatus.hitUser.name} &middot; {hitStatus.hitUser.role}</p>}
              </div>
            </div>
            <button onClick={handleHitUnlink} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider">Disconnect</button>
          </div>
        ) : hitConfirmData ? (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 p-4 space-y-3">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Account Found: {hitConfirmData.name} ({hitConfirmData.role})</p>
            <div className="flex gap-3">
              <button onClick={() => setHitConfirmData(null)} className={btnOutline}>Cancel</button>
              <button onClick={handleHitConfirm} disabled={hitLinking} className={btnPrimary}>{hitLinking ? 'Connecting...' : 'Confirm & Connect'}</button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={labelClass}>HIT Phone</label><input type="tel" value={hitForm.phone} onChange={e => setHitForm(f => ({...f, phone: e.target.value}))} className={inputClass} placeholder="10-digit" maxLength={10} /></div>
            <div><label className={labelClass}>HIT MPIN</label><input type="password" value={hitForm.mpin} onChange={e => setHitForm(f => ({...f, mpin: e.target.value}))} className={inputClass} placeholder="MPIN" maxLength={6} /></div>
            <div className="sm:col-span-2 flex justify-end">
              <button onClick={handleHitVerify} disabled={hitVerifying || !hitForm.phone || !hitForm.mpin} className={btnPrimary}>
                {hitVerifying ? 'Verifying...' : 'Verify & Connect'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="text-center pb-4">
        <p className="text-[10px] text-slate-400 dark:text-slate-500">Account ID: {user?.id} &middot; Role: {user?.role}</p>
      </div>
    </div>
  );
};

export default ProfilePage;
