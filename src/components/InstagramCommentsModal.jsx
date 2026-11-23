import React, { useCallback, useEffect, useState } from 'react';
import { getInstagramPostComments, replyToInstagramComment } from '../api';

// Manual (user-written) comment replies for an Instagram post. The Comment
// Reply tab only configured AI auto-replies, so there was no visible way to
// answer a single comment by hand.
const InstagramCommentsModal = ({ post, pageId, addToast, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [sendingId, setSendingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getInstagramPostComments(post.id, { pageId });
      if (res.data?.success === false) {
        setError(res.data.error || 'Could not load comments');
        setComments([]);
      } else {
        setComments(res.data?.comments || []);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load comments');
    } finally {
      setLoading(false);
    }
  }, [post.id, pageId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (comment) => {
    const message = (drafts[comment.id] || '').trim();
    if (!message) return;
    setSendingId(comment.id);
    try {
      const res = await replyToInstagramComment(comment.id, { message }, { pageId });
      if (res.data?.success === false) {
        addToast(res.data.error || 'Reply failed', 'error');
        return;
      }
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                replies: {
                  data: [
                    ...(c.replies?.data || []),
                    { id: res.data?.replyId || `local-${Date.now()}`, text: message, username: 'You', timestamp: new Date().toISOString() },
                  ],
                },
              }
            : c
        )
      );
      setDrafts((d) => ({ ...d, [comment.id]: '' }));
      addToast('Reply sent', 'success');
    } catch (err) {
      addToast(err?.response?.data?.error || 'Reply failed', 'error');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Instagram comments"
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 p-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Comments</h3>
          <div className="flex items-center gap-3">
            <button onClick={load} className="text-[11px] font-bold text-slate-500 hover:text-slate-700">
              Refresh
            </button>
            <button onClick={onClose} className="text-[11px] font-bold text-slate-500 hover:text-slate-700">
              Close
            </button>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          {loading && <p className="text-xs text-slate-500">Loading...</p>}
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}
          {!loading && !error && comments.length === 0 && (
            <p className="text-xs text-slate-500">No comments yet.</p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-100 dark:border-white/5 p-3">
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                @{c.username || 'user'}
                {c.timestamp && (
                  <span className="ml-2 text-[10px] font-normal text-slate-400">
                    {new Date(c.timestamp).toLocaleString()}
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{c.text}</p>

              {(c.replies?.data || []).map((r) => (
                <div key={r.id} className="mt-2 ml-4 border-l-2 border-slate-200 pl-3">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">@{r.username || 'user'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{r.text}</p>
                </div>
              ))}

              <div className="mt-3 flex gap-2">
                <input
                  value={drafts[c.id] || ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                  placeholder="Write a reply"
                  aria-label={`Reply to ${c.username || 'comment'}`}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => send(c)}
                  disabled={sendingId === c.id || !(drafts[c.id] || '').trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {sendingId === c.id ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstagramCommentsModal;
