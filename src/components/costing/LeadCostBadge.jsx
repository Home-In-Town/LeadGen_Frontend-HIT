import { useState, useEffect, useCallback, useRef } from 'react';
import { getLeadCost, getLeadCostEvents } from '../../api';
import {
  formatInr, formatUsd, formatQuantity, formatShare, basisKeys, BASIS_META,
  COMPONENT_META, providerLabel,
} from './costFormat';

const POLL_MS = 30000;

// Cost pill next to the lead name. It must never break the lead page: while loading, on any error
// (including 404 for a lead with no ledger) or without a leadId it renders nothing.
export default function LeadCostBadge({ leadId, refreshKey = 0 }) {
  const [cost, setCost] = useState(null);
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState(null); // null = not requested
  const [cursor, setCursor] = useState(null);
  const [evLoading, setEvLoading] = useState(false);
  const [evError, setEvError] = useState(false);
  const wrapRef = useRef(null);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    if (!leadId) return;
    const id = ++reqId.current;
    try {
      const res = await getLeadCost(leadId);
      if (id === reqId.current) setCost(res.data);
    } catch {
      // Swallow: the badge simply stays hidden (or keeps its last good value). A cost
      // failure must never surface as an error on the lead page.
    }
  }, [leadId]);

  // A different lead must not show the previous lead's amount.
  useEffect(() => { setCost(null); setEvents(null); setCursor(null); setOpen(false); }, [leadId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  useEffect(() => {
    if (!leadId) return undefined;
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    return () => clearInterval(t);
  }, [leadId, load]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  const loadEvents = async (next) => {
    setEvLoading(true);
    setEvError(false);
    try {
      const res = await getLeadCostEvents(leadId, next ? { cursor: next, limit: 10 } : { limit: 10 });
      setEvents((prev) => (next && prev ? [...prev, ...(res.data.events || [])] : (res.data.events || [])));
      setCursor(res.data.nextCursor || null);
    } catch {
      setEvError(true);
      setEvents((prev) => prev || []);
    } finally {
      setEvLoading(false);
    }
  };

  if (!leadId || !cost) return null;

  const comps = cost.byComponent || [];
  const voice = cost.voice || { byVoice: [], calls: 0, minutes: 0 };
  const wa = cost.whatsapp || { templatesSent: 0 };
  const pm = cost.priceMissing;

  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="What this lead has cost so far"
        className="px-2 py-0.5 text-[10px] font-bold rounded border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300 hover:bg-emerald-100"
        data-testid="lead-cost-pill"
      >
        {formatInr(cost.totalInr)}
      </button>
      {open && (
        <div role="dialog" aria-label="Lead cost breakdown" className="absolute left-0 top-full mt-2 z-30 w-80 max-w-[90vw] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl p-4 text-xs text-slate-700 dark:text-slate-200">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Cost of this lead</p>
          <p className="text-lg font-black text-slate-900 dark:text-white">{formatInr(cost.totalInr)}</p>
          <p className="text-[10px] text-slate-400 mb-2">At our actual cost, excluding GST, no markup.</p>
          {pm?.events > 0 && <p className="text-[11px] text-amber-600 mb-2">{pm.events} events are not priced yet; this may be low.</p>}
          {comps.length === 0 ? <p className="text-slate-500">No usage recorded yet.</p> : (
            <table className="w-full">
              <tbody>
                {comps.map((c) => (
                  <tr key={c.component} className="border-t border-slate-100 dark:border-white/5 align-top">
                    <td className="py-1 pr-2">
                      <span className="font-semibold">{COMPONENT_META[c.component]?.label || c.label || c.component}</span>
                      <span className="block text-[10px] text-slate-400">{formatQuantity(c.component, c.units)}</span>
                    </td>
                    <td className="pr-2">
                      {basisKeys(c.basis).map((b) => (
                        <span key={b} className={`block text-[10px] font-bold uppercase ${BASIS_META[b]?.text || ''}`}>{BASIS_META[b]?.label || b}</span>
                      ))}
                    </td>
                    <td className="text-right whitespace-nowrap">{formatInr(c.costInr)}<span className="block text-[10px] text-slate-400">{formatShare(c.costInr, cost.totalInr)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 space-y-0.5">
            <p>Calls: <b>{voice.calls}</b> · Talk time: <b>{voice.minutes} min</b></p>
            {(voice.byVoice || []).filter((v) => v.voice || v.provider).map((v, i) => (
              <p key={i} className="text-slate-500">Voice: {v.voice || 'Default'} ({providerLabel(v.provider)})</p>
            ))}
            <p>WhatsApp templates sent: <b>{wa.templatesSent}</b></p>
            {cost.infraIncluded && <p className="text-slate-400">Infra is allocated, not metered.</p>}
          </div>
          <div className="mt-2">
            {events === null ? (
              <button type="button" onClick={() => loadEvents()} className="font-bold text-primary underline">Recent events</button>
            ) : (
              <div data-testid="lead-cost-events">
                {events.length === 0 && !evError && <p className="text-slate-500">No events.</p>}
                {events.map((e, i) => (
                  <div key={`${e.ts}-${i}`} className="flex justify-between gap-2 py-0.5 border-t border-slate-100 dark:border-white/5">
                    <span className="truncate">{new Date(e.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {COMPONENT_META[e.component]?.label || e.component}</span>
                    <span className="whitespace-nowrap">{e.origUsd != null ? `${formatUsd(e.origUsd)} → ` : ''}{formatInr(e.costInr)}</span>
                  </div>
                ))}
                {evError && <p className="text-red-500">Could not load events.</p>}
                {cursor && <button type="button" disabled={evLoading} onClick={() => loadEvents(cursor)} className="font-bold text-primary underline mt-1">{evLoading ? 'Loading...' : 'Load more'}</button>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
