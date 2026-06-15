import { useState, useEffect } from 'react';
import { getLeadCallHistory } from '../api';

// ── style maps ───────────────────────────────────────────────────────────────

const SENTIMENT = {
  POSITIVE: { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: '😊' },
  NEUTRAL:  { cls: 'bg-slate-500/10   text-slate-600   border-slate-500/20',   icon: '😐' },
  NEGATIVE: { cls: 'bg-red-500/10     text-red-500     border-red-500/20',     icon: '😟' },
};

const INTEREST = {
  HIGH:   { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  MEDIUM: { cls: 'bg-amber-500/10   text-amber-600   border-amber-500/20'   },
  LOW:    { cls: 'bg-red-500/10     text-red-500     border-red-500/20'     },
};

const STATUS = {
  completed: { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: '✓' },
  analytics:  { cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: '✓' },
  failed:    { cls: 'bg-red-500/10     text-red-500     border-red-500/20',     icon: '✗' },
  started:   { cls: 'bg-blue-500/10    text-blue-600    border-blue-500/20',    icon: '→' },
  queued:    { cls: 'bg-slate-500/10   text-slate-600   border-slate-500/20',   icon: '…' },
};

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fmtDuration = (s) => {
  if (!s && s !== 0) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec.toString().padStart(2, '0')}s`;
};

const summarySentence = (call) => {
  const parts = [];
  if (call.interest)  parts.push(`Interest: ${call.interest}`);
  if (call.budget)    parts.push(`Budget: ${call.budget}`);
  if (call.timeline)  parts.push(`Timeline: ${call.timeline}`);
  if (call.sentiment) parts.push(`Sentiment: ${call.sentiment}`);
  return parts.join(' · ');
};

// Renders a transcript as alternating Agent / Customer bubbles if lines start with 'agent:' or 'customer:'
// Otherwise shows it as a plain pre-formatted block.
const TranscriptView = ({ transcript }) => {
  if (!transcript) return null;

  const lines = transcript.split('\n').filter(l => l.trim());
  const hasTags = lines.some(l =>
    /^\[(agent|customer|user|ai|lead)\]/i.test(l) ||
    /^(agent|customer|user|ai|lead)\s*:/i.test(l)
  );

  if (!hasTags) {
    return (
      <div className="rounded-[12px] bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 p-4 max-h-80 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
          {transcript}
        </pre>
      </div>
    );
  }

  // Parse into chat bubbles
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {lines.map((line, i) => {
        const agentMatch   = /^\[(agent|ai)\]|^(agent|ai)\s*:/i.exec(line);
        const leadMatch    = /^\[(customer|user|lead)\]|^(customer|user|lead)\s*:/i.exec(line);
        const isAgent      = !!agentMatch;
        const text         = line
          .replace(/^\[(agent|ai|customer|user|lead)\]/i, '')
          .replace(/^(agent|ai|customer|user|lead)\s*:/i, '')
          .trim();

        return (
          <div key={i} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
              isAgent
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-200 rounded-tl-sm'
                : 'bg-slate-100 dark:bg-white/[0.08] text-slate-800 dark:text-slate-200 rounded-tr-sm'
            }`}>
              <span className="block text-[8px] font-black uppercase tracking-[0.15em] opacity-50 mb-0.5">
                {isAgent ? 'Agent' : 'Lead'}
              </span>
              {text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const CallHistorySection = ({ leadId }) => {
  const [calls, setCalls]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [expandedCall, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // { [callKey]: 'transcript' | 'summary' }

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    getLeadCallHistory(leadId)
      .then(res => setCalls(res.data?.data || []))
      .catch(() => setError('Failed to load call history'))
      .finally(() => setLoading(false));
  }, [leadId]);

  const getTab = (key) => activeTab[key] || 'summary';
  const setTab = (key, tab) => setActiveTab(prev => ({ ...prev, [key]: tab }));

  if (loading) {
    return (
      <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">history</span>
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Call History</h3>
        </div>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-red-200/70 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/[0.04] p-5">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px]">history</span>
        </div>
        <div>
          <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Call History</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            {calls.length} {calls.length === 1 ? 'call' : 'calls'} · All conversations date-wise
          </p>
        </div>
      </div>

      {/* Empty state */}
      {calls.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl text-slate-400 dark:text-slate-500">phone_disabled</span>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No calls yet</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-1">
            Call history will appear here after AI agent calls
          </p>
        </div>
      ) : (
        /* Timeline */
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />

          <div className="space-y-4">
            {calls.map((call, index) => {
              const key        = call.callId || index;
              const isExpanded = expandedCall === key;
              const statusInfo = STATUS[call.status] || STATUS.completed;
              const sentInfo   = SENTIMENT[call.sentiment] || null;
              const intInfo    = INTEREST[call.interest]   || null;
              const tab        = getTab(key);

              return (
                <div key={key} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className={`absolute left-3.5 top-5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                    call.status === 'completed' || call.status === 'analytics'
                      ? 'bg-emerald-500'
                      : call.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                  }`} />

                  {/* Call Card */}
                  <div className={`rounded-[14px] border transition-all duration-200 ${
                    isExpanded
                      ? 'border-primary/30 shadow-sm bg-white/90 dark:bg-white/[0.05]'
                      : 'border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] hover:border-primary/30'
                  }`}>
                    {/* Clickable header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : key)}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Left: call # + status + duration */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-primary/10 text-primary text-[9px] font-black rounded-full px-2 py-0.5">
                            Call #{call.callNumber || index + 1}
                          </span>

                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] border ${statusInfo.cls}`}>
                            {statusInfo.icon} {call.status || 'completed'}
                          </span>

                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                            {fmtDuration(call.duration)}
                          </span>

                          {call.disconnectedBy && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              hung up by: {call.disconnectedBy}
                            </span>
                          )}
                        </div>

                        {/* Right: date + expand arrow */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {fmt(call.startTime)}
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-slate-400">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </div>
                      </div>

                      {/* Insight badges row */}
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {sentInfo && (
                          <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border ${sentInfo.cls}`}>
                            {sentInfo.icon} {call.sentiment}
                          </span>
                        )}
                        {intInfo && (
                          <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border ${intInfo.cls}`}>
                            {call.interest} interest
                          </span>
                        )}
                        {call.budget && (
                          <span className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border border-slate-200/70 dark:border-white/10 text-slate-500 dark:text-slate-400">
                            Budget: {call.budget}
                          </span>
                        )}
                        {call.timeline && (
                          <span className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border border-slate-200/70 dark:border-white/10 text-slate-500 dark:text-slate-400">
                            Timeline: {call.timeline}
                          </span>
                        )}
                      </div>

                      {/* Summary one-liner (collapsed) */}
                      {!isExpanded && call.summary && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">
                          {typeof call.summary === 'string' ? call.summary : JSON.stringify(call.summary)}
                        </p>
                      )}
                    </div>

                    {/* Expanded: tabs for Summary / Transcript */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-200/60 dark:border-white/10 pt-4">
                        {/* Tab bar */}
                        <div className="flex items-center gap-1 mb-4 bg-slate-100/70 dark:bg-white/[0.04] rounded-[12px] p-1 w-fit">
                          {['summary', 'transcript'].map(t => (
                            <button
                              key={t}
                              onClick={() => setTab(key, t)}
                              className={`px-4 py-1.5 rounded-[10px] text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                                tab === t
                                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Summary tab */}
                        {tab === 'summary' && (
                          <div className="space-y-3">
                            {/* AI Insights grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: 'Sentiment', value: call.sentiment, styleMap: SENTIMENT },
                                { label: 'Interest',  value: call.interest,  styleMap: INTEREST },
                                { label: 'Budget',    value: call.budget,    styleMap: null },
                                { label: 'Timeline',  value: call.timeline,  styleMap: null },
                              ].map(({ label, value, styleMap }) => (
                                <div key={label} className="rounded-[10px] bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 p-3">
                                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
                                  {value ? (
                                    <p className={`text-[11px] font-black ${styleMap ? (styleMap[value]?.cls || '').replace('border-','').replace(/bg-\S+/,'').replace(/border\s\S+/,'').trim() : 'text-slate-700 dark:text-slate-300'}`}>
                                      {value}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-slate-400">—</p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Full summary text */}
                            {call.summary && (
                              <div className="rounded-[10px] bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 p-3">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">AI Summary</p>
                                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                  {typeof call.summary === 'string'
                                    ? call.summary
                                    : JSON.stringify(call.summary, null, 2)}
                                </p>
                              </div>
                            )}

                            {/* Duration + timestamps */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                              <div>
                                <span className="font-black uppercase tracking-[0.15em]">Start</span>
                                <p className="font-mono">{fmt(call.startTime)}</p>
                              </div>
                              <div>
                                <span className="font-black uppercase tracking-[0.15em]">End</span>
                                <p className="font-mono">{fmt(call.endTime)}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Transcript tab */}
                        {tab === 'transcript' && (
                          call.transcript ? (
                            <TranscriptView transcript={call.transcript} />
                          ) : (
                            <div className="rounded-[12px] border border-dashed border-slate-300 dark:border-white/10 p-8 text-center">
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                No transcript available for this call.
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistorySection;
