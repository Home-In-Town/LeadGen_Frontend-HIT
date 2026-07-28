import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import { useTheme } from '../context/ThemeContext';

const THEME_STORAGE_KEY = 'hit-landing-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const features = [
  {
    icon: 'database_search',
    title: 'Lead management',
    description:
      'Unified pipeline with scoring, assignment rules, and instant visibility across every channel.',
  },
  {
    icon: 'mic',
    title: 'AI voice calls',
    description:
      'Human-grade outreach at scale-natural conversations, disposition capture, and CRM sync.',
  },
  {
    icon: 'chat',
    title: 'WhatsApp automation',
    description:
      'Sequences, templates, and routing that feel personal while staying compliant and fast.',
  },
  {
    icon: 'ads_click',
    title: 'Google Ads integration',
    description:
      'Attribute spend to pipeline outcomes and automate follow-up the moment a lead arrives.',
  },
  {
    icon: 'share',
    title: 'Facebook lead sync',
    description:
      'Instant ingestion from Meta forms into your CRM with dedupe and enrichment.',
  },
  {
    icon: 'bolt',
    title: 'Real-time CRM',
    description:
      'Live timelines, presence, and conflict-free updates so your team stays aligned.',
  },
  {
    icon: 'notifications_active',
    title: 'Notifications',
    description:
      'Smart alerts across WhatsApp, voice, and in-app-only when it matters.',
  },
  {
    icon: 'smart_toy',
    title: 'Smart automation',
    description:
      'Visual workflows that connect ads, chat, voice, and ops without brittle scripts.',
  },
];

const integrations = [
  {
    name: 'WhatsApp Business',
    detail: 'Messaging & routing',
    icon: 'chat',
    accent: 'from-emerald-500/20 to-emerald-600/5',
  },
  {
    name: 'Voice stack',
    detail: 'AI calling & transcripts',
    icon: 'call',
    accent: 'from-violet-500/20 to-violet-600/5',
  },
  {
    name: 'Google Ads',
    detail: 'Lead forms & offline sync',
    icon: 'campaign',
    accent: 'from-sky-500/20 to-sky-600/5',
  },
  {
    name: 'Meta Lead Ads',
    detail: 'Facebook lead capture',
    icon: 'public',
    accent: 'from-blue-500/20 to-indigo-600/5',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Capture Leads',
    body: 'Ads, forms, and inbound WhatsApp flow into one deduplicated record.',
    icon: 'filter_alt',
  },
  {
    step: '02',
    title: 'Engage Customers',
    body: 'AI voice and chat qualify intent while rules route by territory or SLA.',
    icon: 'psychology',
  },
  {
    step: '03',
    title: 'Grow Revenue',
    body: 'Triggers notify owners, update stages, and launch the next best action.',
    icon: 'rocket_launch',
  },
];

const testimonials = [
  {
    quote:
      'We replaced three tools with OneEmployee. Voice plus WhatsApp in one CRM finally matches how our reps actually work.',
    name: 'Priya Menon',
    role: 'VP Revenue Operations',
    org: 'Northwind Labs',
  },
  {
    quote:
      'Lead sync from Meta and Google is instant-our SLAs dropped from hours to minutes without extra headcount.',
    name: 'Nithin Reddy',
    role: 'Head of Growth',
    org: 'Atlas Realty Group',
  },
  {
    quote:
      'The automation canvas is enterprise-grade but approachable. We shipped new sequences in days, not quarters.',
    name: 'Sam Rivera',
    role: 'Director of Sales',
    org: 'Copperline Health',
  },
];



const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="animate-fade-in min-h-screen font-display transition-colors duration-300">
      
      <div className={`relative min-h-screen transition-colors duration-300 overflow-x-hidden bg-[#0F172A] text-white`}>
        {/* Animated wave background + CRM design elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {/* Waves */}
          <svg className="absolute bottom-0 left-0 w-[200%] sm:w-full h-[40%] opacity-[0.06]" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="white" d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,154.7C672,149,768,171,864,186.7C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
              <animateTransform attributeName="transform" type="translate" values="0,0;30,8;0,0" dur="12s" repeatCount="indefinite"/>
            </path>
          </svg>
          <svg className="absolute bottom-0 left-0 w-[200%] sm:w-full h-[30%] opacity-[0.04]" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="white" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,165.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
              <animateTransform attributeName="transform" type="translate" values="0,0;-30,6;0,0" dur="16s" repeatCount="indefinite"/>
            </path>
          </svg>

          {/* CRM-themed floating icons (subtle, decorative) */}
          <div className="absolute top-[12%] right-[5%] opacity-[0.06] hidden sm:block" style={{ animation: 'floatOrb 20s ease-in-out infinite' }}>
            <span className="material-symbols-outlined text-[80px] text-emerald-300" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
          <div className="absolute top-[45%] left-[3%] opacity-[0.05] hidden sm:block" style={{ animation: 'floatOrb 16s ease-in-out infinite reverse' }}>
            <span className="material-symbols-outlined text-[60px] text-violet-300" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
          </div>
          <div className="absolute bottom-[30%] right-[12%] opacity-[0.04] hidden sm:block" style={{ animation: 'floatOrb 22s ease-in-out infinite 4s' }}>
            <span className="material-symbols-outlined text-[70px] text-emerald-200" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
          </div>
          <div className="absolute top-[65%] left-[20%] opacity-[0.04] hidden sm:block" style={{ animation: 'floatOrb 18s ease-in-out infinite 2s' }}>
            <span className="material-symbols-outlined text-[55px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
          </div>

          {/* Gradient orbs */}
          <div className="absolute top-[15%] left-[5%] w-40 sm:w-64 h-40 sm:h-64 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)', animation: 'floatOrb 18s ease-in-out infinite' }} />
          <div className="absolute top-[40%] right-[5%] w-32 sm:w-48 h-32 sm:h-48 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #10B981, transparent 70%)', animation: 'floatOrb 14s ease-in-out infinite reverse' }} />
          <div className="absolute bottom-[20%] left-[25%] w-36 sm:w-56 h-36 sm:h-56 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #A78BFA, transparent 70%)', animation: 'floatOrb 20s ease-in-out infinite 3s' }} />
        </div>

        <LandingNavbar
          onLogin={() => navigate('/login')}
        />

        <main className="relative">
          {/* Hero */}
          <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] sm:text-xs font-medium shadow-sm backdrop-blur-md border-white/15 bg-white/10 text-white/80`}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/60 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
                </span>
                AI Employees • Sales Automation • Customer Engagement
              </div>

              <div className="mt-6 sm:mt-8">
                <h1 className={`normal-case text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.12] tracking-tight text-white`}>
                  <span className="font-extrabold text-emerald-400">
                    OneEmployee:
                  </span>{' '}
                  The Revenue Workforce for Modern Businesses.
                </h1>
                <p className={`mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base leading-relaxed text-white/70`}>
                  OneEmployee helps businesses capture leads, engage customers, automate follow-ups, and grow revenue with AI-powered employees that work 24/7.
                </p>
              </div>

              <div className="mt-8 sm:mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center rounded-[12px] bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-400/35"
                >
                  Get Clients
                  <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
                </button>
                <a
                  href="#features"
                  className={`inline-flex items-center justify-center rounded-[12px] border px-6 py-3.5 text-sm font-semibold backdrop-blur-md transition-all border-white/20 bg-white/10 text-white hover:bg-white/20`}
                >
                  See How It Works
                </a>
              </div>


              {/* AI Capabilities Marquee */}
              <div className="relative mt-12 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1">

                <div className="relative overflow-hidden rounded-[22px] bg-[#1E1B4B]/80 py-5 backdrop-blur-xl border border-white/5">
                  <div className="marquee-track flex items-center gap-5 whitespace-nowrap">
                    {[
                      { label: 'AI Calling', icon: 'call', color: 'text-emerald-500' },
                      { label: 'AI WhatsApp', icon: 'forum', color: 'text-green-500' },
                      { label: 'Lead Scoring', icon: 'leaderboard', color: 'text-amber-500' },
                      { label: 'CRM', icon: 'groups', color: 'text-blue-500' },
                      { label: 'Automation', icon: 'settings_suggest', color: 'text-purple-500' },
                      { label: 'Analytics', icon: 'analytics', color: 'text-cyan-500' },
                      { label: 'Transcripts', icon: 'description', color: 'text-orange-500' },
                      { label: 'Appointment Booking', icon: 'event_available', color: 'text-pink-500' },

                      // Duplicate for seamless infinite scroll
                      { label: 'AI Calling', icon: 'call', color: 'text-emerald-500' },
                      { label: 'AI WhatsApp', icon: 'forum', color: 'text-green-500' },
                      { label: 'Lead Scoring', icon: 'leaderboard', color: 'text-amber-500' },
                      { label: 'CRM', icon: 'groups', color: 'text-blue-500' },
                      { label: 'Automation', icon: 'settings_suggest', color: 'text-purple-500' },
                      { label: 'Analytics', icon: 'analytics', color: 'text-cyan-500' },
                      { label: 'Transcripts', icon: 'description', color: 'text-orange-500' },
                      { label: 'Appointment Booking', icon: 'event_available', color: 'text-pink-500' },
                    ].map((item, index) => (
                      <div
                        key={`${item.label}-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/10"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${item.color}`}
                        >
                          {item.icon}
                        </span>

                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-16 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Leads qualified', value: '12.8k', hint: 'rolling 24h', trend: '+12.4%' },
                  { label: 'Avg. response', value: '42s', hint: 'voice + WhatsApp', trend: 'SLA safe' },
                  { label: 'Pipeline accuracy', value: '99.2%', hint: 'CRM sync health', trend: 'live' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[14px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/25 hover:bg-white/10"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                      {stat.label}
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <p className="font-mono text-3xl font-bold tracking-tight text-white">
                        {stat.value}
                      </p>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        {stat.trend}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/40">{stat.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CRM features */}
          <section id="features" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Platform</p>
                <h2 className="mt-2 normal-case text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Everything Your Business Needs to Convert More Customers
                </h2>
                <p className="mt-4 text-white/60">
                  Manage leads, automate customer communication, track opportunities, and improve team productivity from one platform.
                </p>
              </div>

              <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((f) => (
                  <article
                    key={f.title}
                    className="group rounded-[14px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/10"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/20 transition-transform duration-300 group-hover:scale-105">
                      <span className="material-symbols-outlined text-[22px]">{f.icon}</span>
                    </div>
                    <h3 className="mt-5 normal-case text-lg font-semibold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{f.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Integrations */}
          <section id="integrations" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Integrations</p>
                  <h2 className="mt-2 normal-case text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    WhatsApp, voice, and paid media - wired in
                  </h2>
                  <p className="mt-4 text-white/60">
                    Bring your calls, WhatsApp, marketing campaigns, and customer data together in one connected system.
                  </p>
                </div>
                <button type="button" onClick={() => navigate('/login')}
                  className="inline-flex w-fit items-center gap-2 rounded-[12px] border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/20">
                  View integration hub
                  <span className="material-symbols-outlined text-[18px]">north_east</span>
                </button>
              </div>
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {integrations.map((item) => (
                  <div key={item.name}
                    className="rounded-[14px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/25 hover:bg-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-white/60">{item.detail}</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/10 text-white ring-1 ring-white/10">
                        <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Workflow */}
          <section id="workflow" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Automation</p>
                <h2 className="mt-2 normal-case text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  From Lead to Customer in Three Simple Steps
                </h2>
                <p className="mt-4 text-white/60">
                  OneEmployee helps businesses capture opportunities, engage customers, and drive conversions automatically.
                </p>
              </div>

              <div className="mt-14 grid gap-6 lg:grid-cols-3">
                {workflowSteps.map((w, i) => (
                  <div
                    key={w.step}
                    className="relative rounded-[16px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/25 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-400">{w.step}</span>
                      {i < workflowSteps.length - 1 ? (
                        <span
                          className="material-symbols-outlined hidden text-slate-300 lg:block dark:text-slate-600"
                          aria-hidden
                        >
                          trending_flat
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-[14px] bg-slate-900 text-white shadow-lg dark:bg-gradient-to-br dark:from-primary dark:to-emerald-600">
                      <span className="material-symbols-outlined text-[26px]">{w.icon}</span>
                    </div>
                    <h3 className="mt-6 normal-case text-xl font-semibold text-white">{w.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">{w.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Analytics preview */}
          <section id="analytics" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Analytics</p>
                  <h2 className="mt-2 normal-case text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    See What Drives Your Growth
                  </h2>
                  <p className="mt-4 text-white/60">
                    Track customer engagement, sales performance, team productivity, and revenue opportunities in real time.
                  </p>
                  <ul className="mt-8 space-y-4 text-sm text-white/80">
                    {[
                      'Unified timeline across voice, WhatsApp, and web touchpoints',
                      'Attribution that spans Google Ads and Meta Lead Ads',
                      'Operational alerts when automation or integrations drift',
                    ].map((line) => (
                      <li key={line} className="flex gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute -inset-4 rounded-[24px] bg-gradient-to-tr from-primary/20 via-transparent to-violet-500/20 blur-2xl dark:from-primary/30 dark:to-violet-500/25" />
                  <div className="relative overflow-hidden rounded-[20px] border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_-20px_rgba(0,0,0,0.65)]">
                    <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                          Revenue pulse
                        </span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-white/10 dark:text-slate-400">
                        LIVE_FEED_01
                      </span>
                    </div>
                    <div className="grid gap-px bg-slate-200/80 sm:grid-cols-2 dark:bg-white/10">
                      {[
                        { label: 'Qualified today', value: '12,842', chip: '+12.4% vs avg', chipTone: 'text-primary' },
                        { label: 'Voice connect rate', value: '38%', chip: 'cohort: NA', chipTone: 'text-slate-500 dark:text-slate-400' },
                        { label: 'WhatsApp SLA', value: '1.2m', chip: 'median reply', chipTone: 'text-slate-500 dark:text-slate-400' },
                        { label: 'Ads ROI snapshot', value: '6.1x', chip: 'blended', chipTone: 'text-primary' },
                      ].map((cell) => (
                        <div key={cell.label} className="bg-white/95 p-5 dark:bg-[#0c0e14]/90">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {cell.label}
                          </p>
                          <p className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">{cell.value}</p>
                          <p className={`mt-2 text-[11px] font-mono ${cell.chipTone}`}>{cell.chip}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-200/70 px-5 py-4 dark:border-white/10">
                      <div className="flex h-24 items-end gap-2">
                        {[40, 65, 52, 78, 48, 88, 56].map((h, idx) => (
                          <div key={idx} className="flex-1 rounded-t-[6px] bg-gradient-to-t from-primary/40 to-primary/90 dark:shadow-[0_0_24px_-6px_rgba(16,183,127,0.65)]" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        <span>Mon</span>
                        <span>Sun</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section id="testimonials" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">Customers</p>
                <h2 className="mt-2 normal-case text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Trusted by Businesses Focused on Growth
                </h2>
              </div>
              <div className="mt-12 grid gap-6 lg:grid-cols-3">
                {testimonials.map((t) => (
                  <blockquote
                    key={t.name}
                    className="flex flex-col rounded-[16px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/25 hover:bg-white/10"
                  >
                    <span className="text-emerald-400">
                      <span className="material-symbols-outlined text-[28px]">format_quote</span>
                    </span>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-white/70">{t.quote}</p>
                    <footer className="mt-8 border-t border-white/10 pt-6">
                      <p className="font-semibold text-white">{t.name}</p>
                      <p className="mt-1 text-xs text-white/50">
                        {t.role}, {t.org}
                      </p>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="px-4 pb-24 pt-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 px-8 py-14 text-center shadow-2xl dark:border-white/10 dark:from-[#0b0d12] dark:via-[#0b0d12] dark:to-emerald-950/80">
                <div className="pointer-events-none absolute inset-0 opacity-40">
                  <div className="absolute -left-10 top-0 h-64 w-64 rounded-full bg-primary/40 blur-3xl animate-shimmer" />
                  <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl animate-shimmer" style={{ animationDelay: '0.8s' }} />
                </div>
                <div className="relative mx-auto max-w-2xl">
                  <h2 className="normal-case text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Ready to Build Your AI-Powered Revenue Workforce?
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                    Capture more leads, engage customers faster, and grow revenue with AI employees that work around the clock.
                  </p>
                  <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="inline-flex w-full items-center justify-center rounded-[12px] bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 sm:w-auto"
                    >
                      Initialize workspace
                    </button>
                    <a
                      href="#features"
                      className="inline-flex w-full items-center justify-center rounded-[12px] border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 sm:w-auto"
                    >
                      Browse capabilities
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/10 bg-[#13112B] px-4 py-14">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:justify-between">
              <div>
                <div className="flex items-center gap-2 font-semibold text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </span>
                  OneEmployee<span className="text-emerald-400">®</span>
                </div>
                <p className="mt-4 max-w-sm text-sm text-white/60">
                  OneEmployee helps businesses automate customer engagement, streamline sales processes, and unlock new revenue opportunities with AI-powered workforce solutions.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                    Product
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <li>
                      <a href="#features" className="transition-colors hover:text-primary">
                        Platform
                      </a>
                    </li>
                    <li>
                      <a href="#integrations" className="transition-colors hover:text-primary">
                        Integrations
                      </a>
                    </li>
                    <li>
                      <a href="#analytics" className="transition-colors hover:text-primary">
                        Analytics
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                    Company
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="cursor-default">Documentation</li>
                    <li className="cursor-default">API status</li>
                    <li className="cursor-default">Security</li>
                  </ul>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                    Legal
                  </p>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li>
                      <Link
                        to="/privacy-policy"
                        className="text-slate-700 transition-colors hover:text-primary dark:text-slate-300"
                      >
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/terms-service"
                        className="text-slate-700 transition-colors hover:text-primary dark:text-slate-300"
                      >
                        Terms of Service
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} OneEmployee. All rights reserved.</span>
              <span className="font-mono text-[11px] text-white/30">
                BUILD V1.0.4 · EDGE LATENCY ~4.2ms
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
