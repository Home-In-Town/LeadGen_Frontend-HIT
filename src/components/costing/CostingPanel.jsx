import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getCostSummary, getCostMonth, getCostMonths, getCostPrices } from '../../api';
import {
  formatInr, formatQuantity, formatMonthLabel, formatDayLabel, formatShare, shareOf,
  basisKeys, BASIS_META, COMPONENT_META, COMPONENT_ORDER, componentLabel, componentColor, providerLabel,
} from './costFormat';

const cardClass = 'rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 shadow-sm';
const subCard = 'rounded-xl border border-slate-200 dark:border-white/10 p-4';
const chipBase = 'px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors';
const POLL_MS = 30000;
const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
];

// The backend buckets by IST day, so the default range must use the IST date, not the browser's.
const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const monthRange = (m) => {
  const [y, mm] = m.split('-').map(Number);
  const last = new Date(Date.UTC(y, mm, 0)).getUTCDate();
  return { from: `${m}-01`, to: `${m}-${String(last).padStart(2, '0')}` };
};
const errText = (e) => e?.response?.data?.error || e?.message || 'Could not load costing data';

function BasisTag({ basis }) {
  const m = BASIS_META[basis];
  if (!m) return null;
  return (
    <span title={m.hint} className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${m.text}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${m.swatch}`} />{m.label}
    </span>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400" data-testid="cost-legend">
      {['estimated', 'metered', 'allocated'].map((b) => (
        <span key={b} className="inline-flex items-center gap-1.5">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${BASIS_META[b].swatch}`} />
          <b className="text-slate-700 dark:text-slate-200">{BASIS_META[b].label}</b> {BASIS_META[b].hint}
        </span>
      ))}
    </div>
  );
}

function StackedBar({ components, total }) {
  const items = components.filter((c) => c.costInr > 0);
  if (!items.length || total <= 0) return null;
  const widths = items.map((c) => shareOf(c.costInr, total));
  const offsets = widths.map((_, i) => widths.slice(0, i).reduce((s, w) => s + w, 0));
  return (
    <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="w-full h-3 rounded-full overflow-hidden" role="img" aria-label="Cost by component">
      {items.map((c, i) => (
        <rect key={c.component} x={offsets[i]} y="0" width={widths[i]} height="6" fill={componentColor(c.component)}>
          <title>{`${componentLabel(c.component)}: ${formatInr(c.costInr)}`}</title>
        </rect>
      ))}
    </svg>
  );
}

function DailyTrend({ days, isCurrentMonth }) {
  const [open, setOpen] = useState(null);
  if (!days.length) return <p className="text-xs text-slate-500">No daily data for this period.</p>;
  const max = Math.max(...days.map((d) => d.totalInr), 0.0001);
  const sel = days.find((d) => d.day === open);
  return (
    <div>
      <div className="flex items-end gap-[3px] h-32" data-testid="daily-trend">
        {days.map((d) => {
          const h = Math.max((d.totalInr / max) * 100, d.totalInr > 0 ? 3 : 0);
          const parts = COMPONENT_ORDER.filter((k) => d.byComponent?.[k] > 0);
          const title = d.projected
            ? `${formatDayLabel(d.day)}: ${formatInr(d.totalInr)} (projected estimate)`
            : `${formatDayLabel(d.day)}: ${formatInr(d.totalInr)}${parts.length ? ' · ' + parts.map((k) => `${componentLabel(k)} ${formatInr(d.byComponent[k])}`).join(', ') : ''}`;
          return (
            <button
              key={d.day} type="button" title={title} aria-label={title}
              onClick={() => setOpen(open === d.day ? null : d.day)}
              className={`flex-1 min-w-[4px] h-full flex flex-col justify-end ${d.projected ? 'opacity-60' : ''}`}
            >
              <div className="w-full rounded-t-sm overflow-hidden flex flex-col-reverse"
                style={{
                  height: `${h}%`,
                  backgroundImage: d.projected ? 'repeating-linear-gradient(45deg, #94a3b8 0 3px, transparent 3px 6px)' : undefined,
                }}>
                {!d.projected && parts.map((k) => (
                  <div key={k} style={{ height: `${shareOf(d.byComponent[k], d.totalInr)}%`, background: componentColor(k) }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{formatDayLabel(days[0].day)}</span>
        <span>{formatDayLabel(days[days.length - 1].day)}</span>
      </div>
      {isCurrentMonth && days.some((d) => d.projected) && (
        <p className="text-[10px] text-slate-400 mt-1">Hatched bars are projected days (estimate).</p>
      )}
      {sel && (
        <div className="mt-2 rounded-lg bg-slate-50 dark:bg-white/5 p-3 text-xs" data-testid="day-detail">
          <p className="font-bold text-slate-800 dark:text-white mb-1">{formatDayLabel(sel.day)} · {formatInr(sel.totalInr)}{sel.projected ? ' (projected estimate)' : ''}</p>
          {sel.projected ? null : COMPONENT_ORDER.filter((k) => sel.byComponent?.[k] > 0).map((k) => (
            <div key={k} className="flex justify-between"><span>{componentLabel(k)}</span><span>{formatInr(sel.byComponent[k])}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

function PricesModal({ onClose }) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
    let alive = true;
    getCostPrices()
      .then((r) => alive && setState({ loading: false, data: r.data, error: null }))
      .catch((e) => alive && setState({ loading: false, data: null, error: errText(e) }));
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const { data } = state;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="How we calculate">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">How we calculate</h4>
          <button type="button" onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-800">Close</button>
        </div>
        {state.loading && <p className="text-xs text-slate-500">Loading...</p>}
        {state.error && <p className="text-xs text-red-500">{state.error}</p>}
        {data && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p>{data.methodology}</p>
            {data.infra && (
              <p>
                Infra rate: <b>{formatInr(data.infra.inrPerUnit)}</b> per interaction ({data.infra.status}
                {data.infra.month ? `, ${formatMonthLabel(data.infra.month)} rate` : ', pending first calibration'}).
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-1 pr-2">Item</th><th className="pr-2">Billed in</th><th className="pr-2">Rate</th><th className="pr-2">Effective</th><th>Source</th>
                </tr></thead>
                <tbody>
                  {(data.prices || []).map((p) => (
                    <tr key={p.key} className="border-t border-slate-100 dark:border-white/5 align-top">
                      <td className="py-1 pr-2">{componentLabel(p.component)} · {p.provider}{p.variant ? ` · ${p.variant}` : ''}</td>
                      <td className="pr-2">{p.currency}</td>
                      <td className="pr-2">
                        {p.status === 'confirmed' && p.amounts
                          ? Object.entries(p.amounts).map(([k, v]) => `${k}: ${v}${p.unitSize?.[k] ? ` per ${p.unitSize[k]}` : ''}`).join(', ')
                          : 'not yet priced'}
                      </td>
                      <td className="pr-2">{p.effectiveFrom ? String(p.effectiveFrom).slice(0, 10) : ''}</td>
                      <td>{p.sourceUrl ? <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline">source</a> : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-slate-400">Excluding GST. At our actual cost, no markup.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Totals({ summary }) {
  const t = summary.totalInr;
  const by = summary.byBasis || {};
  const est = shareOf(by.estimated, t);
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={subCard}><p className="text-[10px] uppercase tracking-wider text-slate-400">Total</p><p className="text-xl font-black text-slate-900 dark:text-white" data-testid="total-inr">{formatInr(t)}</p></div>
        {['metered', 'estimated', 'allocated'].map((b) => (
          <div key={b} className={subCard}>
            <p className="text-[10px] uppercase tracking-wider"><BasisTag basis={b} /></p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatInr(by[b])}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 mt-2">{Math.round(est)}% of this total is estimated.</p>
    </div>
  );
}

function Projection({ month }) {
  if (!month) return null;
  const p = month.projection;
  return (
    <div className={subCard} data-testid="projection-card">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Month to date · {formatMonthLabel(month.month)}</p>
      <p className="text-lg font-black text-slate-900 dark:text-white">{formatInr(month.mtdInr)}</p>
      {p ? (
        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Projected month end <b>{formatInr(p.projectedTotalInr)}</b> (range {formatInr(p.lowInr)} to {formatInr(p.highInr)})
            {' '}· <b>estimate</b> · {p.confidence} confidence
          </p>
          {p.basisNote && <p className="text-[11px] text-slate-400 mt-1">{p.basisNote}</p>}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Projection: not enough data yet. It needs at least one complete day of usage.</p>
      )}
    </div>
  );
}

function Breakdown({ summary }) {
  const comps = [...(summary.byComponent || [])];
  return (
    <div>
      <StackedBar components={comps} total={summary.totalInr} />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs text-left">
          <thead><tr className="text-[10px] uppercase tracking-wider text-slate-400">
            <th className="py-1 pr-2">Component</th><th className="pr-2">Quantity</th><th className="pr-2 text-right">Cost</th><th className="pr-2 text-right">Share</th><th>Basis</th>
          </tr></thead>
          <tbody>
            {comps.map((c) => {
              const pending = c.component === 'infra' && c.rate?.status === 'pending';
              return (
                <tr key={c.component} className="border-t border-slate-100 dark:border-white/5 align-top">
                  <td className="py-1.5 pr-2">
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: componentColor(c.component) }} />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{COMPONENT_META[c.component]?.label || c.label || c.component}</span>
                    {c.priceNote && <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">{c.priceNote}</p>}
                    {c.component === 'infra' && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {pending ? 'Pending first calibration' : `Allocated estimate, ${formatMonthLabel(c.rate?.month)} rate, ${c.rate?.status || 'provisional'}`}
                      </p>
                    )}
                    {c.priceMissing > 0 && <p className="text-[10px] text-amber-600 mt-0.5">{c.priceMissing} events not priced yet</p>}
                  </td>
                  <td className="pr-2 text-slate-600 dark:text-slate-300">{formatQuantity(c.component, c.units)}</td>
                  <td className="pr-2 text-right font-semibold">{pending ? '₹0.00' : formatInr(c.costInr)}</td>
                  <td className="pr-2 text-right text-slate-500">{formatShare(c.costInr, summary.totalInr)}</td>
                  <td className="space-x-2">{basisKeys(c.basis).map((b) => <BasisTag key={b} basis={b} />)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VoiceSection({ summary }) {
  const talk = summary.talk || { calls: 0, minutes: 0 };
  const voices = summary.byVoice || [];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className={subCard}><p className="text-[10px] uppercase tracking-wider text-slate-400">Calls</p><p className="text-lg font-bold">{talk.calls}</p></div>
      <div className={subCard}><p className="text-[10px] uppercase tracking-wider text-slate-400">Talk time</p><p className="text-lg font-bold">{talk.minutes} min</p></div>
      <div className={`${subCard} sm:col-span-3 overflow-x-auto`}>
        <table className="w-full text-xs text-left">
          <thead><tr className="text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1">Voice</th><th>Provider</th><th className="text-right">Calls</th><th className="text-right">Characters</th><th className="text-right">Cost</th></tr></thead>
          <tbody>
            {voices.length === 0 && <tr><td colSpan="5" className="py-2 text-slate-500">No voice usage in this period.</td></tr>}
            {voices.map((v, i) => (
              <tr key={`${v.voice}-${v.provider}-${i}`} className="border-t border-slate-100 dark:border-white/5">
                <td className="py-1.5">{v.voice || 'Default voice'}</td><td>{providerLabel(v.provider)}</td>
                <td className="text-right">{v.calls}</td><td className="text-right">{(v.chars || 0).toLocaleString('en-IN')}</td><td className="text-right">{formatInr(v.costInr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WhatsAppSection({ wa }) {
  const w = wa || { templatesSent: 0, templatesFree: 0, textMessages: 0, byCategory: {} };
  const cats = Object.entries(w.byCategory || {});
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className={subCard}><p className="text-[10px] uppercase tracking-wider text-slate-400">Templates sent</p><p className="text-lg font-bold">{w.templatesSent}</p><p className="text-[10px] text-slate-400">{w.templatesFree} free</p></div>
      <div className={subCard}><p className="text-[10px] uppercase tracking-wider text-slate-400">Text messages</p><p className="text-lg font-bold">{w.textMessages}</p></div>
      <div className={subCard}>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">By category</p>
        {cats.length === 0 ? <p className="text-xs text-slate-500">None</p> : cats.map(([k, v]) => <div key={k} className="flex justify-between text-xs"><span className="capitalize">{k}</span><span>{v}</span></div>)}
      </div>
    </div>
  );
}

function SplitList({ title, rows }) {
  return (
    <div className={subCard}>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{title}</p>
      {rows.length === 0 ? <p className="text-xs text-slate-500">None</p> : rows.map((r) => (
        <div key={r.key} className="flex justify-between text-xs py-0.5"><span className="truncate pr-2">{r.label} <span className="text-slate-400">({r.leads} leads)</span></span><span className="font-semibold">{formatInr(r.costInr)}</span></div>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-5">
      <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-2">{title}</h4>
      {children}
    </section>
  );
}

export default function CostingPanel() {
  const current = istToday().slice(0, 7);
  const [mode, setMode] = useState('range'); // 'range' | 'month'
  const [rangeId, setRangeId] = useState('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [month, setMonth] = useState(current);
  const [summary, setSummary] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPrices, setShowPrices] = useState(false);
  const reqId = useRef(0);

  const isPast = mode === 'month' && month !== current;
  const customInvalid = rangeId === 'custom' && (!custom.from || !custom.to || custom.from > custom.to
    || (new Date(custom.to) - new Date(custom.from)) / 86400000 + 1 > 366);

  const getRange = useCallback(() => {
    if (mode === 'month') return monthRange(month);
    const today = istToday();
    if (rangeId === 'custom') return { from: custom.from, to: custom.to };
    const r = RANGES.find((x) => x.id === rangeId) || RANGES[2];
    return { from: addDays(today, -(r.days - 1)), to: today };
  }, [mode, month, rangeId, custom]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (rangeId === 'custom' && mode === 'range' && customInvalid) return;
    const id = ++reqId.current;
    if (!silent) setLoading(true);
    try {
      const { from, to } = getRange();
      // MTD + projection always describe the month being looked at (current month in range mode).
      const monthKey = mode === 'month' ? month : current;
      const [s, m, ms] = await Promise.all([
        getCostSummary({ from, to }),
        getCostMonth(monthKey),
        getCostMonths(12),
      ]);
      if (id !== reqId.current) return; // a newer request superseded this one
      setSummary(s.data);
      setMonthData(m.data);
      setMonths(ms.data?.months || []);
      setError(null);
    } catch (e) {
      if (id !== reqId.current) return;
      // Keep the last good numbers on a background refresh failure; only block when there is nothing to show.
      setError(errText(e));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [getRange, mode, month, current, rangeId, customInvalid]);

  useEffect(() => { load(); }, [load]);

  // Poll only while the tab is visible and only for live views; a past month is final and never changes.
  useEffect(() => {
    if (isPast) return undefined;
    const tick = () => { if (document.visibilityState === 'visible') load({ silent: true }); };
    const t = setInterval(tick, POLL_MS);
    window.addEventListener('focus', tick);
    return () => { clearInterval(t); window.removeEventListener('focus', tick); };
  }, [load, isPast]);

  const hasData = summary && (summary.totalInr > 0 || (summary.byComponent || []).length > 0);
  const pm = summary?.priceMissing;
  const days = mode === 'month' ? (monthData?.days || []) : (summary?.daily || []);
  const monthOptions = months.length ? months : [{ month: current, totalInr: 0, infraStatus: 'pending' }];
  const infraStatusLabel = (s) => (s === 'final' ? 'final' : s === 'provisional' ? 'provisional' : 'pending');

  return (
    <div className={`${cardClass} p-5`} data-testid="costing-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-primary">receipt_long</span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Costing / Usage</h3>
        </div>
        <button type="button" onClick={() => setShowPrices(true)} className="text-[11px] font-bold text-primary underline">How we calculate</button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">What your account has used, at our actual cost in INR. Excluding GST. At our actual cost, no markup.</p>

      <div className="flex flex-wrap gap-2 items-center mb-2">
        {RANGES.map((r) => (
          <button key={r.id} type="button" onClick={() => { setMode('range'); setRangeId(r.id); }}
            className={`${chipBase} ${mode === 'range' && rangeId === r.id ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300'}`}>{r.label}</button>
        ))}
        <button type="button" onClick={() => { setMode('range'); setRangeId('custom'); }}
          className={`${chipBase} ${mode === 'range' && rangeId === 'custom' ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300'}`}>Custom</button>
        <label className="text-[11px] text-slate-500 ml-auto flex items-center gap-1.5">Month
          <select
            aria-label="Month"
            value={mode === 'month' ? month : ''}
            onChange={(e) => { if (e.target.value) { setMonth(e.target.value); setMode('month'); } }}
            className="rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs"
          >
            <option value="">Pick a month</option>
            {monthOptions.map((m) => (
              <option key={m.month} value={m.month}>{formatMonthLabel(m.month)} · {formatInr(m.totalInr)} · {infraStatusLabel(m.infraStatus)}</option>
            ))}
          </select>
        </label>
      </div>
      {mode === 'range' && rangeId === 'custom' && (
        <div className="flex flex-wrap gap-2 items-center mb-2 text-xs">
          <input type="date" aria-label="From date" value={custom.from} max={custom.to || undefined} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800 px-2 py-1" />
          <span>to</span>
          <input type="date" aria-label="To date" value={custom.to} min={custom.from || undefined} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800 px-2 py-1" />
          {customInvalid && <span className="text-amber-600">Pick a valid range (up to 366 days).</span>}
        </div>
      )}
      {isPast && <p className="text-[11px] text-slate-500 mb-2">Viewing {formatMonthLabel(month)} (previous month history).</p>}
      <Legend />

      {loading && !summary && <p className="text-xs text-slate-500 mt-4">Loading costing data...</p>}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-3" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => load()} className="font-bold underline">Retry</button>
        </div>
      )}

      {summary && (
        <>
          {pm?.events > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 p-3 text-xs text-amber-800 dark:text-amber-300" role="status">
              {pm.events} events are not priced yet; totals may be low.
              {pm.fx && ' USD rates missing for some days.'}
            </div>
          )}

          {!hasData ? (
            <p className="text-sm text-slate-500 mt-5">No usage recorded yet.</p>
          ) : (
            <>
              <Section title="Totals"><Totals summary={summary} /></Section>
              {!isPast && <Section title="Month to date and projection"><Projection month={monthData} /></Section>}
              {isPast && monthData && (
                <Section title={`${formatMonthLabel(month)} final`}>
                  <div className={subCard}><p className="text-lg font-black">{formatInr(monthData.mtdInr)}</p>
                    <p className="text-[11px] text-slate-500">Infra rate: {monthData.infraRate?.status === 'final' ? 'final' : monthData.infraRate?.status === 'pending' ? 'pending first calibration' : 'provisional'}</p></div>
                </Section>
              )}
              <Section title="Where the money went"><Breakdown summary={summary} /></Section>
              <Section title="Daily trend"><DailyTrend days={days} isCurrentMonth={mode === 'month' && month === current} /></Section>
              <Section title="Voice and talk time"><VoiceSection summary={summary} /></Section>
              <Section title="WhatsApp"><WhatsAppSection wa={summary.whatsapp} /></Section>
              <Section title="Top leads">
                <div className={subCard}>
                  {(summary.topLeads || []).length === 0 ? <p className="text-xs text-slate-500">No lead-level usage in this period.</p> : summary.topLeads.map((l) => (
                    <div key={l.leadId} className="flex justify-between text-xs py-1 border-b last:border-0 border-slate-100 dark:border-white/5">
                      <Link to={`/lead/${l.leadId}`} className="text-primary hover:underline truncate pr-2">{l.name || l.leadId}</Link>
                      <span className="font-semibold">{formatInr(l.costInr)}</span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 mt-3">
                  <SplitList title="By lead source" rows={(summary.bySource || []).map((s) => ({ key: s.source, label: s.source, leads: s.leads, costInr: s.costInr }))} />
                  <SplitList title="By project" rows={(summary.byProject || []).map((p) => ({ key: p.projectId, label: p.projectName || p.projectId, leads: p.leads, costInr: p.costInr }))} />
                </div>
              </Section>
            </>
          )}
        </>
      )}
      {showPrices && <PricesModal onClose={() => setShowPrices(false)} />}
    </div>
  );
}
