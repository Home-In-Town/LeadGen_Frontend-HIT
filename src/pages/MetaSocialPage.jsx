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
  getCommentReplyConfig,
  updateCommentReplyConfig,
  testCommentReplyPrompt,
} from '../api';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const TAB_CONFIG = [
  { key: 'hub',        label: 'Overview',       icon: 'hub',           path: '/meta-social' },
  { key: 'compose',    label: 'Create Post',    icon: 'edit_square',   path: '/meta-social/compose' },
  { key: 'posts',      label: 'My Posts',       icon: 'dynamic_feed',  path: '/meta-social/posts' },
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
      getSocialOverview({}).then(res => setOverview(res.data?.overview)).catch(() => {});
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

function PostsTab({ connection, addToast }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState('');
  const pages = connection?.pages || [];

  useEffect(() => {
    const pageId = selectedPageId || pages[0]?.pageId || '';
    if (!pageId) { setLoading(false); return; }
    setLoading(true);
    getAllPlatformPosts({ pageId, limit: 50 }).then(res => {
      setPosts(res.data?.posts || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedPageId]);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Page selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Posts ({posts.length})</h2>
        <select
          value={selectedPageId}
          onChange={e => setSelectedPageId(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
        >
          {pages.map(p => (
            <option key={p.pageId} value={p.pageId}>{p.pageName} {p.igAccountId ? '(+IG)' : ''}</option>
          ))}
        </select>
      </div>
      {posts.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-8 text-center">
          <p className="text-sm text-slate-500">No posts found. Connect your pages and start posting!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 12).map((post, i) => (
            <div key={post.id || i} className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 overflow-hidden">
              {post.full_picture || post.media_url ? (
                <img src={post.full_picture || post.media_url} alt="" className="w-full h-40 object-cover" />
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
            </div>
          ))}
        </div>
      )}
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
    </div>
  );
}

function AnalyticsTab({ connection }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-8 text-center">
      <span className="material-symbols-outlined text-5xl text-purple-500/40 mb-4 block">monitoring</span>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Social Analytics</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Page insights, post performance, follower growth — coming in next update.</p>
    </div>
  );
}

function AdLauncherTab({ connection, addToast }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-8 text-center">
      <span className="material-symbols-outlined text-5xl text-orange-500/40 mb-4 block">rocket_launch</span>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ad Campaign Launcher</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Create and launch Meta ad campaigns with targeting wizard — coming in next update.</p>
    </div>
  );
}
