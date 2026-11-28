import { useCallback, useEffect, useState } from 'react';
import { getLeadWebConversations } from '../../api';

const formatWhen = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

/**
 * What this lead said to the website advisor (Priya on homeintown.ai) after opening
 * the tracking link, newest visit first. Live: re-reads when the server emits
 * `web_chat_update` for this lead.
 */
const WebConversationSection = ({ leadId, socket }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!leadId) return;
    try {
      const res = await getLeadWebConversations(leadId);
      setConversations(res.data?.data || []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    let timer = null;
    // Several messages can arrive together; reload once.
    const onUpdate = () => { clearTimeout(timer); timer = setTimeout(load, 400); };
    socket.on('web_chat_update', onUpdate);
    return () => { clearTimeout(timer); socket.off('web_chat_update', onUpdate); };
  }, [socket, load]);

  const total = conversations.reduce((n, c) => n + (c.userMessageCount || 0), 0);

  return (
    <div className="space-y-4" data-testid="web-conversations">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Website advisor chats (Priya)</h3>
          <p className="text-xs text-slate-500">
            {loading ? 'Loading…' : conversations.length === 0
              ? 'No chat yet. It appears here when the lead talks to Priya after opening the link.'
              : `${conversations.length} visit${conversations.length === 1 ? '' : 's'} · ${total} question${total === 1 ? '' : 's'} from the lead`}
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">Could not load the conversation. Try again in a moment.</p>}

      {conversations.map((c) => (
        <div key={c.sessionId} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-900/40 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{c.projectName || c.projectSlug || 'Website visit'}</span>
            <span>{formatWhen(c.startedAt)}</span>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {(c.messages || []).length === 0 && <p className="text-xs text-slate-400">Opened the page, no messages.</p>}
            {(c.messages || []).map((m, i) => (
              <div key={`${c.sessionId}-${i}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={`mt-1 text-[10px] ${m.role === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {m.role === 'user' ? 'Lead' : 'Priya'} · {m.channel === 'voice' ? 'voice' : 'typed'} · {formatWhen(m.at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WebConversationSection;
