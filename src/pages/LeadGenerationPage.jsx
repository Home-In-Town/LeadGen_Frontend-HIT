/**
 * LeadGenerationPage — Lead Detail Page (Production CRM)
 *
 * Features:
 * - Overview tab with Lead Info + AI Intelligence + Recent Activity
 * - Quick actions (Call, WhatsApp, Email, Note)
 * - Edit/Delete lead actions
 * - Real-time socket updates for WA, Voice, Analytics
 * - Tabs: Overview, Activity, Calls, WhatsApp
 * - Delete confirmation modal
 * - Phase 1 branding
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import WhatsAppSection from '../components/lead/WhatsAppSection';
import VoiceCallSection from '../components/lead/VoiceCallSection';
import LinkActivitySection from '../components/lead/LinkActivitySection';
import CallHistorySection from '../components/CallHistorySection';
import { getChatMessages } from '../api';
import { BRAND_COLOR } from '../config/phase';

// ─── Status colors ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  HOT: 'bg-red-100 text-red-700 border-red-200',
  WARM: 'bg-orange-100 text-orange-700 border-orange-200',
  COLD: 'bg-blue-100 text-blue-700 border-blue-200',
  CREATED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CONTACTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  INTERESTED: 'bg-amber-100 text-amber-700 border-amber-200',
  CONVERTED: 'bg-green-100 text-green-700 border-green-200',
  LOST: 'bg-gray-100 text-gray-600 border-gray-200',
};

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'dashboard' },
  { key: 'activity', label: 'Activity', icon: 'timeline' },
  { key: 'calls', label: 'Calls', icon: 'call' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
];

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-bold rounded-lg text-white bg-red-500 hover:bg-red-600">Delete Lead</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const LeadGenerationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, addToast } = useNotifications();
  const { user } = useAuth();

  const [leadData, setLeadData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateType, setLastUpdateType] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteModal, setDeleteModal] = useState(false);
  const [automationHistory, setAutomationHistory] = useState([]);

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!id) return;
    try {
      setIsRefreshing(true);
      const res = await api.getSummary(id);
      setLeadData(res.data);
    } catch (err) {
      console.error(err);
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

  const fetchWhatsAppMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getChatMessages(id);
      setChatMessages(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch WhatsApp messages:', err);
    }
  }, [id]);

  const fetchAutomationHistory = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.getLeadAutomationHistory(id);
      setAutomationHistory(Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.events || []));
    } catch { setAutomationHistory([]); }
  }, [id]);

  // ── Socket Setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    refreshData();
    fetchWhatsAppMessages();
    fetchAutomationHistory();

    if (!socket) return;

    const setupLive = () => { setIsConnected(true); socket.emit('join_lead', id); };
    if (socket.connected) setupLive();
    socket.on('connect', setupLive);
    socket.on('disconnect', () => setIsConnected(false));

    const handleUpdate = (data, type) => {
      setLeadData(prev => {
        if (!prev) return prev;
        const merged = { ...prev };
        for (const key of Object.keys(data)) {
          if (key === 'leadId' || key === 'eventType') continue;
          if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]) && prev[key] && typeof prev[key] === 'object') {
            merged[key] = { ...prev[key], ...data[key] };
          } else {
            merged[key] = data[key];
          }
        }
        return merged;
      });
      setLastUpdateType(type);
      setTimeout(() => setLastUpdateType(prev => prev === type ? null : prev), 6000);
    };

    const handleWhatsapp = async (data) => { handleUpdate(data, 'whatsapp'); await fetchWhatsAppMessages(); };
    const handleCall = (data) => handleUpdate(data, 'call');
    const handleLink = (data) => { if (!data.automationId) handleUpdate(data, 'analytics'); };

    socket.on('whatsapp_update', handleWhatsapp);
    socket.on('call_update', handleCall);
    socket.on('link_update', handleLink);

    return () => {
      socket.emit('leave_lead', id);
      socket.off('connect', setupLive);
      socket.off('whatsapp_update', handleWhatsapp);
      socket.off('call_update', handleCall);
      socket.off('link_update', handleLink);
    };
  }, [id, socket, refreshData, fetchWhatsAppMessages, fetchAutomationHistory]);

  // ── Delete Lead ───────────────────────────────────────────────────────────
  const handleDeleteLead = async () => {
    try {
      await api.deleteLead(id);
      addToast('Lead deleted successfully', 'success');
      navigate('/crm');
    } catch {
      addToast('Failed to delete lead', 'error');
    }
    setDeleteModal(false);
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (!leadData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ '--brand': BRAND_COLOR }} />
          <p className="text-xs font-bold text-slate-500">Loading Lead Data...</p>
        </div>
      </div>
    );
  }

  const name = `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim();
  const status = leadData.status?.toUpperCase() || 'CREATED';
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.CREATED;
  const score = leadData.score || 0;

  const getScoreLabel = (s) => { if (s >= 71) return 'High'; if (s >= 31) return 'Medium'; return 'Low'; };
  const getInterest = () => leadData.aiCallResult?.interest || leadData.interest || getScoreLabel(score);
  const getBudget = () => leadData.aiCallResult?.budget || leadData.budget || getScoreLabel(score);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] p-4 sm:p-6 lg:p-8 pb-24">
      {/* Back + Lead Name Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/crm')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Leads
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          {isConnected && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          )}
          <button onClick={() => navigate(`/chat/whatsapp/${id}`)} className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
            Edit Lead
          </button>
          <button onClick={() => setDeleteModal(true)} className="px-3 py-2 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20">
            Delete Lead
          </button>
        </div>
      </div>

      {/* Lead Name + Status + Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: BRAND_COLOR }}>
            {(leadData.first_name?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{name}</h1>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${statusColor}`}>{status}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">call</span>{leadData.phone_number}</span>
              {leadData.source && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">language</span>{leadData.source}</span>}
            </div>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button onClick={refreshCallStatus} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <span className="material-symbols-outlined text-[16px]">call</span> Call
          </button>
          <button onClick={() => navigate(`/chat/whatsapp/${id}`)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="material-symbols-outlined text-[16px]">chat</span> WhatsApp
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <span className="material-symbols-outlined text-[16px]">mail</span> Email
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[var(--brand)] text-[var(--brand)]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            style={{ '--brand': BRAND_COLOR }}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Information */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Lead Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Company Name', value: name },
                { label: 'Contact Name', value: name },
                { label: 'Phone', value: leadData.phone_number },
                { label: 'Email', value: leadData.email || '—' },
                { label: 'Source', value: leadData.source || 'manual' },
                { label: 'Status', value: status },
                { label: 'City', value: leadData.city || '—' },
                { label: 'Added On', value: formatDate(leadData.createdAt) },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white text-right max-w-[60%] truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Lead Intelligence */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">AI Lead Intelligence</h3>
            {/* Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">AI Confidence Score</span>
                <span className="text-2xl font-black" style={{ color: BRAND_COLOR }}>{score}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: BRAND_COLOR }} />
              </div>
            </div>
            {/* Metrics */}
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-xs text-slate-500">Lead Quality</span><span className="text-xs font-bold text-slate-900 dark:text-white">{getScoreLabel(score)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-500">Interest Level</span><span className="text-xs font-bold text-slate-900 dark:text-white">{getInterest()}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-500">Budget Range</span><span className="text-xs font-bold text-slate-900 dark:text-white">{getBudget()}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-500">Sentiment</span><span className="text-xs font-bold text-slate-900 dark:text-white">{leadData.aiCallResult?.sentiment || '—'}</span></div>
            </div>
            {/* AI Insight */}
            {leadData.statusReason && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">AI Insight</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{leadData.statusReason}</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {/* Voice Call */}
              {leadData.voiceCallData?.status && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-blue-600">call</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Voice Call</p>
                    <p className="text-[11px] text-slate-500 capitalize">{leadData.voiceCallData.status}</p>
                    {leadData.voiceCallData.startTime && <p className="text-[10px] text-slate-400">{formatDate(leadData.voiceCallData.startTime)}</p>}
                  </div>
                </div>
              )}
              {/* WhatsApp */}
              {leadData.whatsappData?.status && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">chat</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">WhatsApp Message</p>
                    <p className="text-[11px] text-slate-500 capitalize">{leadData.whatsappData.status}</p>
                    {leadData.whatsappData.sentAt && <p className="text-[10px] text-slate-400">{formatDate(leadData.whatsappData.sentAt)}</p>}
                  </div>
                </div>
              )}
              {/* Link Activity */}
              {leadData.linkActivity?.opened && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-purple-600">link</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Link Opened</p>
                    <p className="text-[11px] text-slate-500">{leadData.linkActivity.visitCount || 1} visit(s), {leadData.linkActivity.timeSpentSeconds || 0}s spent</p>
                    {leadData.linkActivity.clickedAt && <p className="text-[10px] text-slate-400">{formatDate(leadData.linkActivity.clickedAt)}</p>}
                  </div>
                </div>
              )}
              {/* Automation History */}
              {automationHistory.slice(0, 3).map((evt, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-slate-500">bolt</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">{evt.type || evt.channel || 'Automation'}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{evt.status || 'completed'}</p>
                    {evt.scheduledAt && <p className="text-[10px] text-slate-400">{formatDate(evt.scheduledAt)}</p>}
                  </div>
                </div>
              ))}
              {!leadData.voiceCallData?.status && !leadData.whatsappData?.status && automationHistory.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No activity yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <LinkActivitySection leadData={leadData} isHighlighted={lastUpdateType === 'analytics'} />
        </div>
      )}

      {activeTab === 'calls' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <VoiceCallSection leadData={leadData} isHighlighted={lastUpdateType === 'call'} onRefresh={refreshCallStatus} isRefreshing={isRefreshing} />
          </div>
          <CallHistorySection leadId={id} />
        </div>
      )}

      {activeTab === 'whatsapp' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <WhatsAppSection leadData={leadData} chatMessages={chatMessages} isHighlighted={lastUpdateType === 'whatsapp'} />
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        open={deleteModal}
        title="Delete Lead?"
        message="This action will permanently remove this lead and its associated records. This cannot be undone."
        onConfirm={handleDeleteLead}
        onCancel={() => setDeleteModal(false)}
      />
    </div>
  );
};

export default LeadGenerationPage;
