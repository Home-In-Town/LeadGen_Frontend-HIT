import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage = () => {
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
          <div className="font-mono text-[10px] text-primary mb-2 uppercase tracking-[0.2em]">Security Protocol // 001</div>
          <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-tighter text-charcoal">
            Privacy<br />Policy
          </h1>
          <p className="mt-4 text-[10px] font-bold text-charcoal/30 uppercase tracking-widest">
            Last Updated: March 2026 // Version 1.0.4
          </p>
        </header>

        {/* Content Sections */}
        <div className="space-y-12">
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal mb-4 flex items-center gap-2">
              <span className="text-primary">01.</span> Data Ingestion
            </h2>
            <div className="text-xs leading-relaxed text-charcoal/60 uppercase tracking-wide space-y-4">
              <p>
                Our lead filtration systems ingest data provided via integrated channels (Facebook Lead Ads, Google Ads). 
                This data is processed through our proprietary qualification protocols to determine lead viability.
              </p>
              <p>
                We do not sell your data. We process it solely for the purpose of high-volume filtration and routing 
                as specified by your organization's configuration.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal mb-4 flex items-center gap-2">
              <span className="text-primary">02.</span> Encryption Standards
            </h2>
            <div className="text-xs leading-relaxed text-charcoal/60 uppercase tracking-wide">
              <p>
                All data in transit is protected via military-grade TLS 1.3 encryption. Lead information stored in our 
                infrastructure corpus is encrypted at rest using AES-256 protocols.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal mb-4 flex items-center gap-2">
              <span className="text-primary">03.</span> Behavioral Privacy
            </h2>
            <div className="text-xs leading-relaxed text-charcoal/60 uppercase tracking-wide">
              <p>
                We utilize minimal tracking cookies necessary for system authentication and performance monitoring. 
                Our AI Voice Qualification protocols are recorded for quality assurance within your private workspace 
                latency bounds.
              </p>
            </div>
          </section>

          <section className="bg-charcoal/5 p-6 border border-charcoal/10">
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal mb-4">
              System Contact
            </h2>
            <p className="text-[10px] font-mono text-charcoal/60 uppercase">
              For security inquiries or data removal requests:<br />
              <span className="text-primary mt-2 block">security@oneemployee.infra</span>
            </p>
          </section>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-20 border-t border-charcoal/5 pt-10 text-center">
        <div className="font-mono text-[9px] text-charcoal/20">
          SECURE_DOC_HASH: 0x82F...E21
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
