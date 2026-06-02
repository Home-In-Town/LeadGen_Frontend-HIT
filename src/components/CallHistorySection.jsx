import { useState, useEffect } from 'react';
import { getLeadCallHistory } from '../api';

const SENTIMENT_STYLES = {
  POSITIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  NEUTRAL: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  NEGATIVE: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const INTEREST_STYLES = {
  HIGH: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  LOW: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const STATUS_STYLES = {
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const CallHistorySection = ({ leadId }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCall, setExpandedCall] = useState(null);

  useEffect(() => {
    if (!leadId) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getLeadCallHistory(leadId);
        setCalls(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch call history:', err);
        setError('Failed to load call history');
        setCalls([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [leadId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">history</span>
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Call History
          </h3>
        </div>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-red-200/70 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/[0.04] p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">history</span>
        </div>
        <div>
          <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
            Call History
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            {calls.length} {calls.length === 1 ? 'call' : 'calls'} recorded
          </p>
        </div>
      </div>

      {/* Empty State */}
      {calls.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl text-slate-400 dark:text-slate-500">
              phone_disabled
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            No calls have been made to this lead yet
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-1">
            Call history will appear here after AI agent calls
          </p>
        </div>
      ) : (
        /* Timeline */
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />

          <div className="space-y-4">
            {calls.map((call, index) => {
              const isExpanded = expandedCall === call.callId || expandedCall === index;

              return (
                <div key={call.callId || index} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className="absolute left-3.5 top-5 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-slate-900 shadow-sm" />

                  {/* Call Card */}
                  <div
                    className={`
                      rounded-[14px] border border-slate-200/70 dark:border-white/10
                      bg-white/80 dark:bg-white/[0.03] p-4 transition-all duration-200
                      hover:border-primary/30 cursor-pointer
                      ${isExpanded ? 'border-primary/30 shadow-sm' : ''}
                    `}
                    onClick={() => setExpandedCall(isExpanded ? null : (call.callId || index))}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Call Number Badge */}
                        <span className="bg-primary/10 text-primary text-[9px] font-black rounded-full px-2 py-0.5">
                          Call #{call.callNumber || index + 1}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`
                            rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] border
                            ${STATUS_STYLES[call.status] || STATUS_STYLES.completed}
                          `}
                        >
                          {call.status || 'completed'}
                        </span>

                        {/* Duration */}
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                          {formatDuration(call.duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {formatDate(call.startTime)}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-slate-400">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>

                    {/* Summary */}
                    {call.summary && (
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">
                        {typeof call.summary === 'string' ? call.summary : JSON.stringify(call.summary)}
                      </p>
                    )}

                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {call.sentiment && (
                        <span
                          className={`
                            rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border
                            ${SENTIMENT_STYLES[call.sentiment] || SENTIMENT_STYLES.NEUTRAL}
                          `}
                        >
                          {call.sentiment}
                        </span>
                      )}

                      {call.interest && (
                        <span
                          className={`
                            rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border
                            ${INTEREST_STYLES[call.interest] || INTEREST_STYLES.MEDIUM}
                          `}
                        >
                          {call.interest} Interest
                        </span>
                      )}
                    </div>

                    {/* Expanded Transcript */}
                    {isExpanded && call.transcript && (
                      <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            description
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                            Transcript
                          </span>
                        </div>
                        <div className="rounded-[10px] bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 p-3">
                          <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                            {call.transcript}
                          </p>
                        </div>
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
