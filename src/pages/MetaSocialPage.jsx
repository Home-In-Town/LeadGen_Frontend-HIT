import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getMetaSocialStatus,
  initiateMetaSocialConnect,
  disconnectMetaSocial,
  getAllPlatformPosts,
  getSocialOverview,
  getCommentReplyStats,
  getMetaSocialPages,
  createSocialPost,
  listSocialPosts,
  deleteSocialPost,
  publishSocialPostNow,
  getFacebookScheduledPosts,
  getCommentReplyConfig,
  updateCommentReplyConfig,
  testCommentReplyPrompt,
  getDmReplyStats,
  getFBPageInsights,
  getIGAccountInsights,
  getAdAccounts,
  getAdPerformance,
  getAdCampaigns,
  getMetaConversations,
  getFBConversationMessages,
  sendFBMessageReply,
  getIGConversationMessages,
  sendIGMessageReply,
} from '../api';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const TAB_CONFIG = [
  { key: 'hub',        label: 'Overview',       icon: 'hub',           path: '/meta-social' },
  { key: 'compose',    label: 'Create Post',    icon: 'edit_square',   path: '/meta-social/compose' },
  { key: 'posts',      label: 'My Posts',       icon: 'dynamic_feed',  path: '/meta-social/posts' },
  { key: 'messages',   label: 'Messages',       icon: 'chat',          path: '/meta-social/messages' },
  { key: 'comments',   label: 'Comment Reply',  icon: 'forum',         path: '/meta-social/comments' },
  { key: 'analytics',  label: 'Analytics',      icon: 'monitoring',    path: '/meta-social/analytics' },
  { key: 'ad-launcher', label: 'Ad Launcher',   icon: 'rocket_launch', path: '/meta-social/ad-launcher' },
];

export default function MetaSocialPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  // Determine active tab from URL
  const pathSuffix = location.pathname.replace('/meta-social', '') || '';
  const activeTab = TAB_CONFIG.find(t => t.path === location.pathname)?.key || 'hub';

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMetaSocialStatus();
      setConnection(res.data);
    } catch (err) {
      setConnection({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (connection?.connected) {
      // Use the page that has IG linked (most relevant), fallback to first page
      const mainPage = connection.pages?.find(p => p.igAccountId) || connection.pages?.[0];
      const pageId = mainPage?.pageId || '';
      getSocialOverview({ pageId }).then(res => setOverview(res.data?.overview)).catch(() => {});
    }
  }, [connection?.connected]);

  // ── Not Connected State ─────────────────────────────────────────────────────
  if (!loading && !connection?.connected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-3xl text-white">share</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connect Meta Social</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Connect your Facebook Pages and Instagram accounts to publish posts, auto-reply to comments, view analytics, and launch ad campaigns — all from one place.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-blue-500 text-sm">thumb_up</span> Auto Post</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-green-500 text-sm">forum</span> Auto Reply</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-purple-500 text-sm">monitoring</span> Analytics</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-orange-500 text-sm">rocket_launch</span> Ad Campaigns</span>
          </div>
          <button
            onClick={() => initiateMetaSocialConnect()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
          >
            <span className="material-symbols-outlined text-lg">link</span>
            Connect Facebook & Instagram
          </button>
          <p className="text-[10px] text-slate-400 mt-4">
            Requires a Facebook Page. Instagram Business/Creator account is optional.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ── Connected — Tab Navigation ──────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'hub' && <OverviewTab connection={connection} overview={overview} navigate={navigate} addToast={addToast} onDisconnect={async () => {
        try {
          await disconnectMetaSocial();
          addToast('Meta Social disconnected', 'success');
          setConnection({ connected: false });
        } catch { addToast('Failed to disconnect', 'error'); }
      }} />}

      {activeTab === 'compose' && <ComposeTab connection={connection} addToast={addToast} />}
      {activeTab === 'posts' && <PostsTab connection={connection} addToast={addToast} />}
      {activeTab === 'messages' && <MessagesTab connection={connection} addToast={addToast} />}
      {activeTab === 'comments' && <CommentsTab addToast={addToast} />}
      {activeTab === 'analytics' && <AnalyticsTab connection={connection} />}
      {activeTab === 'ad-launcher' && <AdLauncherTab connection={connection} addToast={addToast} />}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ connection, overview, navigate, addToast, onDisconnect }) {
  const pages = connection?.pages || [];

  return (
    <div className="space-y-5">
      {/* Connection Info */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Connection Status</h3>
          <button onClick={onDisconnect} className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors">
            Disconnect
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-3">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Pages</p>
            <p className="text-lg font-black text-blue-700 dark:text-blue-300">{pages.length}</p>
          </div>
          <div className="rounded-xl bg-purple-50 dark:bg-purple-500/10 p-3">
            <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Instagram</p>
            <p className="text-lg font-black text-purple-700 dark:text-purple-300">{pages.filter(p => p.igAccountId).length}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">FB Followers</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{overview?.facebook?.followers?.toLocaleString() || '—'}</p>
          </div>
          <div className="rounded-xl bg-pink-50 dark:bg-pink-500/10 p-3">
            <p className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">IG Followers</p>
            <p className="text-lg font-black text-pink-700 dark:text-pink-300">{overview?.instagram?.followers?.toLocaleString() || '—'}</p>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Connected Pages</h3>
        <div className="space-y-2">
          {pages.map(page => (
            <div key={page.pageId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400">public</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{page.pageName}</p>
                  {page.igUsername && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">@{page.igUsername}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {page.igAccountId && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[9px] font-bold text-white">
                    IG
                  </span>
                )}
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  page.subscribedToFeed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {page.subscribedToFeed ? 'Webhook Active' : 'No Webhook'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={() => navigate('/meta-social/compose')}
          className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5 text-left hover:shadow-md transition-all group">
          <span className="material-symbols-outlined text-2xl text-primary mb-2 block group-hover:scale-110 transition-transform">edit_square</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Create Post</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Publish to FB + IG</p>
        </button>
        <button onClick={() => navigate('/meta-social/comments')}
          className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5 text-left hover:shadow-md transition-all group">
          <span className="material-symbols-outlined text-2xl text-green-500 mb-2 block group-hover:scale-110 transition-transform">forum</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Auto Reply</p>
          <p className="text-[10px] text-slate-500 mt-0.5">AI-powered comment replies</p>
        </button>
        <button onClick={() => navigate('/meta-social/analytics')}
          className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5 text-left hover:shadow-md transition-all group">
          <span className="material-symbols-outlined text-2xl text-purple-500 mb-2 block group-hover:scale-110 transition-transform">monitoring</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Analytics</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Performance insights</p>
        </button>
      </div>
    </div>
  );
}

// ── Placeholder Tabs (to be expanded) ────────────────────────────────────────

function ComposeTab({ connection, addToast }) {
  const [message, setMessage] = useState('');
  const [platforms, setPlatforms] = useState(['facebook']);
  const [publishType, setPublishType] = useState('instant');
  const [scheduledAt, setScheduledAt] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');

  const pages = connection?.pages || [];
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);
  const selectedPage = pages[selectedPageIdx];

  const handlePublish = async () => {
    if (!message.trim() && !mediaUrl.trim()) { addToast('Message or image URL is required', 'error'); return; }
    if (!selectedPage) { addToast('No page connected', 'error'); return; }
    if (publishType === 'scheduled' && !scheduledAt) { addToast('Select a schedule date', 'error'); return; }

    setPublishing(true);
    try {
      const payload = {
        message: message.trim(),
        platforms,
        pageId: selectedPage.pageId,
        igAccountId: selectedPage.igAccountId || null,
        publishType,
        mediaType: mediaUrl ? 'image' : 'text',
        mediaUrls: mediaUrl ? [mediaUrl.trim()] : [],
        ...(publishType === 'scheduled' && { scheduledAt }),
      };
      await createSocialPost(payload);
      addToast(publishType === 'scheduled' ? 'Post scheduled!' : 'Post published!', 'success');
      setMessage(''); setMediaUrl(''); setScheduledAt('');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to publish', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Post</h3>

        {/* Page selector */}
        {pages.length > 1 && (
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Post to Page</label>
            <select value={selectedPageIdx} onChange={e => setSelectedPageIdx(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold bg-slate-50 dark:bg-white/[0.04]">
              {pages.map((p, i) => (
                <option key={p.pageId} value={i}>{p.pageName} {p.igAccountId ? ' ✓ Instagram' : ''}</option>
              ))}
            </select>
            {!selectedPage?.igAccountId && (
              <p className="text-[9px] text-amber-500 mt-1">This page has no Instagram linked. Select "ONE EMPLOYEE" for IG posting.</p>
            )}
          </div>
        )}

        {/* Platform selector */}
        <div className="flex gap-2">
          <button onClick={() => setPlatforms(p => p.includes('facebook') ? p.filter(x => x !== 'facebook') : [...p, 'facebook'])}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${platforms.includes('facebook') ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
            <span className="material-symbols-outlined text-sm">public</span> Facebook
          </button>
          <button onClick={() => setPlatforms(p => p.includes('instagram') ? p.filter(x => x !== 'instagram') : [...p, 'instagram'])}
            disabled={!selectedPage?.igAccountId}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 ${platforms.includes('instagram') ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
            <span className="material-symbols-outlined text-sm">photo_camera</span> Instagram
          </button>
        </div>

        {/* Message */}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write your post caption..."
          className="w-full p-4 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none resize-none h-32"
        />
        <p className="text-[10px] text-slate-400 text-right">{message.length} / 2200</p>

        {/* Image Upload or URL */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Image / Media</label>
          <div className="space-y-2">
            <input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) { addToast('Image must be under 5MB', 'error'); return; }
              // Upload to R2 via existing upload endpoint
              try {
                const formData = new FormData();
                formData.append('document', file);
                const { default: leadsApi } = await import('../api');
                const uploadRes = await leadsApi.post('/voice/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                // For now, use direct URL input as R2 upload endpoint may not exist for social
                addToast('For now, paste a public image URL below. Direct upload coming soon.', 'info');
              } catch {
                addToast('Upload not available yet. Use public image URL.', 'info');
              }
              e.target.value = '';
            }}
              className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
              <span className="text-[9px] text-slate-400 uppercase">or paste URL</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
            </div>
            <input type="url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg (must be publicly accessible)"
              className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
          </div>
          {platforms.includes('instagram') && !mediaUrl && (
            <p className="text-[10px] text-amber-500 mt-1">Instagram requires an image or video</p>
          )}
        </div>

        {/* Schedule toggle */}
        <div className="flex items-center gap-3">
          <button onClick={() => setPublishType('instant')} className={`px-3 py-2 rounded-lg text-xs font-bold ${publishType === 'instant' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
            Publish Now
          </button>
          <button onClick={() => setPublishType('scheduled')} className={`px-3 py-2 rounded-lg text-xs font-bold ${publishType === 'scheduled' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
            Schedule
          </button>
        </div>

        {publishType === 'scheduled' && (
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
            min={new Date(Date.now() + 11 * 60000).toISOString().slice(0, 16)}
            className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
        )}

        {/* Publish button */}
        <button onClick={handlePublish} disabled={publishing || platforms.length === 0}
          className="w-full py-3 rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25 hover:brightness-110 transition-all disabled:opacity-50">
          {publishing ? 'Publishing...' : publishType === 'scheduled' ? 'Schedule Post' : 'Publish Post'}
        </button>
      </div>

      {/* Info */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 p-3">
        <p className="text-[10px] text-blue-700 dark:text-blue-300">
          <strong>Page:</strong> {selectedPage?.pageName || 'None'} | <strong>IG:</strong> {selectedPage?.igUsername ? `@${selectedPage.igUsername}` : 'Not linked'}
        </p>
      </div>
    </div>
  );
}

const PAGE_SIZE = 12;

function ScheduledRow({ post, onPublishNow, onCancel, busy }) {
  const when = post.scheduledAt ? new Date(post.scheduledAt) : null;
  const thumb = post.mediaUrls?.[0];
  const isFbNative = post.source === 'facebook-native';

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-3">
      {thumb
        ? <img src={thumb} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
        : <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 grid place-items-center">
            <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
          </div>}

      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">{post.message || '(no caption)'}</p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
          {when && <span className="font-bold">{when.toLocaleString()}</span>}
          {(post.platforms || []).map(p => (
            <span key={p} className={`uppercase font-bold ${p === 'instagram' ? 'text-pink-500' : 'text-blue-500'}`}>{p}</span>
          ))}
          {isFbNative && <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5">on Facebook</span>}
        </div>
      </div>

      {!isFbNative && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onPublishNow(post)}
            disabled={busy}
            className="rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50"
          >
            Post now
          </button>
          <button
            onClick={() => onCancel(post)}
            disabled={busy}
            className="rounded-lg border border-red-200 dark:border-red-500/20 px-2.5 py-1.5 text-[10px] font-bold text-red-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function PostsTab({ connection, addToast }) {
  const [posts, setPosts] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [errors, setErrors] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const pages = connection?.pages || [];

  useEffect(() => {
    // Default to page with IG linked (most relevant page)
    if (!selectedPageId && pages.length > 0) {
      const igPage = pages.find(p => p.igAccountId);
      setSelectedPageId(igPage?.pageId || pages[0]?.pageId || '');
    }
  }, [pages]);

  const load = async (pageId) => {
    if (!pageId) { setLoading(false); return; }

    // Published posts from the platforms, our own scheduled queue, and anything
    // scheduled natively on Facebook — fetched together so one failure can't
    // hide the rest.
    const [platform, ours, fbNative] = await Promise.allSettled([
      getAllPlatformPosts({ pageId, limit: 50 }),
      listSocialPosts({ status: 'scheduled', limit: 50 }),
      getFacebookScheduledPosts({ pageId, limit: 50 }),
    ]);

    const problems = [];

    if (platform.status === 'fulfilled') {
      setPosts(platform.value.data?.posts || []);
      // getAllPosts always returns success:true, reporting per-platform
      // failures in fbError / igError. Surfacing them matters: a expired token
      // or missing permission otherwise looks identical to "no posts yet".
      const { fbError, igError } = platform.value.data || {};
      if (fbError) problems.push(`Facebook: ${fbError}`);
      if (igError) problems.push(`Instagram: ${igError}`);
    } else {
      setPosts([]);
      problems.push(platform.reason?.response?.data?.error || 'Could not load published posts');
    }

    const ourScheduled = ours.status === 'fulfilled' ? (ours.value.data?.posts || []) : [];
    const nativeScheduled = fbNative.status === 'fulfilled'
      ? (fbNative.value.data?.posts || []).map(p => ({
          postId: p.id,
          message: p.message,
          scheduledAt: p.scheduled_publish_time ? new Date(p.scheduled_publish_time * 1000) : null,
          platforms: ['facebook'],
          mediaUrls: p.full_picture ? [p.full_picture] : [],
          source: 'facebook-native',
        }))
      : [];

    setScheduled(
      [...ourScheduled, ...nativeScheduled].sort(
        (a, b) => new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0)
      )
    );
    setErrors(problems);
  };

  useEffect(() => {
    setLoading(true);
    setVisible(PAGE_SIZE);
    load(selectedPageId).finally(() => setLoading(false));
  }, [selectedPageId]);

  const refresh = async () => {
    setRefreshing(true);
    await load(selectedPageId);
    setRefreshing(false);
  };

  const handlePublishNow = async (post) => {
    setBusyId(post.postId);
    try {
      await publishSocialPostNow(post.postId);
      addToast('Publishing now', 'success');
      await load(selectedPageId);
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not publish', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (post) => {
    setBusyId(post.postId);
    try {
      await deleteSocialPost(post.postId);
      addToast('Scheduled post cancelled', 'success');
      await load(selectedPageId);
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not cancel', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const shown = posts.slice(0, visible);

  return (
    <div className="space-y-4">
      {/* Page selector + refresh */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Posts</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[14px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {pages.length > 1 && (
            <select
              value={selectedPageId}
              onChange={e => setSelectedPageId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              {pages.map(p => (
                <option key={p.pageId} value={p.pageId}>{p.pageName} {p.igAccountId ? '(+IG)' : ''}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Real errors, instead of a misleading "no posts" empty state */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-3">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Some posts could not be loaded</p>
          <ul className="mt-1 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i} className="text-[11px] text-amber-800 dark:text-amber-300">{e}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] text-amber-800 dark:text-amber-300">
            If this mentions an expired or invalid token, reconnect from the Overview tab.
          </p>
        </div>
      )}

      {/* Scheduled queue — what is going out next */}
      {scheduled.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Scheduled ({scheduled.length})
          </h3>
          <div className="space-y-2">
            {scheduled.map(p => (
              <ScheduledRow
                key={p.postId}
                post={p}
                busy={busyId === p.postId}
                onPublishNow={handlePublishNow}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Published */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Published ({posts.length})
        </h3>

        {posts.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-8 text-center">
            <p className="text-sm text-slate-500">
              {errors.length > 0
                ? 'No posts could be loaded — see the message above.'
                : 'No posts yet. Create one from the Create Post tab.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((post, i) => (
                <a
                  key={post.id || i}
                  href={post.permalink_url || post.permalink || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 overflow-hidden hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                >
                  {post.full_picture || post.media_url || post.thumbnail_url ? (
                    <img src={post.full_picture || post.thumbnail_url || post.media_url} alt="" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="h-20 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900" />
                  )}
                  <div className="p-3">
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{post.message || post.caption || '(no caption)'}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[11px]">favorite</span> {post.likes_count || 0}</span>
                      <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[11px]">chat_bubble</span> {post.comments_count || 0}</span>
                      {post.shares_count > 0 && <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[11px]">share</span> {post.shares_count}</span>}
                      <span className={`ml-auto uppercase font-bold ${post.platform === 'instagram' ? 'text-pink-500' : 'text-blue-500'}`}>{post.platform}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {visible < posts.length && (
              <div className="flex justify-center pt-1">
                <button
                  onClick={() => setVisible(v => v + PAGE_SIZE)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Load more ({posts.length - visible} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CommentsTab({ addToast }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testComment, setTestComment] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      getCommentReplyConfig().then(r => setConfig(r.data?.config)),
      getCommentReplyStats().then(r => setStats(r.data?.stats)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (updates) => {
    setSaving(true);
    try {
      const res = await updateCommentReplyConfig(updates);
      setConfig(res.data?.config);
      addToast('Settings saved', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testComment.trim()) { addToast('Enter a sample comment', 'error'); return; }
    setTesting(true); setTestResult(null);
    try {
      const res = await testCommentReplyPrompt({ sampleComment: testComment });
      setTestResult(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 text-center">
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{stats.today}</p>
            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Today</p>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-3 text-center">
            <p className="text-lg font-black text-blue-700 dark:text-blue-300">{stats.thisWeek}</p>
            <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">This Week</p>
          </div>
          <div className="rounded-xl bg-purple-50 dark:bg-purple-500/10 p-3 text-center">
            <p className="text-lg font-black text-purple-700 dark:text-purple-300">{stats.total}</p>
            <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">Total</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-center">
            <p className="text-lg font-black text-slate-700 dark:text-slate-300">{stats.skipped}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase">Skipped</p>
          </div>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Auto Comment Reply</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">AI will automatically reply to comments on your posts</p>
          </div>
          <button onClick={() => handleSave({ enabled: !config?.enabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${config?.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config?.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Platform toggles */}
        <div className="flex gap-3 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config?.facebookEnabled !== false} onChange={e => handleSave({ facebookEnabled: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Facebook</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config?.instagramEnabled || false} onChange={e => handleSave({ instagramEnabled: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Instagram</span>
          </label>
        </div>
      </div>

      {/* AI Prompt */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Reply Prompt</h3>
        <p className="text-[10px] text-slate-500">Customize how AI replies to comments. Leave empty for default behavior.</p>
        <textarea
          value={config?.aiPrompt || ''}
          onChange={e => setConfig(prev => ({ ...prev, aiPrompt: e.target.value }))}
          placeholder="e.g., Always mention our current offer of 10% off. Invite people to DM for pricing. Keep replies friendly and short."
          className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm resize-none h-24 focus:border-primary focus:outline-none"
        />
        <button onClick={() => handleSave({ aiPrompt: config?.aiPrompt || '' })} disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-xs font-bold text-white disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Prompt'}
        </button>
      </div>

      {/* Rate Limits */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rate Limits & Timing</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Reply Delay (seconds)</label>
            <input type="number" value={Math.round((config?.replyDelayMs || 30000) / 1000)}
              onChange={e => setConfig(prev => ({ ...prev, replyDelayMs: Number(e.target.value) * 1000 }))}
              min="10" max="300"
              className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-slate-50 dark:bg-white/[0.04]" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Max Replies / Hour</label>
            <input type="number" value={config?.maxRepliesPerHour || 20}
              onChange={e => setConfig(prev => ({ ...prev, maxRepliesPerHour: Number(e.target.value) }))}
              min="1" max="60"
              className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-slate-50 dark:bg-white/[0.04]" />
          </div>
        </div>
        <button onClick={() => handleSave({ replyDelayMs: config?.replyDelayMs, maxRepliesPerHour: config?.maxRepliesPerHour })} disabled={saving}
          className="px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-xs font-bold text-white disabled:opacity-50">
          Save Limits
        </button>
      </div>

      {/* Test AI */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Test AI Reply</h3>
        <input type="text" value={testComment} onChange={e => setTestComment(e.target.value)}
          placeholder="Type a sample comment (e.g., 'What is the price of 2BHK?')"
          className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:border-primary focus:outline-none" />
        <button onClick={handleTest} disabled={testing}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-xs font-bold text-white disabled:opacity-50">
          {testing ? 'Generating...' : 'Test Reply'}
        </button>
        {testResult && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3">
            <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">AI would reply:</p>
            <p className="text-sm text-emerald-900 dark:text-emerald-200">{testResult.generatedReply}</p>
            <p className="text-[9px] text-emerald-500 mt-1">Generated in {testResult.latencyMs}ms</p>
          </div>
        )}
      </div>

      <DmReplySettings config={config} setConfig={setConfig} onSave={handleSave} saving={saving} />
    </div>
  );
}

/**
 * AI auto-reply for private messages. Separate toggles from comments on purpose:
 * a business often wants instant DM answers while still hand-writing public
 * comment replies (or the reverse).
 */
function DmReplySettings({ config, setConfig, onSave, saving }) {
  const [stats, setStats] = useState(null);
  const dm = config?.dmReply || {};

  const loadStats = () => {
    getDmReplyStats().then(r => setStats(r.data?.stats)).catch(() => {});
  };
  useEffect(loadStats, []);

  const patchDm = (patch) => setConfig(prev => ({ ...prev, dmReply: { ...(prev?.dmReply || {}), ...patch } }));
  const saveDm = (patch) => onSave({ dmReply: { ...dm, ...patch } }).then(loadStats);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI DM Reply</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            AI answers Messenger and Instagram Direct messages automatically
          </p>
        </div>
        <button
          onClick={() => saveDm({ enabled: !dm.enabled })}
          className={`relative w-12 h-6 rounded-full transition-colors ${dm.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dm.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-2 text-center">
            <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{stats.repliedToday}</p>
            <p className="text-[9px] font-bold text-emerald-600 uppercase">Today</p>
          </div>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-2 text-center">
            <p className="text-base font-black text-blue-700 dark:text-blue-300">{stats.replied}</p>
            <p className="text-[9px] font-bold text-blue-600 uppercase">Replied</p>
          </div>
          <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 p-2 text-center">
            <p className="text-base font-black text-purple-700 dark:text-purple-300">{stats.uniqueSenders}</p>
            <p className="text-[9px] font-bold text-purple-600 uppercase">People</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-2 text-center">
            <p className="text-base font-black text-slate-700 dark:text-slate-300">{stats.skipped}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase">Skipped</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={dm.facebookEnabled !== false}
            onChange={e => saveDm({ facebookEnabled: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Messenger</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={dm.instagramEnabled !== false}
            onChange={e => saveDm({ instagramEnabled: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Instagram Direct</span>
        </label>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-500 block mb-1">DM Instructions (optional)</label>
        <textarea
          value={dm.aiPrompt || ''}
          onChange={e => patchDm({ aiPrompt: e.target.value })}
          placeholder="e.g., Always ask which project they are interested in and offer a site visit this weekend."
          className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm resize-none h-20 focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">Delay (sec)</label>
          <input type="number" min="0" max="120"
            value={Math.round((dm.replyDelayMs ?? 5000) / 1000)}
            onChange={e => patchDm({ replyDelayMs: Number(e.target.value) * 1000 })}
            className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-slate-50 dark:bg-white/[0.04]" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">Max / Hour</label>
          <input type="number" min="1" max="120"
            value={dm.maxRepliesPerHour ?? 30}
            onChange={e => patchDm({ maxRepliesPerHour: Number(e.target.value) })}
            className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-slate-50 dark:bg-white/[0.04]" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">Max / Person</label>
          <input type="number" min="1" max="50"
            value={dm.maxRepliesPerSender ?? 5}
            onChange={e => patchDm({ maxRepliesPerSender: Number(e.target.value) })}
            className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm bg-slate-50 dark:bg-white/[0.04]" />
        </div>
      </div>

      <p className="text-[10px] text-slate-500">
        After <strong>Max / Person</strong> automatic replies the thread is left for a human.
        Anyone who sends “stop” is never auto-replied to again.
      </p>

      <button
        onClick={() => saveDm({
          aiPrompt: dm.aiPrompt || '',
          replyDelayMs: dm.replyDelayMs,
          maxRepliesPerHour: dm.maxRepliesPerHour,
          maxRepliesPerSender: dm.maxRepliesPerSender,
        })}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-primary text-xs font-bold text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save DM Settings'}
      </button>
    </div>
  );
}

function MessagesTab({ connection, addToast }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const pages = connection?.pages || [];
  const [selectedPageId, setSelectedPageId] = useState('');

  useEffect(() => {
    if (!selectedPageId && pages.length > 0) {
      const igPage = pages.find(p => p.igAccountId);
      setSelectedPageId(igPage?.pageId || pages[0]?.pageId || '');
    }
  }, [pages]);

  useEffect(() => {
    if (!selectedPageId) return;
    setLoading(true);
    getMetaConversations({ pageId: selectedPageId, limit: 30 })
      .then(res => setConversations(res.data?.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [selectedPageId]);

  const openConversation = async (conv) => {
    setSelectedConv(conv);
    setMsgLoading(true);
    setMessages([]);
    try {
      const getter = conv.platform === 'instagram' ? getIGConversationMessages : getFBConversationMessages;
      const res = await getter(conv.id, { pageId: selectedPageId, limit: 30 });
      setMessages(res.data?.messages || []);
    } catch { addToast('Failed to load messages', 'error'); }
    finally { setMsgLoading(false); }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    const recipient = selectedConv.participants?.find(p => p.id !== selectedPageId);
    if (!recipient) { addToast('Cannot identify recipient', 'error'); return; }

    setSending(true);
    try {
      const sender = selectedConv.platform === 'instagram' ? sendIGMessageReply : sendFBMessageReply;
      await sender({ pageId: selectedPageId, recipientId: recipient.id, message: replyText.trim() });
      setMessages(prev => [...prev, { id: Date.now(), text: replyText.trim(), from: { name: 'You' }, createdTime: new Date().toISOString() }]);
      setReplyText('');
      addToast('Reply sent!', 'success');
    } catch (err) { addToast(err.response?.data?.error || 'Send failed', 'error'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="flex gap-4 h-[70vh]">
      {/* Conversations List */}
      <div className="w-80 flex-shrink-0 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-100 dark:border-white/5">
          <select value={selectedPageId} onChange={e => { setSelectedPageId(e.target.value); setSelectedConv(null); }}
            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-bold bg-white dark:bg-slate-900">
            {pages.map(p => <option key={p.pageId} value={p.pageId}>{p.pageName}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No conversations yet</div>
          ) : conversations.map(conv => (
            <button key={conv.id} onClick={() => openConversation(conv)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${selectedConv?.id === conv.id ? 'bg-primary/5' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                  {conv.participants?.map(p => p.name).join(', ') || 'Unknown'}
                </p>
                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${conv.platform === 'instagram' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                  {conv.platform === 'instagram' ? 'IG' : 'FB'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{conv.snippet || 'No message'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 overflow-hidden flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">chat</span>
              Select a conversation
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedConv.platform === 'instagram' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-blue-500'}`}>
                <span className="material-symbols-outlined text-sm text-white">{selectedConv.platform === 'instagram' ? 'photo_camera' : 'chat'}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{selectedConv.participants?.map(p => p.name).join(', ')}</p>
                <p className="text-[9px] text-slate-400 uppercase">{selectedConv.platform} Messenger</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No messages in this conversation</p>
              ) : (
                [...messages].reverse().map(msg => {
                  const isMe = msg.from?.name === 'You' || msg.from?.id === selectedPageId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-xs ${isMe ? 'bg-primary text-white rounded-br-md' : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white rounded-bl-md'}`}>
                        <p>{msg.text}</p>
                        <p className={`text-[9px] mt-1 ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                          {msg.createdTime ? new Date(msg.createdTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input */}
            <div className="p-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
              <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                placeholder="Type a reply..."
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:border-primary focus:outline-none" />
              <button onClick={handleSendReply} disabled={sending || !replyText.trim()}
                className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:brightness-110 transition-all">
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Analytics ────────────────────────────────────────────────────────────────

const PERIODS = [
  { key: 'day',     label: 'Daily' },
  { key: 'week',    label: 'Weekly' },
  { key: 'days_28', label: '28 days' },
];

/** Sum a Meta insights series — Meta returns one data point per period. */
function seriesTotal(metric) {
  if (!metric?.values?.length) return 0;
  return metric.values.reduce((sum, v) => sum + (Number(v.value) || 0), 0);
}

/** Latest point — right for running-total metrics like follower count. */
function seriesLatest(metric) {
  if (!metric?.values?.length) return 0;
  return Number(metric.values[metric.values.length - 1]?.value) || 0;
}

function StatCard({ label, value, hint, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
    pink: 'bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
  };
  return (
    <div className={`rounded-xl p-3 ${tones[tone]}`}>
      <p className="text-xl font-black leading-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase opacity-70 mt-0.5">{label}</p>
      {hint && <p className="text-[9px] opacity-60 mt-0.5">{hint}</p>}
    </div>
  );
}

function AnalyticsTab({ connection }) {
  const [period, setPeriod] = useState('day');
  const [loading, setLoading] = useState(true);
  const [fb, setFb] = useState(null);
  const [ig, setIg] = useState(null);
  const [overview, setOverview] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');

  const pages = connection?.pages || [];
  const activePage = pages.find(p => p.pageId === selectedPageId);

  useEffect(() => {
    if (!selectedPageId && pages.length) {
      const igPage = pages.find(p => p.igAccountId);
      setSelectedPageId(connection?.activePageId || igPage?.pageId || pages[0].pageId);
    }
  }, [pages, connection?.activePageId]);

  useEffect(() => {
    if (!selectedPageId) { setLoading(false); return; }
    setLoading(true);

    const params = { pageId: selectedPageId, period };
    Promise.allSettled([
      getFBPageInsights(params),
      activePage?.igAccountId ? getIGAccountInsights(params) : Promise.resolve(null),
      getSocialOverview({ pageId: selectedPageId }),
    ]).then(([fbRes, igRes, ovRes]) => {
      const problems = [];

      if (fbRes.status === 'fulfilled') {
        setFb(fbRes.value.data);
        if (!fbRes.value.data?.success) problems.push(`Facebook: ${fbRes.value.data?.error || 'unavailable'}`);
        // Meta retires insight metrics regularly. The backend reports which ones
        // it could not fetch rather than failing the whole request, so show them.
        if (fbRes.value.data?.unavailableMetrics?.length) {
          problems.push(`Facebook metrics Meta no longer provides: ${fbRes.value.data.unavailableMetrics.join(', ')}`);
        }
      } else {
        setFb(null);
        problems.push('Could not load Facebook insights');
      }

      if (igRes?.status === 'fulfilled' && igRes.value) {
        setIg(igRes.value.data);
        if (!igRes.value.data?.success) problems.push(`Instagram: ${igRes.value.data?.error || 'unavailable'}`);
        if (igRes.value.data?.unavailableMetrics?.length) {
          problems.push(`Instagram metrics Meta no longer provides: ${igRes.value.data.unavailableMetrics.join(', ')}`);
        }
      } else {
        setIg(null);
      }

      if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data?.overview || null);

      setNotes(problems);
    }).finally(() => setLoading(false));
  }, [selectedPageId, period, activePage?.igAccountId]);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const f = fb?.insights || {};
  const i = ig?.insights || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-[10px] font-bold transition-colors ${period === p.key ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {pages.length > 1 && (
            <select value={selectedPageId} onChange={e => setSelectedPageId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              {pages.map(p => <option key={p.pageId} value={p.pageId}>{p.pageName}</option>)}
            </select>
          )}
        </div>
      </div>

      {notes.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-0.5">
          {notes.map((n, k) => <p key={k} className="text-[11px] text-amber-800 dark:text-amber-300">{n}</p>)}
        </div>
      )}

      {overview && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Audience</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard tone="blue" label="FB followers" value={overview.facebook?.followers ?? '—'} hint={overview.facebook?.name} />
            <StatCard tone="pink" label="IG followers" value={overview.instagram?.followers ?? '—'} hint={overview.instagram?.username ? `@${overview.instagram.username}` : undefined} />
            <StatCard tone="pink" label="IG posts" value={overview.instagram?.posts ?? '—'} />
            <StatCard tone="slate" label="IG following" value={overview.instagram?.following ?? '—'} />
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Facebook Page</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard tone="blue" label="Views" value={seriesTotal(f.page_media_view).toLocaleString()} />
          <StatCard tone="blue" label="Reach" value={seriesTotal(f.page_total_media_view_unique).toLocaleString()} hint="unique people" />
          <StatCard tone="blue" label="Engagements" value={seriesTotal(f.page_post_engagements).toLocaleString()} />
          <StatCard tone="blue" label="Page views" value={seriesTotal(f.page_views_total).toLocaleString()} />
          <StatCard tone="emerald" label="Followers" value={seriesLatest(f.page_follows).toLocaleString()} hint="current total" />
          <StatCard tone="emerald" label="New follows" value={seriesTotal(f.page_daily_follows_unique).toLocaleString()} />
          <StatCard tone="slate" label="Unfollows" value={seriesTotal(f.page_daily_unfollows_unique).toLocaleString()} />
        </div>
      </div>

      {activePage?.igAccountId && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Instagram</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard tone="pink" label="Views" value={seriesTotal(i.views).toLocaleString()} />
            <StatCard tone="pink" label="Reach" value={seriesTotal(i.reach).toLocaleString()} />
            <StatCard tone="pink" label="Profile views" value={seriesTotal(i.profile_views).toLocaleString()} />
            <StatCard tone="emerald" label="Follower change" value={seriesTotal(i.follower_count).toLocaleString()} hint="in this window" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ads ──────────────────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { key: 'last_7d',  label: '7 days' },
  { key: 'last_30d', label: '30 days' },
  { key: 'last_90d', label: '90 days' },
  { key: 'maximum',  label: 'All time' },
];

const money = (n, currency = 'INR') => {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return v.toFixed(0);
  }
};

const STATUS_TONE = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  PAUSED: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  IN_PROCESS: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

function AdLauncherTab({ connection, addToast }) {
  const [datePreset, setDatePreset] = useState('last_30d');
  const [adAccounts, setAdAccounts] = useState([]);
  const [adAccountId, setAdAccountId] = useState('');
  const [summary, setSummary] = useState(null);
  const [byCampaign, setByCampaign] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currency = adAccounts.find(a => a.id === adAccountId)?.currency || 'INR';

  useEffect(() => {
    getAdAccounts()
      .then(res => {
        const list = res.data?.adAccounts || [];
        setAdAccounts(list);
        setAdAccountId(connection?.adAccountId || list[0]?.id || '');
      })
      .catch(err => setError(err.response?.data?.error || 'Could not load ad accounts'))
      .finally(() => setLoading(false));
  }, [connection?.adAccountId]);

  useEffect(() => {
    if (!adAccountId) return;
    setLoading(true);
    setError('');

    Promise.allSettled([
      getAdPerformance({ adAccountId, datePreset }),
      getAdCampaigns({ adAccountId }),
    ]).then(([perf, camp]) => {
      if (perf.status === 'fulfilled' && perf.value.data?.success) {
        setSummary(perf.value.data.summary);
        setByCampaign(perf.value.data.campaigns || []);
      } else {
        setSummary(null);
        setByCampaign([]);
        setError(perf.reason?.response?.data?.error || perf.value?.data?.error || 'Could not load ad performance');
      }

      if (camp.status === 'fulfilled' && camp.value.data?.success) {
        setCampaigns(camp.value.data.campaigns || []);
      }
    }).finally(() => setLoading(false));
  }, [adAccountId, datePreset]);

  // Spend for a campaign comes from the insights breakdown, which is a separate
  // call from the campaign list, so join them by id.
  const spendFor = (campaignId) => byCampaign.find(r => r.campaignId === campaignId);

  if (loading && !summary) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ads</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
            {DATE_PRESETS.map(p => (
              <button key={p.key} onClick={() => setDatePreset(p.key)}
                className={`px-2.5 py-1.5 text-[10px] font-bold transition-colors ${datePreset === p.key ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {adAccounts.length > 1 && (
            <select value={adAccountId} onChange={e => setAdAccountId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 max-w-[220px]">
              {adAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-3">
          <p className="text-[11px] text-amber-800 dark:text-amber-300">{error}</p>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard tone="amber" label="Spend" value={money(summary.spend, currency)} />
          <StatCard tone="emerald" label="Leads" value={(summary.leads || 0).toLocaleString()} />
          <StatCard tone="emerald" label="Cost / lead" value={summary.leads ? money(summary.costPerLead, currency) : '—'} />
          <StatCard tone="blue" label="Reach" value={(summary.reach || 0).toLocaleString()} />
          <StatCard tone="blue" label="Impressions" value={(summary.impressions || 0).toLocaleString()} />
          <StatCard tone="blue" label="Clicks" value={(summary.clicks || 0).toLocaleString()} hint={`CTR ${(summary.ctr || 0).toFixed(2)}%`} />
          <StatCard tone="slate" label="Cost / click" value={summary.clicks ? money(summary.cpc, currency) : '—'} />
          <StatCard tone="pink" label="Chats started" value={(summary.messagingStarted || 0).toLocaleString()} />
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
          Campaigns ({campaigns.length})
        </h3>

        {campaigns.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-orange-500/40 mb-2 block">rocket_launch</span>
            <p className="text-sm text-slate-500">No campaigns on this ad account yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.map(c => {
              const s = spendFor(c.id);
              return (
                <div key={c.id} className="rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {c.objective?.replace('OUTCOME_', '')}
                        {c.dailyBudget ? ` · ${money(c.dailyBudget, currency)}/day` : ''}
                        {c.lifetimeBudget ? ` · ${money(c.lifetimeBudget, currency)} total` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_TONE[c.effectiveStatus] || STATUS_TONE.PAUSED}`}>
                      {c.effectiveStatus || c.status}
                    </span>
                  </div>

                  {s && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-600 dark:text-slate-300">
                      <span><strong>{money(s.spend, currency)}</strong> spent</span>
                      <span><strong>{s.leads}</strong> leads</span>
                      {s.leads > 0 && <span><strong>{money(s.costPerLead, currency)}</strong> / lead</span>}
                      <span>{s.reach.toLocaleString()} reach</span>
                      <span>{s.clicks.toLocaleString()} clicks</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500">
        Campaigns are created and launched from the ad builder. This view reports what they are doing.
      </p>
    </div>
  );
}
