import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../api";

const LeadGenerationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leadData, setLeadData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) setCurrentUser(JSON.parse(userStr));
    
    if (id) {
      refreshData();
    }
  }, [id]);

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.getSummary(id);
      setLeadData(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load lead data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshCallStatus = async () => {
    try {
      setIsRefreshing(true);
      await api.getCallStatus(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to refresh call status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!leadData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-black uppercase tracking-widest text-charcoal/40 text-xs">Loading lead data...</p>
        </div>
      </div>
    );
  }

  const formatTime = (val) => {
    const seconds = parseFloat(val);
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1).replace(/\.0$/, '')}h`;
  };

  return (
    <div className="animate-fade-in font-display text-charcoal pb-20">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-charcoal text-[10px] font-black uppercase tracking-widest hover:bg-charcoal hover:text-white transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm font-black">arrow_back</span>
          History
        </button>
        <div className="text-left sm:text-right">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/30">Lead Reference ID</p>
          <p className="font-mono font-bold text-[10px] text-charcoal truncate max-w-[200px]">{id}</p>
        </div>
      </div>

      {/* Main Status Header */}
      <div className="bg-white border-2 border-charcoal p-4 sm:p-6 mb-8 sm:mb-10 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-charcoal/30 mb-1">Lead Identity</h3>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none mb-1">
              {leadData.first_name} {leadData.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 font-mono font-bold text-charcoal/40 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm sm:text-lg">call</span>
                {leadData.phone_number}
              </div>
              {currentUser?.role === 'admin' && leadData.createdBy?.name && (
                <div className="flex items-center gap-2 bg-primary/5 text-primary px-2 py-0.5 border border-primary/10 rounded-sm">
                  <span className="material-symbols-outlined text-[14px]">source</span>
                  SOURCE: {leadData.createdBy.name}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
            <div className={`px-4 py-1.5 border-2 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs
              ${leadData.status === 'HOT' ? 'bg-red-50 text-red-600 border-red-200' : 
                leadData.status === 'WARM' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                leadData.status === 'COLD' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
              {leadData.status || 'NEW'}
            </div>
            <div className="bg-surface-subtle border border-charcoal/5 p-3 w-full md:max-w-xs">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-tight text-charcoal leading-snug italic">
                "{leadData.statusReason || "Processing interaction data..."}"
              </p>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mt-6 pt-6 border-t border-charcoal/5">
          <div className="flex justify-between items-end mb-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-charcoal/30">AI Confidence Score</p>
            <p className="text-lg font-black text-primary">{leadData.score || 0}<span className="text-[9px] text-charcoal/20">/100</span></p>
          </div>
          <div className="h-3 bg-surface-subtle border border-charcoal/5 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${leadData.score || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Channel Grid */}
      <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined font-black">insights</span>
        Qualification Channels
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WhatsApp Channel */}
        <div className="bg-white border-2 border-charcoal p-6 transition-all group hover:border-primary">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">chat</span>
              WhatsApp
            </h3>
            {leadData.whatsappResult ? (
              <span className="text-[10px] font-black uppercase bg-charcoal text-white px-2 py-1 tracking-widest">
                {leadData.whatsappResult}
              </span>
            ) : leadData.whatsappData?.status === 'sent' ? (
              <span className="text-[10px] font-black uppercase bg-primary text-white px-2 py-1 tracking-widest">SENT</span>
            ) : (
              <span className="text-[10px] font-black uppercase bg-surface-subtle text-charcoal/30 px-2 py-1 tracking-widest border border-charcoal/5">PENDING</span>
            )}
          </div>
          
          <div className="space-y-4">
            {leadData.whatsappResult === "YES" && <p className="text-sm font-bold text-emerald-600">✅ Lead expressed interest.</p>}
            {leadData.whatsappResult === "NO" && <p className="text-sm font-bold text-red-600">❌ Lead rejected or opted out.</p>}
            {leadData.whatsappData?.status === 'sent' && !leadData.whatsappResult && <p className="text-sm text-charcoal/60">Waiting for reply to template...</p>}
            {leadData.whatsappData?.error && <p className="text-xs text-red-500 italic">Error: {leadData.whatsappData.error}</p>}
            
            <div className="pt-4 border-t border-charcoal/5 space-y-2">
               {leadData.whatsappData?.messageSid && (
                  <p className="font-mono text-[9px] uppercase text-charcoal/30">ID: {leadData.whatsappData.messageSid.slice(0, 16)}...</p>
               )}
               {leadData.whatsappData?.sentAt && (
                   <p className="font-mono text-[9px] uppercase text-charcoal/30">Sent: {new Date(leadData.whatsappData.sentAt).toLocaleString()}</p>
               )}
            </div>
          </div>
        </div>

        {/* AI Voice Channel */}
        <div className="bg-white border-2 border-charcoal p-6 transition-all group hover:border-primary">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">record_voice_over</span>
              AI Agent
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-charcoal text-white px-2 py-1 tracking-widest truncate max-w-[80px]">
                {leadData.voiceCallData?.status || 'INIT'}
              </span>
              <button 
                onClick={refreshCallStatus}
                disabled={isRefreshing}
                className="p-1 hover:bg-surface-subtle cursor-pointer transition-colors"
                title="Refresh Call"
              >
                <span className={`material-symbols-outlined text-sm font-black ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {leadData.aiCallResult ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-surface-subtle border border-charcoal/5">
                  <p className="text-[8px] font-black uppercase text-charcoal/30">Interest</p>
                  <p className="text-[10px] font-bold uppercase">{leadData.aiCallResult.interest || 'N/A'}</p>
                </div>
                <div className="p-2 bg-surface-subtle border border-charcoal/5">
                  <p className="text-[8px] font-black uppercase text-charcoal/30">Budget</p>
                  <p className="text-[10px] font-bold uppercase">{leadData.aiCallResult.budget || 'N/A'}</p>
                </div>
              </div>
            ) : <p className="text-sm text-charcoal/60">Gathering conversation data...</p>}

            {leadData.voiceCallData?.recordingLink && (
              <a 
                href={leadData.voiceCallData.recordingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-charcoal transition-colors group"
              >
                <span className="material-symbols-outlined text-sm font-black">play_circle</span>
                Listen Recording
              </a>
            )}

            {leadData.voiceCallData?.transcript && (
              <details className="cursor-pointer group">
                <summary className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 hover:text-charcoal list-none flex items-center gap-2">
                   <span className="material-symbols-outlined text-sm font-black transition-transform group-open:rotate-180">expand_more</span>
                   Full Transcript
                </summary>
                <p className="pt-2 text-[11px] leading-relaxed text-charcoal/60 italic border-l-2 border-charcoal/5 pl-3 mt-1 uppercase">
                  {leadData.voiceCallData.transcript}
                </p>
              </details>
            )}
          </div>
        </div>

        {/* Link Activity Channel */}
        <div className="bg-white border-2 border-charcoal p-6 transition-all group hover:border-primary">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-charcoal/40 group-hover:text-primary">link</span>
              Portfolio
            </h3>
            <span className={`text-[10px] font-black uppercase px-2 py-1 tracking-widest
              ${leadData.linkActivity?.opened ? 'bg-primary text-white' : 'bg-surface-subtle text-charcoal/30'}`}>
              {leadData.linkActivity?.opened ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
              <span>Opened Link</span>
              <span className={leadData.linkActivity?.opened ? 'text-emerald-500' : 'text-charcoal/20'}>
                {leadData.linkActivity?.opened ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight">
              <span>Form Submitted</span>
              <span className={leadData.linkActivity?.submittedForm ? 'text-emerald-500' : 'text-charcoal/20'}>
                {leadData.linkActivity?.submittedForm ? 'YES' : 'NO'}
              </span>
            </div>
            {leadData.linkActivity?.timeSpentSeconds > 0 && (
              <div className="pt-4 border-t border-charcoal/5 flex justify-between items-end">
                <p className="text-[8px] font-black uppercase text-charcoal/30">Total Duration</p>
                <p className="font-mono text-lg font-black">{formatTime(leadData.linkActivity.timeSpentSeconds)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-20 pt-10 border-t-2 border-charcoal/5 text-center">
         <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-charcoal/20">
           Confidential Qualification System // Access Protocol: {leadData.createdBy?.role || 'SYSTEM'}
         </p>
      </div>
    </div>
  );
};

export default LeadGenerationPage;
