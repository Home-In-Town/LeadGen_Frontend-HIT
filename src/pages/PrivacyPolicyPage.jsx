import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const glassCard =
    'rounded-[28px] border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl shadow-[0_10px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_60px_rgba(0,0,0,0.45)]';

  const sectionClass =
    'group rounded-[28px] border border-slate-200/60 dark:border-white/10 bg-white/35 dark:bg-white/[0.03] backdrop-blur-2xl p-6 md:p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]';

  return (
    <div className="animate-fade-in min-h-screen font-display transition-colors duration-300">
      <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#07080c] dark:text-slate-100">
        
        {/* Landing Background */}
        <div
          className="pointer-events-none fixed inset-0 landing-gradient-mesh opacity-90 dark:opacity-100"
          aria-hidden
        />

        <div
          className="pointer-events-none fixed inset-0 landing-grid-bg opacity-40 dark:opacity-30"
          aria-hidden
        />

        {/* Glow Orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-[-150px] right-[-120px] h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        {/* NAVBAR */}
        <nav
          className="
            sticky
            top-0
            z-50

            border-b
            border-slate-200/70
            dark:border-white/10

            bg-white/60
            dark:bg-[#050608]/60

            backdrop-blur-2xl
          "
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
            
            {/* Logo */}
            <div
              onClick={() => navigate('/')}
              className="group flex cursor-pointer items-center gap-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/25">
                                    <span className="material-symbols-outlined text-[20px]">hub</span>
                                </span>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                  OneEmployee®
                </p>

                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-white/40">
                  Privacy & Security
                </p>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="
                flex items-center gap-2

                rounded-2xl

                border border-slate-200/70
                dark:border-white/10

                bg-white/50
                dark:bg-white/[0.03]

                px-4 py-3

                text-[10px]
                font-black
                uppercase
                tracking-[0.25em]

                text-slate-700
                dark:text-white/70

                backdrop-blur-xl

                transition-all
                duration-300

                hover:scale-[1.03]
                hover:border-primary/40
                hover:text-primary
              "
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>

              Return
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="relative">
          <div className="mx-auto max-w-7xl px-5 pb-10 pt-14 md:px-8 md:pb-16 md:pt-20">
            
            <div className={`${glassCard} overflow-hidden p-8 md:p-12`}>
              
              {/* Top Tag */}
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-5 py-2.5 backdrop-blur-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                  Security Protocol // 001
                </span>
              </div>

              <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-end">
                
                {/* LEFT */}
                <div>
                  <h1
                    className="
                      text-5xl
                      md:text-7xl

                      font-black

                      uppercase

                      leading-[0.88]

                      tracking-[-0.08em]

                      text-slate-900
                      dark:text-white
                    "
                  >
                    Privacy
                    <br />
                    Policy
                  </h1>

                  <p
                    className="
                      mt-7
                      max-w-2xl

                      text-sm
                      md:text-base

                      leading-relaxed

                      text-slate-600
                      dark:text-white/50
                    "
                  >
                    Transparency, encryption, and responsible data handling are
                    deeply integrated into every layer of the OneEmployee
                    ecosystem.
                  </p>
                </div>

                {/* RIGHT INFO PANEL */}
                <div
                  className="
                    rounded-[28px]

                    border
                    border-white/10

                    bg-gradient-to-br
                    from-primary/15
                    via-cyan-500/10
                    to-transparent

                    p-7

                    backdrop-blur-2xl
                  "
                >
                  <div className="flex items-center gap-4">
                    
                    <div
                      className="
                        flex h-14 w-14 items-center justify-center

                        rounded-2xl

                        bg-primary/20

                        text-primary
                      "
                    >
                      <span className="material-symbols-outlined text-[26px]">
                        verified_user
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                        Last Updated
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                        March 2026
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 border-t border-white/10 pt-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 dark:text-white/30">
                      Version
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      1.0.4
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <main className="relative z-10 mx-auto max-w-5xl px-5 pb-24 md:px-8">
          
          <div className="space-y-8">

            {/* SECTION 1 */}
            <section className={sectionClass}>
              
              <div className="mb-6 flex items-center gap-4">
                
                <div
                  className="
                    flex h-14 w-14 items-center justify-center

                    rounded-2xl

                    bg-primary/10

                    text-primary
                  "
                >
                  <span className="material-symbols-outlined text-[26px]">
                    database
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black uppercase tracking-[0.15em]">
                    01. Data Ingestion
                  </h2>

                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-white/30">
                    Lead Acquisition Protocol
                  </p>
                </div>
              </div>

              <div className="space-y-5 text-sm leading-relaxed text-slate-600 dark:text-white/60">
                <p>
                  Our lead filtration systems ingest data provided via integrated
                  channels (Facebook Lead Ads, Google Ads). This data is processed
                  through our proprietary qualification protocols to determine lead
                  viability.
                </p>

                <p>
                  We do not sell your data. We process it solely for the purpose
                  of high-volume filtration and routing as specified by your
                  organization's configuration.
                </p>
              </div>
            </section>

            {/* SECTION 2 */}
            <section className={sectionClass}>
              
              <div className="mb-6 flex items-center gap-4">
                
                <div
                  className="
                    flex h-14 w-14 items-center justify-center

                    rounded-2xl

                    bg-cyan-500/10

                    text-cyan-400
                  "
                >
                  <span className="material-symbols-outlined text-[26px]">
                    lock
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black uppercase tracking-[0.15em]">
                    02. Encryption Standards
                  </h2>

                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-white/30">
                    Infrastructure Security Layer
                  </p>
                </div>
              </div>

              <div className="text-sm leading-relaxed text-slate-600 dark:text-white/60">
                <p>
                  All data in transit is protected via military-grade TLS 1.3
                  encryption. Lead information stored in our infrastructure corpus
                  is encrypted at rest using AES-256 protocols.
                </p>
              </div>
            </section>

            {/* SECTION 3 */}
            <section className={sectionClass}>
              
              <div className="mb-6 flex items-center gap-4">
                
                <div
                  className="
                    flex h-14 w-14 items-center justify-center

                    rounded-2xl

                    bg-emerald-500/10

                    text-emerald-400
                  "
                >
                  <span className="material-symbols-outlined text-[26px]">
                    visibility
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black uppercase tracking-[0.15em]">
                    03. Behavioral Privacy
                  </h2>

                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-white/30">
                    Monitoring & Analytics
                  </p>
                </div>
              </div>

              <div className="text-sm leading-relaxed text-slate-600 dark:text-white/60">
                <p>
                  We utilize minimal tracking cookies necessary for system
                  authentication and performance monitoring. Our AI Voice
                  Qualification protocols are recorded for quality assurance within
                  your private workspace latency bounds.
                </p>
              </div>
            </section>

            {/* CONTACT */}
            <section
              className="
                overflow-hidden

                rounded-[28px]

                border
                border-primary/20

                bg-gradient-to-br
                from-primary/10
                via-cyan-500/5
                to-transparent

                p-8
                md:p-10

                backdrop-blur-2xl

                shadow-[0_20px_60px_rgba(0,0,0,0.08)]
              "
            >
              <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                
                <div>
                  <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-5 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />

                    <span className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                      System Contact
                    </span>
                  </div>

                  <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    Security & Data Requests
                  </h3>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-white/50">
                    For security inquiries, infrastructure concerns, or data
                    deletion requests, contact the system administration channel.
                  </p>
                </div>

                <div
                  className="
                    rounded-2xl

                    border
                    border-white/10

                    bg-white/40
                    dark:bg-white/[0.04]

                    px-6
                    py-5

                    backdrop-blur-xl
                  "
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 dark:text-white/30">
                    Security Email
                  </p>

                  <p className="mt-3 text-sm font-semibold text-primary">
                    security@oneemployee.infra
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <footer className="mt-20 text-center">
            
            <div
              className="
                inline-flex
                items-center
                gap-3

                rounded-full

                border
                border-slate-200/60
                dark:border-white/10

                bg-white/40
                dark:bg-white/[0.03]

                px-5
                py-3

                backdrop-blur-xl
              "
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 dark:text-white/30">
                Secure Doc Hash: 0x82F...E21
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;