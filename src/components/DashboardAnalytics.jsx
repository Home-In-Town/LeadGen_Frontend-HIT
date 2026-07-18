import { useState, useEffect, useCallback } from 'react';
import { getDashboardAnalytics } from '../api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const FILTER_OPTIONS = [
  { label: 'Today', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#06b6d4', '#64748b'];

const STATUS_LABELS = {
  CREATED: 'New',
  COLD: 'Cold',
  WARM: 'Warm',
  HOT: 'Hot',
  CONVERTED: 'Converted',
  REJECTED: 'Rejected',
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`;
};

const SummaryCard = ({ icon, label, value, color, suffix = '' }) => (
  <div className="flex flex-col items-center justify-center p-3 rounded-[14px] bg-white/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 shadow-sm">
    <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center mb-1.5`} style={{ background: `${color}15` }}>
      <span className="material-symbols-outlined text-lg" style={{ color }}>{icon}</span>
    </div>
    <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{value}{suffix}</span>
    <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mt-1 text-center">{label}</span>
  </div>
);

export default function DashboardAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardAnalytics(days);
      setData(res.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const series = data?.series || [];
  const summary = data?.summary || {};
  const statusBreakdown = data?.statusBreakdown || {};

  const pieData = Object.entries(statusBreakdown)
    .filter(([_, v]) => v > 0)
    .map(([key, value]) => ({ name: STATUS_LABELS[key] || key, value }));

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-6">
      <div className="bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl rounded-[18px] shadow-sm overflow-hidden">
        
        {/* Header + Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">analytics</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Performance Analytics</span>
          </div>
          <div className="flex gap-1.5">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 rounded-[8px] text-[9px] font-black uppercase tracking-[0.15em] transition-all ${
                  days === opt.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="ml-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Loading analytics...</span>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              <SummaryCard icon="person_add" label="New Leads" value={summary.newLeads || 0} color="#6366f1" />
              <SummaryCard icon="call" label="Calls Done" value={summary.callsCompleted || 0} color="#10b981" />
              <SummaryCard icon="trending_up" label="Conversions" value={summary.conversions || 0} color="#f59e0b" />
              <SummaryCard icon="chat" label="WA Sent" value={summary.waSent || 0} color="#25D366" />
              <SummaryCard icon="mail" label="Emails" value={summary.emailsSent || 0} color="#8b5cf6" />
              <SummaryCard icon="timer" label="Call Time" value={summary.callMinutes || 0} color="#ef4444" suffix="m" />
            </div>

            {/* Main Area Chart: Leads + Calls + Conversions */}
            <div>
              <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-3">Lead Activity & Calls</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={series} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, fontSize: 11, color: '#fff' }}
                    labelFormatter={formatDate}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke="#6366f1" fill="url(#gradLeads)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="calls" name="Calls" stroke="#10b981" fill="url(#gradCalls)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#f59e0b" fill="url(#gradConv)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart: WA + Email */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-3">Outreach (WhatsApp & Email)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={series} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, fontSize: 11, color: '#fff' }}
                      labelFormatter={formatDate}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                    <Bar dataKey="whatsapp" name="WhatsApp" fill="#25D366" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="emails" name="Email" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart: Lead Status */}
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-3">Lead Status</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 10, fontSize: 11, color: '#fff' }} />
                      <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[160px] flex items-center justify-center text-[10px] text-slate-400">No data yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
