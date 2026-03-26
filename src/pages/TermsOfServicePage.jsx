import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="animate-fade-in bg-background-light min-h-screen font-display text-charcoal pb-20">
      {/* Header / Navigation bar for deep pages */}
      <nav className="p-6 border-b border-charcoal/10 bg-white flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-primary text-xs font-black uppercase tracking-widest">OneEmployee®</span>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 hover:text-primary transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Return to Base
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-16">
        {/* Title Section */}
        <header className="mb-16 border-l-4 border-primary pl-6">
          <div className="font-mono text-[10px] text-primary mb-2 uppercase tracking-[0.2em]">Legal Protocol // 102</div>
          <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-tighter text-charcoal">
            Terms of<br />Service
          </h1>
          <p className="mt-4 text-[10px] font-bold text-charcoal/30 uppercase tracking-widest">
            Last Updated: March 2026 // Version 1.0.4
          </p>
        </header>

        {/* Content Sections */}
        <div className="space-y-12">
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal mb-4 flex items-center gap-2">
              <span className="text-primary">01.</span> Acceptance of Terms
            </h2>
            <div className="text-xs leading-relaxed text-charcoal/60 uppercase tracking-wide space-y-4">
              <p>
                By initializing the OneEmployee® System, you agree to bound by these industrial-grade service terms. 
                Our platform provides high-volume lead filtration infrastructure. You acknowledge that unauthorized 
                tampering with core filtration logic is strictly prohibited.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal mb-4 flex items-center gap-2">
              <span className="text-primary">02.</span> Operational Integrity
            </h2>
            <div className="text-xs leading-relaxed text-charcoal/60 uppercase tracking-wide">
              <p>
                Users are responsible for maintaining the security of their access tokens and system credentials. 
                Abuse of the AI Voice Qualification engine or WhatsApp routing protocols to spam or harass individuals 
                outside of your specified lead corpus is a violation of these terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal mb-4 flex items-center gap-2">
              <span className="text-primary">03.</span> Infrastructure Availability
            </h2>
            <div className="text-xs leading-relaxed text-charcoal/60 uppercase tracking-wide">
              <p>
                While we strive for a 99.9% uptime for the lead ingestion engine, system maintenance windows 
                are scheduled during low-latency periods. Our liability is limited to the system credits 
                allocated for the current billing cycle.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal mb-4 flex items-center gap-2">
              <span className="text-primary">04.</span> Data Sovereignty
            </h2>
            <div className="text-xs leading-relaxed text-charcoal/60 uppercase tracking-wide">
              <p>
                Data ingested via 3rd party integrations (Facebook, Google) remains the property of the tenant. 
                However, OneEmployee® retains rights to utilize anonymized behavioral patterns to optimize 
                global filtration algorithms.
              </p>
            </div>
          </section>

          <section className="bg-charcoal/5 p-6 border border-charcoal/10">
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal mb-4">
              Legal Compliance
            </h2>
            <p className="text-[10px] font-mono text-charcoal/60 uppercase">
              For legal inquiries regarding the Lead Filtration Engine:<br />
              <span className="text-primary mt-2 block">legal@oneemployee.infra</span>
            </p>
          </section>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-20 border-t border-charcoal/5 pt-10 text-center">
        <div className="font-mono text-[9px] text-charcoal/20">
          SYSTEM_TERM_REF: TOS_03_2026
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServicePage;
