import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME } from '../config/phase';
import {
  SALES_CONTACT, PITCH, AD_SPEND_TIERS, LEAK_POINTS, FLOW_STEPS, SOFTWARE_FEATURES, SERVICES,
  BENEFITS, PLAN_INCLUDES, PLAN_DURATIONS, PLANS, PRICING_NOTES, ONBOARDING_STEPS, FAQS,
  inr, perMonth, savingPct, planForLeads,
} from './sales/salesContent';

/* ── Small building blocks ─────────────────────────────────────────────────── */

const Icon = ({ name, className = '', filled = false }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    aria-hidden="true"
  >
    {name}
  </span>
);

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0866FF]';
const card = 'rounded-2xl border border-[#E4E6EB] bg-white dark:border-[#3A3B3C] dark:bg-[#242526]';
const muted = 'text-[#65676B] dark:text-[#B0B3B8]';
const strong = 'text-[#1C1E21] dark:text-[#E4E6EB]';

const mailto = (subject) => `mailto:${SALES_CONTACT.email}?subject=${encodeURIComponent(subject)}`;
const whatsappLink = SALES_CONTACT.whatsapp
  ? `https://wa.me/${SALES_CONTACT.whatsapp}?text=${encodeURIComponent(`Hi, I'd like a demo of ${APP_NAME}.`)}`
  : null;
const phoneLink = SALES_CONTACT.phone ? `tel:+${SALES_CONTACT.phone.replace(/^\+/, '')}` : null;

function Section({ id, eyebrow, title, intro, slide, children, alt = false }) {
  return (
    <section
      id={slide ? undefined : id}
      aria-labelledby={`${id}-title`}
      className={slide
        ? 'w-full'
        : `scroll-mt-32 py-16 sm:py-24 print:py-8 print:break-inside-avoid ${alt ? 'bg-[#F7F8FA] dark:bg-[#1F2021]' : ''}`}
    >
      <div className={slide ? 'w-full' : 'mx-auto max-w-7xl px-5 sm:px-8 lg:px-12'}>
        <div className="max-w-3xl">
          {eyebrow && <p className="text-[13px] font-semibold uppercase tracking-wider text-[#0866FF]">{eyebrow}</p>}
          <h2 id={`${id}-title`} className={`mt-2 font-bold leading-tight tracking-tight ${strong} ${slide ? 'text-[28px] sm:text-[40px]' : 'text-[28px] sm:text-[36px]'}`}>
            {title}
          </h2>
          {intro && <p className={`mt-4 text-[16px] leading-relaxed ${muted}`}>{intro}</p>}
        </div>
        <div className={slide ? 'mt-8' : 'mt-12'}>{children}</div>
      </div>
    </section>
  );
}

function ContactButtons({ subject, compact = false }) {
  const base = `inline-flex items-center gap-2 rounded-lg font-semibold transition-colors ${focusRing} ${compact ? 'px-4 py-2 text-[14px]' : 'px-6 py-3 text-[15px]'}`;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={mailto(subject)} className={`${base} bg-[#0866FF] text-white hover:bg-[#0654D4]`}>
        <Icon name="event_available" className="text-[18px]" /> Book a demo
      </a>
      {whatsappLink && (
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={`${base} border border-[#25D366] text-[#128C4B] hover:bg-[#25D366]/10 dark:text-[#4ADE80]`}>
          <Icon name="chat" className="text-[18px]" /> WhatsApp us
        </a>
      )}
      {phoneLink && (
        <a href={phoneLink} className={`${base} border border-[#E4E6EB] ${strong} hover:bg-[#F0F2F5] dark:border-[#3A3B3C] dark:hover:bg-[#3A3B3C]`}>
          <Icon name="call" className="text-[18px]" /> Call sales
        </a>
      )}
    </div>
  );
}

/* ── Sections ──────────────────────────────────────────────────────────────── */

function CoverSection({ slide, onPresent }) {
  return (
    <section
      id={slide ? undefined : 'overview'}
      aria-labelledby="overview-title"
      className={slide ? 'w-full' : 'relative overflow-hidden scroll-mt-32 print:break-inside-avoid'}
    >
      {!slide && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#0866FF]/8 blur-[120px]" />
        </div>
      )}
      <div className={slide ? 'w-full' : 'relative mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:px-12'}>
        <p className="inline-flex items-center gap-2 rounded-full border border-[#E4E6EB] bg-[#F7F8FA] px-3 py-1.5 text-[12px] font-medium text-[#65676B] dark:border-[#3A3B3C] dark:bg-[#242526] dark:text-[#B0B3B8]">
          <span className="h-2 w-2 rounded-full bg-[#31A24C]" /> {PITCH.eyebrow}
        </p>
        <h1 id="overview-title" className={`mt-5 max-w-4xl font-bold leading-[1.1] tracking-tight ${strong} ${slide ? 'text-[36px] sm:text-[56px]' : 'text-[34px] sm:text-[48px] lg:text-[56px]'}`}>
          {PITCH.title.split('never misses').length > 1 ? (
            <>
              {PITCH.title.split('never misses')[0]}
              <span className="text-[#0866FF]">never misses</span>
              {PITCH.title.split('never misses')[1]}
            </>
          ) : PITCH.title}
        </h1>
        <p className={`mt-5 max-w-2xl text-[17px] leading-relaxed sm:text-[19px] ${muted}`}>{PITCH.subtitle}</p>

        <ul className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {PITCH.highlights.map((h) => (
            <li key={h.label} className={`${card} flex flex-col gap-2 p-4`}>
              <Icon name={h.icon} filled className="text-[22px] text-[#0866FF]" />
              <span className={`text-[13px] font-semibold leading-snug ${strong}`}>{h.label}</span>
            </li>
          ))}
        </ul>

        {!slide && (
          <div className="mt-10 flex flex-wrap items-center gap-3 print:hidden">
            <a href="#pricing" className={`inline-flex items-center gap-2 rounded-lg bg-[#0866FF] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0654D4] ${focusRing}`}>
              See plans & pricing <Icon name="arrow_downward" className="text-[18px]" />
            </a>
            <button
              type="button"
              onClick={onPresent}
              className={`inline-flex items-center gap-2 rounded-lg border border-[#E4E6EB] px-6 py-3 text-[15px] font-semibold ${strong} transition-colors hover:bg-[#F0F2F5] dark:border-[#3A3B3C] dark:hover:bg-[#3A3B3C] ${focusRing}`}
            >
              <Icon name="slideshow" className="text-[18px]" /> Start presentation
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function AdSpendSection({ slide }) {
  return (
    <Section
      id="ad-spend"
      slide={slide}
      alt
      eyebrow="The reality"
      title="Your clients already spend on ads every month"
      intro="Typical Meta Ads spend by real-estate businesses in India. Whether the ads perform or not, this budget is spent every month — what matters is how fast each lead is called and followed up."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {AD_SPEND_TIERS.map((t) => {
          const plan = PLANS.find((p) => p.id === t.plan);
          return (
            <article key={t.id} className={`${card} flex flex-col p-6`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EBF5FF] dark:bg-[#0866FF]/15">
                  <Icon name={t.icon} filled className="text-[20px] text-[#0866FF]" />
                </span>
                <div>
                  <h3 className={`text-[16px] font-semibold ${strong}`}>{t.title}</h3>
                  <p className={`text-[12px] ${muted}`}>{t.who}</p>
                </div>
              </div>
              <p className={`mt-5 text-[26px] font-bold tracking-tight ${strong}`}>{t.monthly}</p>
              <p className={`text-[13px] ${muted}`}>{t.period}</p>
              <ul className="mt-4 space-y-2">
                {t.points.map((pt) => (
                  <li key={pt} className={`flex gap-2 text-[14px] leading-relaxed ${muted}`}>
                    <Icon name="arrow_right" className="mt-0.5 text-[18px] text-[#0866FF]" /> <span>{pt}</span>
                  </li>
                ))}
              </ul>
              {plan && (
                <p className="mt-auto pt-5 text-[13px] font-semibold text-[#0866FF]">
                  Fits: {plan.name} — from {inr(perMonth(plan, '12m'))}/mo
                </p>
              )}
            </article>
          );
        })}
      </div>

      <h3 className={`mt-14 text-[20px] font-semibold ${strong}`}>Where that ad money leaks</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LEAK_POINTS.map((l) => (
          <div key={l.title} className={`${card} p-5`}>
            <Icon name={l.icon} className="text-[22px] text-[#E4572E]" />
            <p className={`mt-3 text-[15px] font-semibold ${strong}`}>{l.title}</p>
            <p className={`mt-1.5 text-[14px] leading-relaxed ${muted}`}>{l.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SolutionSection({ slide }) {
  return (
    <Section
      id="solution"
      slide={slide}
      eyebrow="The solution"
      title={`Meet your One Employee`}
      intro="From the moment a lead arrives to a booked site visit, every step runs automatically and is recorded in your CRM."
    >
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {FLOW_STEPS.map((s, i) => (
          <li key={s.title} className={`${card} relative p-5`}>
            <span className="text-[12px] font-bold tracking-wide text-[#0866FF]">{String(i + 1).padStart(2, '0')}</span>
            <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF5FF] dark:bg-[#0866FF]/15">
              <Icon name={s.icon} filled className="text-[22px] text-[#0866FF]" />
            </span>
            <p className={`mt-4 text-[15px] font-semibold ${strong}`}>{s.title}</p>
            <p className={`mt-1.5 text-[13px] leading-relaxed ${muted}`}>{s.desc}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function FeaturesSection({ slide }) {
  return (
    <Section
      id="features"
      slide={slide}
      alt
      eyebrow="Software"
      title="Everything in the software"
      intro="One platform for calling, follow-up, projects and leads — set up by our team around your business."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SOFTWARE_FEATURES.map((f) => (
          <div key={f.title} className={`${card} p-5 ${f.soon ? 'border-dashed' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EBF5FF] dark:bg-[#0866FF]/15">
                <Icon name={f.icon} filled className="text-[20px] text-[#0866FF]" />
              </span>
              {f.soon && (
                <span className="rounded-full bg-[#FFF4E5] px-2 py-0.5 text-[11px] font-semibold text-[#B45309] dark:bg-[#B45309]/20 dark:text-[#FBBF24]">Coming soon</span>
              )}
            </div>
            <p className={`mt-4 text-[15px] font-semibold ${strong}`}>{f.title}</p>
            <p className={`mt-1.5 text-[14px] leading-relaxed ${muted}`}>{f.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ServicesSection({ slide }) {
  return (
    <Section
      id="services"
      slide={slide}
      eyebrow="Marketing & promotion"
      title="We also bring the buyers in"
      intro="Property promotion services that feed leads straight into the system. Quoted separately, per project."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.title} className={`${card} flex gap-4 p-5`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF] dark:bg-[#7C3AED]/20">
              <Icon name={s.icon} filled className="text-[20px] text-[#7C3AED] dark:text-[#C4B5FD]" />
            </span>
            <div>
              <p className={`text-[15px] font-semibold ${strong}`}>{s.title}</p>
              <p className={`mt-1 text-[14px] leading-relaxed ${muted}`}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function BenefitsSection({ slide }) {
  return (
    <Section
      id="benefits"
      slide={slide}
      alt
      eyebrow="Benefits"
      title="What builders, brokers and project owners get"
    >
      <ul className="grid gap-3 md:grid-cols-2">
        {BENEFITS.map((b) => (
          <li key={b.text} className={`${card} flex items-start gap-3 p-4`}>
            <Icon name={b.icon} filled className="mt-0.5 text-[20px] text-[#31A24C]" />
            <span className={`text-[15px] leading-relaxed ${strong}`}>{b.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RoiSection({ slide, roi, setRoi }) {
  const { spend, cpl } = roi;
  const leads = Math.max(1, Math.round(spend / cpl));
  const plan = planForLeads(leads);
  const planMonthly = plan ? perMonth(plan, '12m') : null;
  const pctOfSpend = planMonthly ? (planMonthly / spend) * 100 : null;
  const addedPerLead = planMonthly ? planMonthly / leads : null;

  const slider = (key, label, min, max, step, format) => (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`roi-${key}`} className={`text-[14px] font-semibold ${strong}`}>{label}</label>
        <span className="text-[18px] font-bold text-[#0866FF]">{format(roi[key])}</span>
      </div>
      <input
        id={`roi-${key}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={roi[key]}
        aria-valuetext={format(roi[key])}
        onChange={(e) => setRoi((r) => ({ ...r, [key]: Number(e.target.value) }))}
        className="mt-3 w-full accent-[#0866FF]"
      />
      <div className={`mt-1 flex justify-between text-[11px] ${muted}`}><span>{format(min)}</span><span>{format(max)}</span></div>
    </div>
  );

  return (
    <Section
      id="roi"
      slide={slide}
      eyebrow="Do the math"
      title="Plan cost vs. what they already spend on ads"
      intro="Move the sliders to the client's numbers. Plan prices use the 12-month rate."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${card} space-y-8 p-6`}>
          {slider('spend', 'Monthly ad spend', 10000, 300000, 5000, inr)}
          {slider('cpl', 'Cost per lead', 150, 1000, 10, inr)}
          <p className={`text-[12px] ${muted}`}>Typical cost per lead: ₹550–750 in month 1, ₹150–300 once campaigns are optimised.</p>
        </div>

        <div className={`${card} p-6`} aria-live="polite">
          <p className={`text-[13px] font-semibold uppercase tracking-wider ${muted}`}>Leads per month</p>
          <p className={`mt-1 text-[40px] font-bold tracking-tight ${strong}`}>~{leads.toLocaleString('en-IN')}</p>
          {plan ? (
            <>
              <div className="mt-5 rounded-xl bg-[#EBF5FF] p-4 dark:bg-[#0866FF]/15">
                <p className={`text-[14px] ${strong}`}>
                  Recommended: <strong>{plan.name}</strong> (up to {plan.limits.leads.toLocaleString('en-IN')} leads/mo)
                </p>
                <p className="mt-1 text-[28px] font-bold text-[#0866FF]">{inr(planMonthly)}<span className="text-[15px] font-semibold">/mo</span></p>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <dt className={`text-[12px] ${muted}`}>Share of ad spend</dt>
                  <dd className={`text-[22px] font-bold ${strong}`}>{pctOfSpend.toFixed(pctOfSpend < 10 ? 1 : 0)}%</dd>
                </div>
                <div>
                  <dt className={`text-[12px] ${muted}`}>Added per lead</dt>
                  <dd className={`text-[22px] font-bold ${strong}`}>{inr(addedPerLead)}</dd>
                </div>
              </dl>
              <p className={`mt-5 text-[14px] leading-relaxed ${muted}`}>
                Each lead already costs {inr(cpl)} in ads. For {inr(addedPerLead)} more, every one of them is called, qualified and followed up — a lead nobody calls is {inr(cpl)} wasted.
              </p>
            </>
          ) : (
            <p className={`mt-5 text-[15px] leading-relaxed ${strong}`}>
              Above the Pro plan's 5,000 leads a month — we'll put together a custom plan.
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}

function DurationToggle({ duration, setDuration }) {
  return (
    <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-xl border border-[#E4E6EB] bg-[#F7F8FA] p-1 dark:border-[#3A3B3C] dark:bg-[#18191A]">
      {PLAN_DURATIONS.map((d) => {
        const active = d.key === duration;
        return (
          <button
            key={d.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setDuration(d.key)}
            className={`relative rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors ${focusRing} ${active ? 'bg-white text-[#0866FF] shadow-sm dark:bg-[#3A3B3C] dark:text-white' : `${muted} hover:text-[#1C1E21] dark:hover:text-white`}`}
          >
            {d.label}
            {d.key === '12m' && <span className="ml-1.5 rounded-full bg-[#31A24C] px-1.5 py-0.5 text-[10px] font-bold text-white">Best value</span>}
          </button>
        );
      })}
    </div>
  );
}

function PricingSection({ slide, duration, setDuration }) {
  const dur = PLAN_DURATIONS.find((d) => d.key === duration);
  return (
    <Section
      id="pricing"
      slide={slide}
      alt
      eyebrow="Plans & pricing"
      title="Sab milega — no feature cut in any plan"
      intro="Every plan has the full software. Plans differ only in how many leads, projects, users and AI chats they cover."
    >
      <div className="print:hidden"><DurationToggle duration={duration} setDuration={setDuration} /></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => {
          const save = savingPct(p, duration);
          return (
            <article
              key={p.id}
              aria-label={`${p.name} plan`}
              className={`${card} relative flex flex-col p-6 ${p.popular ? 'border-2 border-[#0866FF] shadow-lg shadow-[#0866FF]/10 dark:border-[#0866FF]' : ''}`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-[#0866FF] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Most popular</span>
              )}
              <h3 className={`text-[22px] font-bold ${strong}`}>{p.name}</h3>
              <p className={`mt-1 text-[14px] ${muted}`}>{p.audience}</p>

              <div className="mt-6">
                <p className={`text-[36px] font-bold leading-none tracking-tight ${strong}`}>{inr(p.prices[duration])}</p>
                <p className={`mt-2 text-[14px] ${muted}`}>
                  for {dur.label.toLowerCase()} · <strong className={strong}>{inr(perMonth(p, duration))}/mo</strong>
                </p>
                <p className="mt-2 h-5 text-[13px] font-semibold text-[#31A24C]">{save > 0 ? `Save ${save}% vs 3-month billing` : ''}</p>
              </div>

              <ul className={`mt-5 grid grid-cols-2 gap-3 rounded-xl border border-[#E4E6EB] p-4 dark:border-[#3A3B3C]`}>
                {[
                  ['Leads / month', p.limits.leads.toLocaleString('en-IN')],
                  ['Projects', String(p.limits.projects)],
                  ['Sales users', String(p.limits.users)],
                  ['AI chats / month', p.limits.aiChats.toLocaleString('en-IN')],
                ].map(([k, v]) => (
                  <li key={k}>
                    <p className={`text-[18px] font-bold ${strong}`}>{v}</p>
                    <p className={`text-[12px] ${muted}`}>{k}</p>
                  </li>
                ))}
              </ul>

              <ul className="mt-5 space-y-2.5">
                {PLAN_INCLUDES.map((f) => (
                  <li key={f} className={`flex gap-2 text-[14px] leading-snug ${strong}`}>
                    <Icon name="check_circle" filled className="text-[18px] text-[#31A24C]" /> {f}
                  </li>
                ))}
                {p.extras.map((x) => (
                  <li key={x} className="flex gap-2 text-[14px] font-semibold leading-snug text-[#0866FF]">
                    <Icon name="add_circle" filled className="text-[18px]" /> {x}
                  </li>
                ))}
              </ul>

              <p className={`mt-5 text-[13px] italic ${muted}`}>{p.note}</p>

              <a
                href={mailto(`${APP_NAME} ${p.name} plan — ${dur.label}`)}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[15px] font-semibold transition-colors print:hidden ${focusRing} ${p.popular ? 'bg-[#0866FF] text-white hover:bg-[#0654D4]' : `border border-[#E4E6EB] ${strong} hover:bg-[#F0F2F5] dark:border-[#3A3B3C] dark:hover:bg-[#3A3B3C]`}`}
              >
                Choose {p.name}
              </a>
            </article>
          );
        })}
      </div>

      <ul className={`mt-8 space-y-1.5 text-[13px] ${muted}`}>
        {PRICING_NOTES.map((n) => <li key={n} className="flex gap-2"><Icon name="info" className="text-[16px]" /> {n}</li>)}
      </ul>
    </Section>
  );
}

function CompareSection({ slide, duration }) {
  const dur = PLAN_DURATIONS.find((d) => d.key === duration);
  const rows = [
    { label: `Price (${dur.label})`, values: PLANS.map((p) => inr(p.prices[duration])) },
    { label: 'Per month', values: PLANS.map((p) => `${inr(perMonth(p, duration))}/mo`) },
    { label: 'Leads per month', values: PLANS.map((p) => p.limits.leads.toLocaleString('en-IN')) },
    { label: 'Projects', values: PLANS.map((p) => String(p.limits.projects)) },
    { label: 'Sales users', values: PLANS.map((p) => String(p.limits.users)) },
    { label: 'AI chats per month', values: PLANS.map((p) => p.limits.aiChats.toLocaleString('en-IN')) },
    ...PLAN_INCLUDES.map((f) => ({ label: f, values: PLANS.map(() => true) })),
    { label: 'Onboarding', values: ['Standard', 'Priority', 'Dedicated manager'] },
  ];
  return (
    <Section id="compare" slide={slide} eyebrow="Side by side" title="Compare plans">
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <caption className="sr-only">Plan comparison for {dur.label} billing</caption>
          <thead>
            <tr className="border-b border-[#E4E6EB] dark:border-[#3A3B3C]">
              <th scope="col" className={`px-5 py-4 font-semibold ${muted}`}>Feature</th>
              {PLANS.map((p) => (
                <th key={p.id} scope="col" className={`px-5 py-4 text-[16px] font-bold ${p.popular ? 'text-[#0866FF]' : strong}`}>
                  {p.name}{p.popular && <span className="ml-2 align-middle text-[11px] font-semibold uppercase">Popular</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-[#E4E6EB] last:border-0 dark:border-[#3A3B3C]">
                <th scope="row" className={`px-5 py-3 font-medium ${strong}`}>{r.label}</th>
                {r.values.map((v, i) => (
                  <td key={PLANS[i].id} className={`px-5 py-3 ${strong}`}>
                    {v === true ? <><Icon name="check" className="text-[20px] text-[#31A24C]" /><span className="sr-only">Included</span></> : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function FaqSection({ slide }) {
  return (
    <Section
      id="faq"
      slide={slide}
      alt
      eyebrow="FAQ"
      title="Questions clients ask"
    >
      <div className="space-y-3">
        {FAQS.map((f) => (
          <details key={f.q} className={`${card} group p-5 [&_summary::-webkit-details-marker]:hidden`}>
            <summary className={`flex cursor-pointer list-none items-start justify-between gap-4 text-[16px] font-semibold ${strong} ${focusRing} rounded-md`}>
              {f.q}
              <Icon name="expand_more" className="shrink-0 text-[22px] text-[#0866FF] transition-transform group-open:rotate-180" />
            </summary>
            <p className={`mt-3 text-[15px] leading-relaxed ${muted}`}>{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function NextStepsSection({ slide }) {
  return (
    <Section
      id="next-steps"
      slide={slide}
      eyebrow="Getting started"
      title="Live in four steps"
    >
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ONBOARDING_STEPS.map((s, i) => (
          <li key={s.title} className={`${card} p-5`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0866FF] text-[14px] font-bold text-white">{i + 1}</span>
            <p className={`mt-4 flex items-center gap-2 text-[16px] font-semibold ${strong}`}><Icon name={s.icon} className="text-[20px] text-[#0866FF]" /> {s.title}</p>
            <p className={`mt-1.5 text-[14px] leading-relaxed ${muted}`}>{s.desc}</p>
          </li>
        ))}
      </ol>
      <div className={`${card} mt-8 flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between`}>
        <div>
          <p className={`text-[22px] font-bold ${strong}`}>Ready to see it on your own project?</p>
          <p className={`mt-1 text-[15px] ${muted}`}>We'll show the AI calling a lead for your project, live.</p>
        </div>
        <div className="print:hidden"><ContactButtons subject={`${APP_NAME} demo request`} /></div>
      </div>
    </Section>
  );
}

/* ── Presentation mode ─────────────────────────────────────────────────────── */

function Presentation({ slides, startAt, onClose }) {
  const [index, setIndex] = useState(startAt);
  const dialogRef = useRef(null);
  const touchX = useRef(null);
  const last = slides.length - 1;

  const go = useCallback((n) => setIndex(Math.max(0, Math.min(last, n))), [last]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') { onClose(); return; }
      const onControl = tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY';
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !onControl)) { e.preventDefault(); setIndex((i) => Math.min(last, i + 1)); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
      else if (e.key === 'Home') setIndex(0);
      else if (e.key === 'End') setIndex(last);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [last, onClose]);

  const slide = slides[index];
  const btn = `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors disabled:opacity-40 ${focusRing}`;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${APP_NAME} sales presentation`}
      className="fixed inset-0 z-[100] flex flex-col bg-white outline-none dark:bg-[#18191A]"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between border-b border-[#E4E6EB] px-4 py-3 dark:border-[#3A3B3C] sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0866FF]"><Icon name="hub" filled className="text-[18px] text-white" /></span>
          <span className={`text-[15px] font-semibold ${strong}`}>{APP_NAME}</span>
          <span className={`hidden text-[14px] sm:inline ${muted}`}>· {slide.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[13px] tabular-nums ${muted}`} aria-live="polite">{index + 1} / {slides.length}</span>
          <button type="button" onClick={onClose} className={`${btn} ${strong} hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]`} aria-label="Exit presentation">
            <Icon name="close" className="text-[20px]" /> <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      <div className="h-1 bg-[#E4E6EB] dark:bg-[#3A3B3C]" aria-hidden="true">
        <div className="h-1 bg-[#0866FF] transition-all duration-300" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* key remounts the slide so the fade-in replays on every change */}
        <div
          key={slide.id}
          className="mx-auto flex min-h-full w-full max-w-6xl animate-fade-in flex-col justify-center px-5 py-8 motion-reduce:animate-none sm:px-10 sm:py-12"
        >
          {slide.render()}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#E4E6EB] px-4 py-3 dark:border-[#3A3B3C] sm:px-8">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className={`${btn} ${strong} hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]`}>
          <Icon name="arrow_back" className="text-[20px]" /> Previous
        </button>
        <div className="hidden items-center gap-1.5 md:flex" role="tablist" aria-label="Slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}: ${s.label}`}
              onClick={() => go(i)}
              className={`h-2.5 rounded-full transition-all ${focusRing} ${i === index ? 'w-7 bg-[#0866FF]' : 'w-2.5 bg-[#CCD0D5] hover:bg-[#8A8D91] dark:bg-[#4E4F50]'}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(index + 1)} disabled={index === last} className={`${btn} bg-[#0866FF] text-white hover:bg-[#0654D4]`}>
          Next <Icon name="arrow_forward" className="text-[20px]" />
        </button>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'ad-spend', label: 'Ad spend' },
  { id: 'solution', label: 'Solution' },
  { id: 'features', label: 'Features' },
  { id: 'services', label: 'Services' },
  { id: 'roi', label: 'ROI' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

const SalesPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { hash } = useLocation();
  const [duration, setDuration] = useState('12m');
  const [roi, setRoi] = useState({ spend: 40000, cpl: 550 });
  const [presentAt, setPresentAt] = useState(null);
  const [copied, setCopied] = useState(false);
  const presentBtnRef = useRef(null);

  useEffect(() => {
    const prev = document.title;
    document.title = `${APP_NAME} — Plans & Pricing for Real Estate`;
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const el = document.getElementById(hash.slice(1));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
  }, [hash]);

  const slides = useMemo(() => [
    { id: 'overview', label: 'Overview', render: () => <CoverSection slide /> },
    { id: 'ad-spend', label: 'Ad spend', render: () => <AdSpendSection slide /> },
    { id: 'solution', label: 'Solution', render: () => <SolutionSection slide /> },
    { id: 'features', label: 'Software', render: () => <FeaturesSection slide /> },
    { id: 'services', label: 'Services', render: () => <ServicesSection slide /> },
    { id: 'benefits', label: 'Benefits', render: () => <BenefitsSection slide /> },
    { id: 'roi', label: 'ROI', render: () => <RoiSection slide roi={roi} setRoi={setRoi} /> },
    { id: 'pricing', label: 'Pricing', render: () => <PricingSection slide duration={duration} setDuration={setDuration} /> },
    { id: 'compare', label: 'Compare', render: () => <CompareSection slide duration={duration} /> },
    { id: 'faq', label: 'FAQ', render: () => <FaqSection slide /> },
    { id: 'next-steps', label: 'Next steps', render: () => <NextStepsSection slide /> },
  ], [roi, duration]);

  const startPresentation = useCallback((at = 0) => {
    setPresentAt(at);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const closePresentation = useCallback(() => {
    setPresentAt(null);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    requestAnimationFrame(() => presentBtnRef.current?.focus());
  }, []);

  const share = async () => {
    const url = `${window.location.origin}/sales`;
    try {
      if (navigator.share) { await navigator.share({ title: `${APP_NAME} — Plans & Pricing`, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* user cancelled share */ }
  };

  const headerBtn = `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors ${focusRing}`;

  return (
    <div className="min-h-screen bg-white font-display text-[#1C1E21] dark:bg-[#18191A] dark:text-[#E4E6EB]">
      <header className="sticky top-0 z-50 border-b border-[#E4E6EB] bg-white/95 backdrop-blur-lg dark:border-[#3A3B3C] dark:bg-[#1C1E21]/95 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12">
          <Link to="/" className={`flex items-center gap-2.5 rounded-lg ${focusRing}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0866FF]"><Icon name="hub" filled className="text-[18px] text-white" /></span>
            <span className={`text-lg font-semibold tracking-tight ${strong}`}>{APP_NAME}</span>
            <span className="rounded-full bg-[#EBF5FF] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0866FF] dark:bg-[#0866FF]/20">Sales</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <button ref={presentBtnRef} type="button" onClick={() => startPresentation(0)} className={`${headerBtn} bg-[#0866FF] text-white hover:bg-[#0654D4]`}>
              <Icon name="slideshow" className="text-[18px]" /> <span className="hidden sm:inline">Present</span>
            </button>
            <button type="button" onClick={share} className={`${headerBtn} ${strong} hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]`} aria-label="Share link to this page">
              <Icon name={copied ? 'check' : 'share'} className="text-[18px]" /> <span className="hidden md:inline">{copied ? 'Link copied' : 'Share'}</span>
            </button>
            <button type="button" onClick={() => window.print()} className={`${headerBtn} ${strong} hidden hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] sm:inline-flex`} aria-label="Print or save as PDF">
              <Icon name="picture_as_pdf" className="text-[18px]" /> <span className="hidden lg:inline">PDF</span>
            </button>
            <button type="button" onClick={toggleTheme} className={`${headerBtn} ${muted} hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]`} aria-label="Toggle theme">
              <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} className="text-[18px]" />
            </button>
            <Link to="/login" className={`${headerBtn} ${strong} hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C]`}>Log in</Link>
          </div>
        </div>
        <nav aria-label="Sales sections" className="mx-auto max-w-7xl overflow-x-auto px-5 pb-2 sm:px-8 lg:px-12">
          <ul className="flex gap-1 whitespace-nowrap">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className={`inline-block rounded-lg px-3 py-1.5 text-[13px] font-medium ${muted} transition-colors hover:bg-[#F0F2F5] hover:text-[#1C1E21] dark:hover:bg-white/10 dark:hover:text-white ${focusRing}`}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main>
        <CoverSection onPresent={() => startPresentation(0)} />
        <AdSpendSection />
        <SolutionSection />
        <FeaturesSection />
        <ServicesSection />
        <BenefitsSection />
        <RoiSection roi={roi} setRoi={setRoi} />
        <PricingSection duration={duration} setDuration={setDuration} />
        <CompareSection duration={duration} />
        <FaqSection />
        <NextStepsSection />
      </main>

      <footer className="border-t border-[#E4E6EB] py-8 dark:border-[#3A3B3C] print:hidden">
        <div className={`mx-auto flex max-w-7xl flex-col gap-3 px-5 text-[13px] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 ${muted}`}>
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Prices in INR.</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/privacy-policy" className="hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </footer>

      {presentAt !== null && <Presentation slides={slides} startAt={presentAt} onClose={closePresentation} />}
    </div>
  );
};

export default SalesPage;
