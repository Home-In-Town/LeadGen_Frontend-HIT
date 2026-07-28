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
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-8 text-center">
      <span className="material-symbols-outlined text-5xl text-primary/40 mb-4 block">edit_square</span>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Post Composer</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Create and schedule posts for Facebook Page and Instagram — coming in next update.</p>
    </div>
  );
}

function PostsTab({ connection, addToast }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPlatformPosts({}).then(res => {
      setPosts(res.data?.posts || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Your Posts ({posts.length})</h2>
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
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-8 text-center">
      <span className="material-symbols-outlined text-5xl text-green-500/40 mb-4 block">forum</span>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">AI Comment Reply</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Configure auto-reply settings, view reply logs, and test your AI prompt — coming in next update.</p>
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
