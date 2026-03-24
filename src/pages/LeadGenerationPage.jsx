import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import * as api from "../api";
import WhatsAppSection from "../components/lead/WhatsAppSection";
import VoiceCallSection from "../components/lead/VoiceCallSection";
import LinkActivitySection from "../components/lead/LinkActivitySection";

const LeadGenerationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useNotifications();
  const [leadData, setLeadData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLiveBadge, setShowLiveBadge] = useState(false);
  const [lastUpdateType, setLastUpdateType] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const refreshData = useCallback(async () => {
    if (!id) return;
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
  }, [id]);

  const refreshCallStatus = useCallback(async () => {
    if (!id) return;
    try {
      setIsRefreshing(true);
      await api.getCallStatus(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to refresh call status:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [id, refreshData]);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) setCurrentUser(JSON.parse(userStr));
    
    if (id) {
      refreshData();

      if (!socket) return;

      const setupLiveConnection = () => {
        console.log('🔌 Connected to real-time server (lead channel)');
        setIsConnected(true);
        socket.emit('join_lead', id);
      };

      if (socket.connected) {
        setupLiveConnection();
      }
      
      socket.on('connect', setupLiveConnection);

      const handleDisconnect = () => {
        console.log('❌ Disconnected from real-time server (lead channel)');
        setIsConnected(false);
      };
      socket.on('disconnect', handleDisconnect);

      const handleUpdate = (data, type) => {
        console.log(`📡 Received ${type} update:`, data);
        setLeadData(prev => ({ ...prev, ...data }));
        setLastUpdateType(type);
        setShowLiveBadge(true);
        setTimeout(() => setShowLiveBadge(false), 3000);
        setTimeout(() => setLastUpdateType(prev => prev === type ? null : prev), 5000);
      };

      const handleWhatsapp = (data) => handleUpdate(data, 'whatsapp');
      const handleAnalytics = (data) => handleUpdate(data, 'analytics');
      const handleCall = (data) => handleUpdate(data, 'call');

      socket.on('whatsapp_update', handleWhatsapp);
      socket.on('analytics_update', handleAnalytics);
      socket.on('call_update', handleCall);

      return () => { 
        socket.emit('leave_lead', id);
        socket.off('connect', setupLiveConnection);
        socket.off('disconnect', handleDisconnect);
        socket.off('whatsapp_update', handleWhatsapp);
        socket.off('analytics_update', handleAnalytics);
        socket.off('call_update', handleCall);
      };
    }
  }, [id, refreshData, socket]);

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
            <div className="flex items-center gap-4">
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-charcoal/30">Lead Identity</h3>
              {isConnected && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live Connection</span>
                </div>
              )}
            </div>
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

      {/* Live Update Toast */}
      {showLiveBadge && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-charcoal text-white px-4 py-2 border-2 border-primary shadow-[4px_4px_0px_0px_rgba(255,215,0,1)] flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-sm font-black">bolt</span>
            <p className="text-[10px] font-black uppercase tracking-widest">Real-time update received: {lastUpdateType}</p>
          </div>
        </div>
      )}

      {/* Channel Grid — Composed from sub-components */}
      <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined font-black">insights</span>
        Qualification Channels
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WhatsAppSection leadData={leadData} isHighlighted={lastUpdateType === 'whatsapp'} />
        <VoiceCallSection leadData={leadData} isHighlighted={lastUpdateType === 'call'} onRefresh={refreshCallStatus} isRefreshing={isRefreshing} />
        <LinkActivitySection leadData={leadData} isHighlighted={lastUpdateType === 'analytics'} />
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
