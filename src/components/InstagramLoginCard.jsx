import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  getInstagramLoginStatus,
  initiateInstagramLogin,
  disconnectInstagramLogin,
} from '../api';
import { IG_ERROR_TEXT } from '../utils/igLoginErrors';

const PERMISSIONS = [
  { scope: 'instagram_business_basic', label: 'Read your profile' },
  { scope: 'instagram_business_content_publish', label: 'Publish posts' },
  { scope: 'instagram_business_manage_comments', label: 'Reply to comments' },
  { scope: 'instagram_business_manage_messages', label: 'Reply to messages' },
];

const primaryButton =
  'rounded-2xl bg-black px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-white transition-all hover:-translate-y-[1px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed';
const dangerButton =
  'rounded-2xl border border-red-300 bg-white dark:bg-[#1e293b] px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-red-600 transition-all hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed';
const labelClass = 'mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500';

const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
};

const Banner = ({ tone, children }) => {
  const tones = {
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  return (
    <div role="alert" className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${tones[tone]}`}>
      {children}
    </div>
  );
};

const InstagramLoginCard = () => {
  const { addToast } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [redirectError, setRedirectError] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);
  const handledRedirect = useRef(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await getInstagramLoginStatus();
      setStatus(res.data);
    } catch (err) {
      setLoadError(err?.response?.data?.error || 'Could not load the Instagram connection status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Instagram sends the user back with ?ig=connected or ?ig_error=<code>.
  // Handle once, then strip the params so a refresh does not repeat the message.
  useEffect(() => {
    if (handledRedirect.current) return;
    const ok = searchParams.get('ig');
    const code = searchParams.get('ig_error');
    if (!ok && !code) return;
    handledRedirect.current = true;
    if (code) {
      const text = IG_ERROR_TEXT[code] || IG_ERROR_TEXT.unknown;
      const detail = searchParams.get('ig_msg');
      setRedirectError(detail ? `${text} (${detail})` : text);
      addToast(text, 'error', 'Instagram');
    } else if (ok === 'connected') {
      addToast('Instagram connected', 'success', 'Instagram');
    }
    const next = new URLSearchParams(searchParams);
    ['ig', 'ig_error', 'ig_msg'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, addToast]);

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Instagram? Auto-replies and publishing will stop for this account.')) return;
    setDisconnecting(true);
    try {
      await disconnectInstagramLogin();
      addToast('Instagram disconnected', 'success', 'Instagram');
      await loadStatus();
    } catch (err) {
      addToast(err?.response?.data?.error || 'Could not disconnect Instagram.', 'error', 'Instagram');
    } finally {
      setDisconnecting(false);
    }
  };

  const state = status?.state;
  const connected = !!status?.connected;
  const missing = status?.missingScopes || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-600 text-white shadow-lg">
          <span className="material-symbols-outlined text-2xl">photo_camera</span>
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Instagram Login</h2>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Connect a Business or Creator account directly, no Facebook Page needed
          </p>
        </div>
      </div>

      {redirectError && <Banner tone="red">{redirectError}</Banner>}
      {loadError && <Banner tone="red">{loadError}</Banner>}
      {state === 'expired' && (
        <Banner tone="red">Instagram connection expired. Reconnect to keep posting and replying.</Banner>
      )}
      {state === 'expiring' && (
        <Banner tone="amber">
          Token expires in {status.daysLeft} days. Reconnect to renew it.
        </Banner>
      )}
      {state === 'missing_scopes' && (
        <Banner tone="amber">
          Some permissions were not allowed: {missing.join(', ')}. Reconnect and allow all permissions.
        </Banner>
      )}

      {loading && !status ? (
        <p className="text-sm font-semibold text-slate-500">Loading...</p>
      ) : status && status.appConfigured === false ? (
        <Banner tone="amber">Instagram Login is not configured on the server.</Banner>
      ) : connected ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-5">
            <div className={labelClass}>Connected account</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">@{status.username}</div>
            <div className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {status.accountType || 'Professional'} account
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Expires on {formatDate(status.tokenExpiresAt)}
              {typeof status.daysLeft === 'number' && !status.tokenExpired ? ` (${status.daysLeft} days left)` : ''}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Live updates: {status.webhookSubscribed ? 'on' : 'off'}
            </div>
          </div>

          <div>
            <div className={labelClass}>Allowed permissions</div>
            <div className="flex flex-wrap gap-2">
              {PERMISSIONS.map((p) => {
                const ok = (status.grantedScopes || []).includes(p.scope);
                return (
                  <span
                    key={p.scope}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      ok
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {p.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(state === 'expired' || state === 'expiring' || state === 'missing_scopes') && (
              <button type="button" className={primaryButton} onClick={initiateInstagramLogin}>
                {state === 'missing_scopes' ? 'Reconnect and allow all permissions' : 'Reconnect Instagram'}
              </button>
            )}
            <button type="button" className={dangerButton} onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
            <Link to="/meta-social" className="text-sm font-bold text-indigo-600 hover:underline">
              Open Social Hub
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className={labelClass}>What you allow</div>
            <ul className="list-disc space-y-1 pl-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {PERMISSIONS.map((p) => (
                <li key={p.scope}>{p.label}</li>
              ))}
            </ul>
          </div>
          <button type="button" className={primaryButton} onClick={initiateInstagramLogin}>
            Connect with Instagram
          </button>
        </div>
      )}
    </div>
  );
};

export default InstagramLoginCard;
