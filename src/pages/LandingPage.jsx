import { useNavigate, Link } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME, IS_PHASE_1, BRAND_COLOR } from '../config/phase';

/* ── Data ── */
const FEATURES = [
  { icon: 'groups', title: 'Unified CRM', desc: 'Every lead, contact, and deal in one place. Real-time pipeline with assignment rules and instant team visibility.' },
  { icon: 'forum', title: 'WhatsApp Automation', desc: 'Sequences, templates, and smart routing that feel personal while staying compliant and blazing fast.' },
  { icon: 'call', title: 'AI Voice Calls', desc: 'Human-grade outreach at scale. Natural conversations with disposition capture and automatic CRM sync.' },
  { icon: 'campaign', title: 'Ad Integration', desc: 'Instant lead capture from Facebook and Google Ads. Attribute spend to pipeline outcomes automatically.' },
  { icon: 'smart_toy', title: 'Smart Automation', desc: 'Visual workflows connecting ads, chat, voice, and ops. No brittle scripts, just intelligent triggers.' },
  { icon: 'analytics', title: 'Live Analytics', desc: 'Track engagement, team performance, and revenue in real time. Attribution across every touchpoint.' },
];

const STEPS = [
  { num: '01', title: 'Capture', desc: 'Leads from ads, forms, WhatsApp, and calls flow into one deduplicated record automatically.', icon: 'filter_alt' },
  { num: '02', title: 'Engage', desc: 'AI voice and chat qualify intent while rules route leads by territory, score, or SLA.', icon: 'psychology' },
  { num: '03', title: 'Convert', desc: 'Triggers notify your team, update deal stages, and launch the next best action instantly.', icon: 'rocket_launch' },
];

const INTEGRATIONS = [
  { name: 'WhatsApp Business', icon: 'chat', desc: 'Messaging & routing' },
  { name: 'Google Ads', icon: 'ads_click', desc: 'Lead forms & sync' },
  { name: 'Facebook Ads', icon: 'public', desc: 'Lead capture' },
  { name: 'AI Voice', icon: 'record_voice_over', desc: 'Calls & transcripts' },
  { name: 'Email', icon: 'mail', desc: 'OAuth & templates' },
  { name: 'Webhooks', icon: 'webhook', desc: 'Custom flows' },
];

const TESTIMONIALS = [
  { quote: 'We replaced three tools with OneEmployee. Voice plus WhatsApp in one CRM finally matches how our reps actually work.', name: 'Priya Menon', role: 'VP Revenue Ops', company: 'Northwind Labs' },
  { quote: 'Lead sync from Meta and Google is instant. Our SLAs dropped from hours to minutes without extra headcount.', name: 'Nithin Reddy', role: 'Head of Growth', company: 'Atlas Realty Group' },
  { quote: 'The automation builder is enterprise-grade but approachable. We shipped new sequences in days, not quarters.', name: 'Sam Rivera', role: 'Director of Sales', company: 'Copperline Health' },
];

const STATS = [
  { value: '12k+', label: 'Leads processed daily' },
  { value: '42s', label: 'Avg response time' },
  { value: '99.2%', label: 'Uptime SLA' },
  { value: '3.8x', label: 'ROI improvement' },
];

/* ── Component ── */
const LandingPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bg = isDark ? 'bg-[#18191A]' : 'bg-white';
  const bgAlt = isDark ? 'bg-[#242526]' : 'bg-[#F7F8FA]';
  const text = isDark ? 'text-[#E4E6EB]' : 'text-[#1C1E21]';
  const textMuted = isDark ? 'text-[#B0B3B8]' : 'text-[#65676B]';
  const border = isDark ? 'border-[#3A3B3C]' : 'border-[#E4E6EB]';
  const cardBg = isDark ? 'bg-[#242526]' : 'bg-white';

  return (
    <div className={`min-h-screen font-display transition-colors duration-200 ${bg}`}>
      <LandingNavbar onLogin={() => navigate('/login')} />

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full blur-[120px] ${isDark ? 'bg-[#0866FF]/8' : 'bg-[#0866FF]/5'}`} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium border mb-6 ${isDark ? 'border-[#3A3B3C] bg-[#242526] text-[#B0B3B8]' : 'border-[#E4E6EB] bg-[#F7F8FA] text-[#65676B]'}`}>
              <span className="w-2 h-2 rounded-full bg-[#31A24C]" />
              Now with AI Voice & WhatsApp Automation
            </div>

            {/* Heading */}
            <h1 className={`text-[32px] sm:text-[44px] lg:text-[56px] font-bold leading-[1.1] tracking-tight ${text}`}>
              The CRM that
              <span className="text-[#0866FF]"> closes deals</span> while you sleep.
            </h1>

            <p className={`mt-5 text-[16px] sm:text-[18px] leading-relaxed max-w-2xl ${textMuted}`}>
              {APP_NAME} unifies leads, voice calls, WhatsApp, and ad campaigns into one intelligent workspace.
              Automate follow-ups, engage customers faster, and grow revenue with AI-powered workflows.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0866FF] text-white text-[15px] font-semibold transition-all hover:bg-[#0654D4] active:scale-[0.98] shadow-sm"
              >
                Start for free
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <a
                href="#features"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[15px] font-semibold border transition-colors ${isDark ? 'border-[#3A3B3C] text-[#E4E6EB] hover:bg-[#242526]' : 'border-[#E4E6EB] text-[#1C1E21] hover:bg-[#F7F8FA]'}`}
              >
                See how it works
              </a>
            </div>

            {/* Social proof */}
            <div className={`mt-12 flex items-center gap-6 text-[13px] ${textMuted}`}>
              <div className="flex -space-x-2">
                {['P', 'A', 'S', 'N'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[#0866FF] text-white flex items-center justify-center text-[11px] font-bold border-2 border-white dark:border-[#18191A]">
                    {l}
                  </div>
                ))}
              </div>
              <span>Trusted by <strong className={text}>500+</strong> businesses</span>
            </div>
          </div>

          {/* Hero visual — dashboard preview */}
          <div className={`mt-16 sm:mt-20 rounded-xl border overflow-hidden shadow-xl ${border} ${cardBg}`}>
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${border}`}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FA383E]" />
                <div className="w-3 h-3 rounded-full bg-[#F5A623]" />
                <div className="w-3 h-3 rounded-full bg-[#31A24C]" />
              </div>
              <span className={`text-[11px] font-medium ml-2 ${textMuted}`}>app.oneemployee.in/dashboard</span>
            </div>
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map((s) => (
                  <div key={s.label} className={`p-4 rounded-lg border ${border} ${isDark ? 'bg-[#18191A]' : 'bg-[#F7F8FA]'}`}>
                    <p className={`text-[24px] sm:text-[28px] font-bold ${text}`}>{s.value}</p>
                    <p className={`text-[12px] mt-1 ${textMuted}`}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-end gap-2 h-20">
                {[35, 52, 45, 68, 42, 75, 60, 82, 55, 90, 72, 85].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-[#0866FF]/20 relative overflow-hidden" style={{ height: `${h}%` }}>
                    <div className="absolute bottom-0 inset-x-0 bg-[#0866FF] rounded-t" style={{ height: `${h * 0.6}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className={`py-12 border-y ${border} ${bgAlt}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-[28px] sm:text-[36px] font-bold tracking-tight ${text}`}>{s.value}</p>
              <p className={`text-[13px] mt-1 ${textMuted}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#0866FF]">Platform</p>
            <h2 className={`mt-2 text-[28px] sm:text-[36px] font-bold leading-tight tracking-tight ${text}`}>
              Everything you need to convert more customers
            </h2>
            <p className={`mt-4 text-[16px] leading-relaxed ${textMuted}`}>
              Manage leads, automate communication, track opportunities, and improve team productivity — all from one platform.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`group p-6 rounded-xl border transition-all duration-200 hover:border-[#0866FF]/30 hover:shadow-md ${border} ${cardBg}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#0866FF]/15' : 'bg-[#EBF5FF]'}`}>
                  <span className="material-symbols-outlined text-[20px] text-[#0866FF]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <h3 className={`mt-4 text-[16px] font-semibold ${text}`}>{f.title}</h3>
                <p className={`mt-2 text-[14px] leading-relaxed ${textMuted}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className={`scroll-mt-20 py-20 sm:py-28 ${bgAlt}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#0866FF]">How it works</p>
            <h2 className={`mt-2 text-[28px] sm:text-[36px] font-bold leading-tight tracking-tight ${text}`}>
              From lead to customer in three steps
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.num} className={`relative p-6 sm:p-8 rounded-xl border ${border} ${cardBg}`}>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[12px] font-bold text-[#0866FF] tracking-wide">{s.num}</span>
                  {i < STEPS.length - 1 && (
                    <span className={`material-symbols-outlined text-[18px] hidden lg:block ${textMuted}`}>east</span>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${isDark ? 'bg-[#0866FF]/10' : 'bg-[#EBF5FF]'}`}>
                  <span className="material-symbols-outlined text-[24px] text-[#0866FF]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <h3 className={`text-[18px] font-semibold ${text}`}>{s.title}</h3>
                <p className={`mt-2 text-[14px] leading-relaxed ${textMuted}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ INTEGRATIONS ═══════ */}
      <section id="integrations" className="scroll-mt-20 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-14">
            <div className="max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-[#0866FF]">Integrations</p>
              <h2 className={`mt-2 text-[28px] sm:text-[36px] font-bold leading-tight tracking-tight ${text}`}>
                Connected to the tools you already use
              </h2>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {INTEGRATIONS.map((item) => (
              <div key={item.name} className={`p-5 rounded-xl border text-center transition-all duration-200 hover:border-[#0866FF]/30 hover:shadow-sm ${border} ${cardBg}`}>
                <div className={`w-11 h-11 rounded-lg mx-auto flex items-center justify-center mb-3 ${isDark ? 'bg-[#0866FF]/10' : 'bg-[#EBF5FF]'}`}>
                  <span className="material-symbols-outlined text-[22px] text-[#0866FF]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <p className={`text-[13px] font-semibold ${text}`}>{item.name}</p>
                <p className={`text-[11px] mt-0.5 ${textMuted}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section id="testimonials" className={`scroll-mt-20 py-20 sm:py-28 ${bgAlt}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#0866FF]">Customers</p>
            <h2 className={`mt-2 text-[28px] sm:text-[36px] font-bold leading-tight tracking-tight ${text}`}>
              Trusted by growing teams
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className={`p-6 sm:p-8 rounded-xl border ${border} ${cardBg}`}>
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="material-symbols-outlined text-[16px] text-[#F5A623]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className={`text-[14px] leading-relaxed ${isDark ? 'text-[#E4E6EB]' : 'text-[#1C1E21]'}`}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className={`mt-6 pt-5 border-t ${border}`}>
                  <p className={`text-[14px] font-semibold ${text}`}>{t.name}</p>
                  <p className={`text-[12px] mt-0.5 ${textMuted}`}>{t.role}, {t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className={`relative overflow-hidden rounded-2xl p-10 sm:p-16 text-center ${isDark ? 'bg-[#242526]' : 'bg-[#F7F8FA]'} border ${border}`}>
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full blur-[80px] bg-[#0866FF]/10 pointer-events-none" />
            <div className="relative">
              <h2 className={`text-[26px] sm:text-[36px] font-bold tracking-tight ${text}`}>
                Ready to grow faster?
              </h2>
              <p className={`mt-3 text-[15px] max-w-lg mx-auto ${textMuted}`}>
                Join 500+ businesses using {APP_NAME} to capture leads, automate engagement, and close more deals.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-[#0866FF] text-white text-[15px] font-semibold transition-all hover:bg-[#0654D4] active:scale-[0.98]"
                >
                  Get started free
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className={`px-7 py-3 rounded-lg text-[15px] font-semibold border transition-colors ${isDark ? 'border-[#3A3B3C] text-[#E4E6EB] hover:bg-[#3A3B3C]' : 'border-[#E4E6EB] text-[#1C1E21] hover:bg-white'}`}
                >
                  Talk to sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className={`py-12 border-t ${border}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-10">
            {/* Brand */}
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0866FF]">
                  <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                </div>
                <span className={`text-lg font-semibold ${text}`}>{APP_NAME}</span>
              </div>
              <p className={`mt-4 text-[13px] leading-relaxed ${textMuted}`}>
                AI-powered CRM workspace that helps businesses capture leads, automate engagement, and grow revenue.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${textMuted}`}>Product</p>
                <ul className="space-y-2">
                  {['Features', 'Integrations', 'Pricing', 'Changelog'].map((l) => (
                    <li key={l}><a href="#" className={`text-[13px] transition-colors ${isDark ? 'text-[#B0B3B8] hover:text-white' : 'text-[#65676B] hover:text-[#1C1E21]'}`}>{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${textMuted}`}>Company</p>
                <ul className="space-y-2">
                  {['About', 'Blog', 'Careers', 'Contact'].map((l) => (
                    <li key={l}><a href="#" className={`text-[13px] transition-colors ${isDark ? 'text-[#B0B3B8] hover:text-white' : 'text-[#65676B] hover:text-[#1C1E21]'}`}>{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${textMuted}`}>Legal</p>
                <ul className="space-y-2">
                  <li><Link to="/privacy-policy" className={`text-[13px] transition-colors ${isDark ? 'text-[#B0B3B8] hover:text-white' : 'text-[#65676B] hover:text-[#1C1E21]'}`}>Privacy</Link></li>
                  <li><Link to="/terms" className={`text-[13px] transition-colors ${isDark ? 'text-[#B0B3B8] hover:text-white' : 'text-[#65676B] hover:text-[#1C1E21]'}`}>Terms</Link></li>
                  <li><a href="#" className={`text-[13px] transition-colors ${isDark ? 'text-[#B0B3B8] hover:text-white' : 'text-[#65676B] hover:text-[#1C1E21]'}`}>Security</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`mt-10 pt-6 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${border}`}>
            <p className={`text-[12px] ${textMuted}`}>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <p className={`text-[12px] ${textMuted}`}>Made in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
