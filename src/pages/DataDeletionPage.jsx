import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * DataDeletionPage
 *
 * Meta requires a publicly reachable "Data Deletion Instructions" URL for any app
 * that handles user or business data — it is checked during App Review and before
 * an app can go Live. It must be readable WITHOUT logging in, because the reviewer
 * opens it anonymously.
 *
 * Route: /data-deletion  (also linked from the footer)
 */
const DataDeletionPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sectionClass =
    'rounded-[28px] border border-slate-200/60 dark:border-white/10 bg-white/35 dark:bg-white/[0.03] backdrop-blur-2xl p-6 md:p-8';

  return (
    <div className="animate-fade-in min-h-screen font-display transition-colors duration-300">
      <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#07080c] dark:text-slate-100">

        <div className="pointer-events-none fixed inset-0 landing-gradient-mesh opacity-90 dark:opacity-100" aria-hidden />
        <div className="pointer-events-none fixed inset-0 landing-grid-bg opacity-40 dark:opacity-30" aria-hidden />
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-[-150px] right-[-120px] h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        {/* NAVBAR */}
        <nav className="sticky top-0 z-50 border-b border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-[#050608]/60 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
            <div onClick={() => navigate('/')} className="group flex cursor-pointer items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/25">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">OneEmployee®</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-white/40">Data Deletion</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="rounded-full border border-slate-200 dark:border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-white/60 hover:border-primary/40"
            >
              Back to home
            </button>
          </div>
        </nav>

        <main className="relative mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-16">

          <header className="mb-10">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">Legal</p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
              Data Deletion
              <br />
              Instructions
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-white/50">
              This page explains how to request deletion of data OneEmployee holds about you or
              your business, including anything obtained through Meta platforms (Facebook,
              Instagram and WhatsApp).
            </p>
          </header>

          <div className="space-y-6">

            <section className={sectionClass}>
              <h2 className="text-lg font-black uppercase tracking-[0.15em]">01. What we store</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-white/60">
                <p>Depending on which integrations you connect, we may store:</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Your account details — name, email, phone number, company name.</li>
                  <li>Leads you create or import — name, phone number, email, enquiry details.</li>
                  <li>Conversation history for WhatsApp, Messenger and Instagram Direct, plus
                      comments we replied to on your behalf.</li>
                  <li>Access tokens for the Meta accounts you connect. These are encrypted at rest
                      and are used only to act on your instructions.</li>
                  <li>Page, Instagram and advertising metrics we fetch to build your reports.</li>
                </ul>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-black uppercase tracking-[0.15em]">02. Delete instantly from the app</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-white/60">
                <p>If you have an account, you can remove connected data yourself at any time:</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li><strong>WhatsApp</strong> — WhatsApp Setup → remove a number, or “Clear all
                      credentials”. This deletes the stored tokens for that account.</li>
                  <li><strong>Facebook &amp; Instagram</strong> — Meta Social → Overview →
                      Disconnect. This deletes the stored page and Instagram tokens and cancels any
                      queued automatic replies.</li>
                  <li><strong>Leads</strong> — CRM → select a lead → Delete.</li>
                  <li><strong>Reply history</strong> — Comment Reply → Logs → Clear logs.</li>
                </ul>
                <p>
                  Disconnecting also revokes our access to your Meta assets, so we stop receiving
                  any further data about them.
                </p>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-black uppercase tracking-[0.15em]">03. Request full deletion by email</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-white/60">
                <p>
                  To have everything erased, email us from the address registered on your account:
                </p>
                <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-4">
                  <p className="font-bold text-slate-800 dark:text-white">support@homeintown.in</p>
                  <p className="mt-1 text-[13px]">
                    Subject: <span className="font-semibold">Data deletion request</span>
                  </p>
                  <p className="mt-2 text-[13px]">
                    Please include your account email or registered phone number so we can identify
                    the correct records.
                  </p>
                </div>
                <p>
                  We confirm receipt within <strong>2 working days</strong> and complete deletion
                  within <strong>30 days</strong>. Once deleted, the data cannot be recovered.
                </p>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-black uppercase tracking-[0.15em]">04. What we may have to keep</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-white/60">
                <p>
                  We may retain a limited amount of data where the law requires it — for example
                  invoices and tax records — or where it is needed to resolve a dispute or prevent
                  abuse. Anything retained for these reasons is kept only for as long as required
                  and is not used for messaging or marketing.
                </p>
                <p>
                  Message content held by Meta on WhatsApp, Facebook or Instagram is controlled by
                  Meta. Deleting your data with us does not delete it from Meta’s own systems — for
                  that, use the privacy settings in the relevant Meta product.
                </p>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-black uppercase tracking-[0.15em]">05. Removing the app on Meta</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-white/60">
                <p>You can also revoke access from Meta’s side:</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Facebook → Settings &amp; privacy → Settings → Apps and websites → remove
                      <em> HomeInTown Business Messaging</em>.</li>
                  <li>Business portfolio → Business settings → Apps → remove the app.</li>
                </ul>
                <p>
                  Revoking access immediately invalidates our tokens. Email us as described above if
                  you also want the stored records erased.
                </p>
              </div>
            </section>
          </div>

          <footer className="mt-12 border-t border-slate-200/70 dark:border-white/10 pt-6">
            <p className="text-[13px] text-slate-500 dark:text-white/40">
              See also our{' '}
              <button onClick={() => navigate('/privacy-policy')} className="font-semibold text-primary hover:underline">
                Privacy Policy
              </button>{' '}
              and{' '}
              <button onClick={() => navigate('/terms-service')} className="font-semibold text-primary hover:underline">
                Terms of Service
              </button>
              .
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DataDeletionPage;
