import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cardClass =
    'rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.45)]';

  const sectionClass =
    'rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/30 dark:bg-white/[0.03] backdrop-blur-xl p-6 md:p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-xl';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#07080c] dark:text-white">
      {/* Landing Background */}
      <div
        className="pointer-events-none fixed inset-0 landing-gradient-mesh opacity-90 dark:opacity-100"
        aria-hidden
      />

      <div
        className="pointer-events-none fixed inset-0 landing-grid-bg opacity-40 dark:opacity-30"
        aria-hidden
      />

      {/* Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-120px] left-[-120px] h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute bottom-[-150px] right-[-120px] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* NAVBAR */}
      <nav
        className="
          sticky top-0 z-50
          border-b border-slate-200/50 dark:border-white/10
          bg-white/50 dark:bg-[#020617]/50
          backdrop-blur-2xl
        "
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
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
                Legal & Compliance
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="
              flex items-center gap-2
              rounded-2xl
              border border-slate-200 dark:border-white/10
              bg-white/50 dark:bg-white/[0.03]
              px-4 py-3
              text-[10px]
              font-black
              uppercase
              tracking-[0.25em]
              text-slate-700 dark:text-white/70
              backdrop-blur-xl
              transition-all
              hover:scale-[1.02]
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
          <div className={`${cardClass} p-8 md:p-12`}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />

              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Legal Protocol // 102
              </span>
            </div>

            <div className="grid gap-10 lg:grid-cols-[1fr_280px] lg:items-end">
              <div>
                <h1
                  className="
                    text-5xl
                    font-black
                    uppercase
                    leading-[0.9]
                    tracking-[-0.06em]
                    text-slate-900
                    dark:text-white
                    md:text-7xl
                  "
                >
                  Terms Of
                  <br />
                  Service
                </h1>

                <p
                  className="
                    mt-6
                    max-w-2xl
                    text-sm
                    leading-relaxed
                    text-slate-600
                    dark:text-white/50
                  "
                >
                  Operational policies, infrastructure usage standards, and
                  platform compliance protocols governing the OneEmployee
                  ecosystem.
                </p>
              </div>

              <div
                className="
                  rounded-3xl
                  border border-white/10
                  bg-gradient-to-br
                  from-primary/20
                  to-cyan-500/10
                  p-6
                  backdrop-blur-xl
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-12 w-12 items-center justify-center
                      rounded-2xl
                      bg-primary/20
                      text-primary
                    "
                  >
                    <span className="material-symbols-outlined">
                      gavel
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      Last Updated
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      March 2026
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/30">
                    Version
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    1.0.4
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-20 md:px-8">
        <div className="space-y-8">
          {/* SECTION 1 */}
          <section className={sectionClass}>
            <div className="mb-6 flex items-center gap-4">
              <div
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-2xl
                  bg-primary/10
                  text-primary
                "
              >
                <span className="material-symbols-outlined">
                  handshake
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.15em]">
                  01. Acceptance of Terms
                </h2>

                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-white/30">
                  Service Agreement Protocol
                </p>
              </div>
            </div>

            <div className="space-y-5 text-sm leading-relaxed text-slate-600 dark:text-white/60">
              <p>
                By initializing the OneEmployee® System, you agree to bound by
                these industrial-grade service terms. Our platform provides
                high-volume lead filtration infrastructure. You acknowledge that
                unauthorized tampering with core filtration logic is strictly
                prohibited.
              </p>
            </div>
          </section>

          {/* SECTION 2 */}
          <section className={sectionClass}>
            <div className="mb-6 flex items-center gap-4">
              <div
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-2xl
                  bg-cyan-500/10
                  text-cyan-400
                "
              >
                <span className="material-symbols-outlined">
                  verified_user
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.15em]">
                  02. Operational Integrity
                </h2>

                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-white/30">
                  Access & Security Standards
                </p>
              </div>
            </div>

            <div className="text-sm leading-relaxed text-slate-600 dark:text-white/60">
              <p>
                Users are responsible for maintaining the security of their
                access tokens and system credentials. Abuse of the AI Voice
                Qualification engine or WhatsApp routing protocols to spam or
                harass individuals outside of your specified lead corpus is a
                violation of these terms.
              </p>
            </div>
          </section>

          {/* SECTION 3 */}
          <section className={sectionClass}>
            <div className="mb-6 flex items-center gap-4">
              <div
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-2xl
                  bg-emerald-500/10
                  text-emerald-400
                "
              >
                <span className="material-symbols-outlined">
                  dns
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.15em]">
                  03. Infrastructure Availability
                </h2>

                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-white/30">
                  Uptime & Maintenance
                </p>
              </div>
            </div>

            <div className="text-sm leading-relaxed text-slate-600 dark:text-white/60">
              <p>
                While we strive for a 99.9% uptime for the lead ingestion
                engine, system maintenance windows are scheduled during
                low-latency periods. Our liability is limited to the system
                credits allocated for the current billing cycle.
              </p>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className={sectionClass}>
            <div className="mb-6 flex items-center gap-4">
              <div
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-2xl
                  bg-violet-500/10
                  text-violet-400
                "
              >
                <span className="material-symbols-outlined">
                  public
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.15em]">
                  04. Data Sovereignty
                </h2>

                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-white/30">
                  Ownership & Data Rights
                </p>
              </div>
            </div>

            <div className="text-sm leading-relaxed text-slate-600 dark:text-white/60">
              <p>
                Data ingested via 3rd party integrations (Facebook, Google)
                remains the property of the tenant. However, OneEmployee®
                retains rights to utilize anonymized behavioral patterns to
                optimize global filtration algorithms.
              </p>
            </div>
          </section>

          {/* LEGAL CONTACT */}
          <section
            className="
              rounded-3xl
              border border-primary/20
              bg-gradient-to-br
              from-primary/10
              via-cyan-500/5
              to-transparent
              p-8
              backdrop-blur-2xl
            "
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />

                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                    Legal Compliance
                  </span>
                </div>

                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Legal & Compliance Requests
                </h3>

                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-white/50">
                  For legal inquiries regarding the Lead Filtration Engine,
                  licensing terms, or compliance documentation, contact the
                  infrastructure legal channel.
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border border-white/10
                  bg-white/40 dark:bg-white/[0.04]
                  px-6 py-5
                  backdrop-blur-xl
                "
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/30">
                  Legal Email
                </p>

                <p className="mt-2 text-sm font-semibold text-primary">
                  legal@oneemployee.infra
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
              border border-slate-200/60
              dark:border-white/10
              bg-white/40
              dark:bg-white/[0.03]
              px-5
              py-3
              backdrop-blur-xl
            "
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/30">
              SYSTEM_TERM_REF: TOS_03_2026
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default TermsOfServicePage;