import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  getProfile,
  updateProfile,
  changePin,
  getHomeinTownStatus,
  verifyHitAccount,
  confirmLinkHomeintown,
  unlinkHomeintown,
} from '../api';

// ── Shared Styles ─────────────────────────────────────────────────────────────
const cardClass = 'rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 shadow-sm';
const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnOutline = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnDanger = 'inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-500/30 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const labelClass = 'block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5';

const ProfilePage = () => {
  const { user, checkAuth } = useAuth();
  const { addToast } = useNotifications();

  // ── Profile state ───────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ name: '', email: '', mobile: '', companyName: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);

  // ── PIN state ───────────────────────────────────────────────────────────────
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [pinSaving, setPinSaving] = useState(false);
  const [showPinSection, setShowPinSection] = useState(false);

  // ── HomeInTown link state ───────────────────────────────────────────────────
  const [hitStatus, setHitStatus] = useState({ linked: false, hitUser: null, loading: true });
  const [hitForm, setHitForm] = useState({ phone: '', mpin: '' });
  const [hitVerifying, setHitVerifying] = useState(false);
  const [hitConfirmData, setHitConfirmData] = useState(null); // holds verified HIT user for confirmation
  const [hitLinking, setHitLinking] = useState(false);
  const [hitUnlinking, setHitUnlinking] = useState(false);

  // ── Fetch profile ───────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const res = await getProfile();
      const data = res.data;
      setProfile({
        name: data.name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        companyName: data.companyName || '',
      });
    } catch {
      addToast('Failed to load profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  }, [addToast]);

  // ── Fetch HIT link status ───────────────────────────────────────────────────
  const fetchHitStatus = useCallback(async () => {
    try {
      const res = await getHomeinTownStatus();
      setHitStatus({ linked: res.data.linked, hitUser: res.data.hitUser || null, loading: false });
    } catch {
      setHitStatus({ linked: false, hitUser: null, loading: false });
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchHitStatus();
  }, [fetchProfile, fetchHitStatus]);

  // ── Profile handlers ────────────────────────────────────────────────────────
  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setProfileDirty(true);
  };

  const handleProfileSave = async () => {
    if (!profileDirty) return;
    try {
      setProfileSaving(true);
      const payload = {};
      if (profile.name.trim()) payload.name = profile.name.trim();
      if (profile.companyName !== undefined) payload.companyName = profile.companyName;
      if (profile.mobile !== undefined) payload.mobile = profile.mobile;

      await updateProfile(payload);
      addToast('Profile updated successfully', 'success');
      setProfileDirty(false);
      checkAuth(); // Refresh user context (name may have changed)
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update profile';
      addToast(msg, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── PIN handlers ────────────────────────────────────────────────────────────
  const handlePinChange = async () => {
    const { currentPin, newPin, confirmPin } = pinForm;
    if (!currentPin || !newPin || !confirmPin) {
      addToast('All PIN fields are required', 'error');
      return;
    }
    if (!/^\d{6}$/.test(newPin)) {
      addToast('New PIN must be exactly 6 digits', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      addToast('New PIN and confirmation do not match', 'error');
      return;
    }
    if (currentPin === newPin) {
      addToast('New PIN must be different from current PIN', 'error');
      return;
    }

    try {
      setPinSaving(true);
      await changePin({ currentPin, newPin });
      addToast('PIN changed successfully', 'success');
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setShowPinSection(false);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change PIN';
      addToast(msg, 'error');
    } finally {
      setPinSaving(false);
    }
  };

  // ── HomeInTown handlers ─────────────────────────────────────────────────────
  const handleHitVerify = async () => {
    const { phone, mpin } = hitForm;
    if (!phone || !mpin) {
      addToast('Phone and MPIN are required', 'error');
      return;
    }

    try {
      setHitVerifying(true);
      const res = await verifyHitAccount({ phone, mpin });
      if (res.data.verified) {
        setHitConfirmData(res.data.hitUser);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed';
      addToast(msg, 'error');
    } finally {
      setHitVerifying(false);
    }
  };

  const handleHitConfirmLink = async () => {
    if (!hitConfirmData) return;
    try {
      setHitLinking(true);
      await confirmLinkHomeintown({ hitUserId: hitConfirmData.id });
      addToast('HomeInTown account linked successfully!', 'success');
      setHitConfirmData(null);
      setHitForm({ phone: '', mpin: '' });
      fetchHitStatus();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to link accounts';
      addToast(msg, 'error');
    } finally {
      setHitLinking(false);
    }
  };

  const handleHitUnlink = async () => {
    if (!window.confirm('Are you sure you want to disconnect your HomeInTown account? Your projects will no longer sync.')) return;
    try {
      setHitUnlinking(true);
      await unlinkHomeintown();
      addToast('HomeInTown account disconnected', 'success');
      setHitStatus({ linked: false, hitUser: null, loading: false });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to unlink';
      addToast(msg, 'error');
    } finally {
      setHitUnlinking(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your account information and connected services</p>
      </div>

      {/* ═══════ Profile Info Card ═══════ */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3 mb-6">
          {/* Avatar */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-white text-xl font-bold shadow-lg shadow-primary/25">
            {(profile.name || user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{profile.name || 'Your Name'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{profile.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              className={inputClass}
              placeholder="Your name"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className={labelClass}>Email (Login ID)</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className={`${inputClass} opacity-60 cursor-not-allowed`}
            />
          </div>

          {/* Mobile */}
          <div>
            <label className={labelClass}>Mobile Number</label>
            <input
              type="tel"
              value={profile.mobile}
              onChange={(e) => handleProfileChange('mobile', e.target.value)}
              className={inputClass}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </div>

          {/* Company Name */}
          <div>
            <label className={labelClass}>Company Name</label>
            <input
              type="text"
              value={profile.companyName}
              onChange={(e) => handleProfileChange('companyName', e.target.value)}
              className={inputClass}
              placeholder="Your company name"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleProfileSave}
            disabled={!profileDirty || profileSaving}
            className={btnPrimary}
          >
            {profileSaving && <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />}
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ═══════ Change PIN Card ═══════ */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-slate-500">lock</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security</h3>
          </div>
          {!showPinSection && (
            <button onClick={() => setShowPinSection(true)} className={btnOutline}>
              Change PIN
            </button>
          )}
        </div>

        {showPinSection && (
          <div className="space-y-4 border-t border-slate-200/70 dark:border-white/10 pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Current PIN</label>
                <input
                  type="password"
                  value={pinForm.currentPin}
                  onChange={(e) => setPinForm(p => ({ ...p, currentPin: e.target.value }))}
                  className={inputClass}
                  placeholder="------"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className={labelClass}>New PIN</label>
                <input
                  type="password"
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm(p => ({ ...p, newPin: e.target.value }))}
                  className={inputClass}
                  placeholder="------"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className={labelClass}>Confirm New PIN</label>
                <input
                  type="password"
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm(p => ({ ...p, confirmPin: e.target.value }))}
                  className={inputClass}
                  placeholder="------"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowPinSection(false); setPinForm({ currentPin: '', newPin: '', confirmPin: '' }); }} className={btnOutline}>
                Cancel
              </button>
              <button onClick={handlePinChange} disabled={pinSaving} className={btnPrimary}>
                {pinSaving ? 'Saving...' : 'Update PIN'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ HomeInTown Connection Card ═══════ */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-lg text-primary">link</span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">HomeInTown Connection</h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Connect your HomeInTown (homeintown.in) account to sync your real estate projects and manage leads directly from OneEmployee.
        </p>

        {hitStatus.loading ? (
          <div className="flex items-center gap-2 py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary/30 border-t-primary" />
            <span className="text-xs text-slate-500">Checking connection...</span>
          </div>
        ) : hitStatus.linked ? (
          /* ── Connected state ── */
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">check_circle</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Connected</p>
                {hitStatus.hitUser && !hitStatus.hitUser.degraded && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                    {hitStatus.hitUser.name} ({hitStatus.hitUser.role}) &middot; {hitStatus.hitUser.phone}
                  </p>
                )}
              </div>
              <button
                onClick={handleHitUnlink}
                disabled={hitUnlinking}
                className={btnDanger}
              >
                {hitUnlinking ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          /* ── Not connected — show login form ── */
          <div className="space-y-4">
            {/* Confirmation dialog */}
            {hitConfirmData ? (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">person_search</span>
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Account Found</p>
                </div>
                <div className="bg-white dark:bg-slate-800/60 rounded-lg p-3 border border-blue-100 dark:border-blue-500/15">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{hitConfirmData.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {hitConfirmData.role} &middot; {hitConfirmData.phone}
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Do you want to connect this HomeInTown account to your OneEmployee workspace?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHitConfirmData(null)}
                    className={btnOutline}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleHitConfirmLink}
                    disabled={hitLinking}
                    className={btnPrimary}
                  >
                    {hitLinking ? 'Connecting...' : 'Yes, Connect'}
                  </button>
                </div>
              </div>
            ) : (
              /* Login form */
              <div className="rounded-xl border border-slate-200/70 dark:border-white/10 p-4 space-y-4">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sign in with your HomeInTown credentials
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                      type="tel"
                      value={hitForm.phone}
                      onChange={(e) => setHitForm(f => ({ ...f, phone: e.target.value }))}
                      className={inputClass}
                      placeholder="10-digit phone"
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>MPIN</label>
                    <input
                      type="password"
                      value={hitForm.mpin}
                      onChange={(e) => setHitForm(f => ({ ...f, mpin: e.target.value }))}
                      className={inputClass}
                      placeholder="Your HIT MPIN"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleHitVerify}
                    disabled={hitVerifying || !hitForm.phone || !hitForm.mpin}
                    className={btnPrimary}
                  >
                    {hitVerifying && <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />}
                    {hitVerifying ? 'Verifying...' : 'Verify & Connect'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════ Account Info Card ═══════ */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-lg text-slate-500">info</span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Account Info</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500">Account ID</span>
            <p className="text-slate-700 dark:text-slate-300 font-mono mt-0.5">{user?.id || '—'}</p>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500">Role</span>
            <p className="text-slate-700 dark:text-slate-300 capitalize mt-0.5">{user?.role?.replace('_', ' ') || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
