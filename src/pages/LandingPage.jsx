import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in bg-background-light min-h-screen font-display text-charcoal">
      <main className="relative">
        {/* Hero Section */}
        <section className="px-6 pt-12 pb-8 border-b border-charcoal/5 debug-grid bg-white">
          <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.05em] uppercase mb-6 text-charcoal">
            Precision<br />Lead<br />Filtration
          </h1>
          <p className="text-charcoal/60 text-sm leading-relaxed max-w-[280px] font-medium uppercase tracking-tight">
            High-volume qualification for builders and agents. Industrial-grade speed.
          </p>
          <div className="mt-8">
            <button 
              onClick={() => navigate('/select-role')}
              className="bg-primary text-white px-8 py-4 font-black uppercase tracking-widest text-sm border-2 border-primary hover:bg-charcoal hover:border-charcoal transition-all cursor-pointer"
            >
              Initialize System
            </button>
          </div>
        </section>

        {/* Metrics Section */}
        <section className="px-6 py-10 bg-surface-subtle border-b border-charcoal/5">
          <div className="border-[1.5px] border-charcoal/10 p-6 bg-white">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">analytics</span>
                <h2 className="text-sm font-black uppercase tracking-widest text-charcoal">Real-time Impact Metrics</h2>
              </div>
              <div className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-1 border border-primary/20">
                LIVE_FEED_01
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-charcoal/10 border border-charcoal/10">
              <div className="bg-white p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 mb-2">Leads Qualified Today</p>
                <p className="font-mono text-3xl font-bold tracking-tighter text-charcoal">12,842</p>
                <div className="mt-2 flex items-center gap-1 text-[8px] font-mono text-primary">
                  <span className="material-symbols-outlined text-[10px]">trending_up</span>
                  +12.4% VS AVG
                </div>
              </div>
              <div className="bg-white p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 mb-2">Accuracy Rate</p>
                <p className="font-mono text-3xl font-bold tracking-tighter text-charcoal">99.2<span className="text-sm ml-0.5">%</span></p>
                <div className="mt-2 flex items-center gap-1 text-[8px] font-mono text-charcoal/40">
                  CONFIDENCE: HIGH
                </div>
              </div>
              <div className="bg-white p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 mb-2">Avg. Time to Qualify</p>
                <p className="font-mono text-3xl font-bold tracking-tighter text-charcoal">42<span className="text-sm ml-0.5">s</span></p>
                <div className="mt-2 flex items-center gap-1 text-[8px] font-mono text-charcoal/40">
                  LATENCY: 12ms
                </div>
              </div>
              <div className="bg-white p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 mb-2">System Load</p>
                <p className="font-mono text-3xl font-bold tracking-tighter text-charcoal">14<span className="text-sm ml-0.5">%</span></p>
                <div className="mt-2 flex items-center gap-1 text-[8px] font-mono text-primary">
                  OPTIMAL_FLOW
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white">
          <div className="grid grid-cols-1 border-b border-charcoal/10">
            <div className="p-6 border-b border-charcoal/10 bg-white">
              <div className="flex justify-between items-start mb-8">
                <span className="text-[10px] font-black text-charcoal/20">01 // AUTOMATION</span>
                <span className="material-symbols-outlined text-primary">record_voice_over</span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-charcoal">Voice AI Qualification</h3>
              <p className="text-charcoal/60 text-xs leading-relaxed uppercase tracking-wide">
                Automated human-grade outreach protocols. Filters 1,000+ leads per hour with 98% accuracy.
              </p>
            </div>
            <div className="p-6 border-b border-charcoal/10 bg-white">
              <div className="flex justify-between items-start mb-8">
                <span className="text-[10px] font-black text-charcoal/20">02 // PROTOCOLS</span>
                <span className="material-symbols-outlined text-primary">chat</span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-charcoal">WhatsApp Alerts</h3>
              <p className="text-charcoal/60 text-xs leading-relaxed uppercase tracking-wide">
                Instant lead routing via secure end-to-end encrypted protocols. Real-time push notification delivery.
              </p>
            </div>
            <div className="p-6 border-b border-charcoal/10 bg-white">
              <div className="flex justify-between items-start mb-8">
                <span className="text-[10px] font-black text-charcoal/20">03 // INTEGRATION</span>
                <span className="material-symbols-outlined text-primary">sync_alt</span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-charcoal">2-Way Sales Sync</h3>
              <p className="text-charcoal/60 text-xs leading-relaxed uppercase tracking-wide">
                Direct CRM integration via REST API. Bidirectional data flow for legacy stack compatibility.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="p-6 bg-surface-subtle text-charcoal">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b border-charcoal/10 pb-6">
              <span className="text-primary text-xs font-black uppercase tracking-widest">OneEmployee®</span>
              <span className="text-charcoal/20 text-[10px] font-bold">2024 INFRASTRUCTURE CORP</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ul className="text-[10px] font-black uppercase tracking-widest space-y-2">
                <li className="text-charcoal/40">Documentation</li>
                <li className="text-charcoal/40">API Status</li>
                <li className="text-charcoal/40">Security Protocols</li>
              </ul>
              <ul className="text-[10px] font-black uppercase tracking-widest space-y-2 text-right">
                <li><button onClick={() => navigate('/privacy')} className="text-charcoal/60 hover:text-charcoal cursor-pointer transition-colors uppercase">Privacy</button></li>
                <li><button className="text-charcoal/60 hover:text-charcoal cursor-pointer transition-colors uppercase">Legal</button></li>
                <li><button className="text-charcoal/60 hover:text-charcoal cursor-pointer transition-colors uppercase">SLA</button></li>
              </ul>
            </div>
            <div className="pt-4 flex justify-between items-center font-mono text-[9px] text-charcoal/30">
              <span>BUILD: V1.0.4-L_MODE</span>
              <span>LATENCY: 4.2ms</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
