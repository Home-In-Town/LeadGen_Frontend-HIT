import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  getProjectDetails,
  getProjectSettings,
  updateProjectSettings,
  getProjectCampaigns,
  listWATemplates,
  listEmailTemplates,
  getChannelStatus,
  getFBCampaigns,
  generateProjectTemplates,
  listProjectTemplates,
  syncProjectTemplates,
  deleteProjectTemplate,
} from '../api';
import VoicePicker, { LANGUAGE_OPTIONS, SECTOR_OPTIONS } from '../components/VoicePicker';

// Human labels for each need-based template kind (matches backend ProjectTemplate.kind)
const TEMPLATE_KIND_META = {
  voice_guide: { label: 'Voice Guide',      need: 'What is this project?' },
  ecosystem:   { label: 'Area / Ecosystem', need: 'Schools, hospitals nearby?' },
  progress:    { label: 'Site Progress',    need: 'Will builder deliver on time?' },
  tour_3d:     { label: '3D Tour',          need: 'How will it look?' },
  rera:        { label: 'RERA Docs',        need: 'Legal clear? approvals?' },
  emi:         { label: 'EMI Calculator',   need: 'Price is high / affordable?' },
  inventory:   { label: 'Live Inventory',   need: 'Which unit is left?' },
  traffic:     { label: 'Traffic / Commute',need: 'How far from office?' },
};

const TEMPLATE_STATUS_STYLES = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  paused:   'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-300',
  draft:    'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-300',
};

const cardClass = 'rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 shadow-sm';
const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-primary/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnOutline = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50';

const TABS = [
  { id: 'settings', label: 'Automation', icon: 'settings_suggest' },
  { id: 'templates', label: 'WhatsApp Templates', icon: 'chat' },
  { id: 'campaigns', label: 'Linked Sources', icon: 'campaign' },
];

const ProjectSettingsPage = () => {
  const { hitProjectId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useNotifications();

  const [tab, setTab] = useState('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [config, setConfig] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Campaign & FB data
  const [campaigns, setCampaigns] = useState([]);
  const [fbCampaignsLinked, setFbCampaignsLinked] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Template options
  const [waTemplates, setWaTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);

  // Channel connectivity
  const [channelStatus, setChannelStatus] = useState({ voice: true, whatsapp: null, email: null });

  // ── WhatsApp per-project templates (Phase 2 template engine) ────────────────
  const [projTemplates, setProjTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const res = await listProjectTemplates(hitProjectId);
      setProjTemplates(res.data?.templates || []);
    } catch { setProjTemplates([]); }
    finally { setTemplatesLoading(false); }
  }, [hitProjectId]);

  const handleGenerateTemplates = async () => {
    try {
      setGenerating(true);
      const res = await generateProjectTemplates(hitProjectId, {});
      const results = res.data?.results || [];
      addToast(`${results.length} templates submitted to Meta for approval`, 'success');
      await fetchTemplates();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to generate templates', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSyncTemplates = async () => {
    try {
      setSyncingTemplates(true);
      const res = await syncProjectTemplates(hitProjectId);
      addToast(`Synced — ${res.data?.updated || 0} status update(s)`, 'success');
      await fetchTemplates();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to sync status', 'error');
    } finally {
      setSyncingTemplates(false);
    }
  };

  const handleDeleteTemplate = async (kind) => {
    try {
      await deleteProjectTemplate(hitProjectId, kind);
      addToast('Template deleted', 'success');
      await fetchTemplates();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete template', 'error');
    }
  };

  // ── Fetch project + settings ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, settingsRes, channelRes] = await Promise.allSettled([
        getProjectDetails(hitProjectId),
        getProjectSettings(hitProjectId),
        getChannelStatus(),
      ]);

      if (projRes.status === 'fulfilled') {
        setProject(projRes.value.data?.project || null);
      } else {
        addToast('Failed to load project', 'error');
        navigate('/projects');
        return;
      }

      if (settingsRes.status === 'fulfilled') {
        setConfig(settingsRes.value.data?.settings || {
          autoCallEnabled: true,
          autoWaEnabled: false,
          autoEmailEnabled: false,
          voiceSettings: { aiPrompt: '' },
          waTemplateName: '',
          emailTemplateName: '',
          isActive: true,
        });
      }

      if (channelRes.status === 'fulfilled' && channelRes.value.data?.success) {
        setChannelStatus(channelRes.value.data);
      }

      // Fetch templates (non-blocking)
      Promise.allSettled([listWATemplates(), listEmailTemplates()]).then(([waRes, emailRes]) => {
        if (waRes.status === 'fulfilled') {
          const d = waRes.value.data;
          setWaTemplates(Array.isArray(d) ? d : Array.isArray(d?.templates) ? d.templates : Array.isArray(d?.data) ? d.data : []);
        }
        if (emailRes.status === 'fulfilled') {
          const d = emailRes.value.data;
          setEmailTemplates(Array.isArray(d) ? d : Array.isArray(d?.templates) ? d.templates : Array.isArray(d?.data) ? d.data : []);
        }
      });
    } catch (err) {
      addToast('Failed to load project', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [hitProjectId, addToast, navigate]);

  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      const [bulkRes, fbRes] = await Promise.allSettled([
        getProjectCampaigns(hitProjectId),
        getFBCampaigns({ limit: 200 }),
      ]);

      if (bulkRes.status === 'fulfilled') {
        setCampaigns(bulkRes.value.data?.campaigns || []);
      }

      // Filter FB campaigns that are linked to this project
      if (fbRes.status === 'fulfilled') {
        const allFb = fbRes.value.data?.data || fbRes.value.data?.campaigns || [];
        const linked = allFb.filter(c => c.linkedHitProjectId === hitProjectId);
        setFbCampaignsLinked(linked);
      }
    } catch { /* silent */ } finally {
      setCampaignsLoading(false);
    }
  }, [hitProjectId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (tab === 'campaigns') fetchCampaigns(); }, [tab, fetchCampaigns]);
  useEffect(() => { if (tab === 'templates') fetchTemplates(); }, [tab, fetchTemplates]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const updateConfig = (path, value) => {
    setConfig(prev => {
      const copy = { ...prev };
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        copy[parent] = { ...(copy[parent] || {}), [child]: value };
      } else {
        copy[path] = value;
      }
      return copy;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProjectSettings(hitProjectId, {
        ...config,
        projectName: project?.projectName,
        city: project?.city,
      });
      addToast('Project settings saved', 'success');
      setDirty(false);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-slate-500">Project not found</p>
        <button onClick={() => navigate('/projects')} className={`${btnOutline} mt-4`}>Back to Projects</button>
      </div>
    );
  }

  const waConnected = channelStatus.whatsapp === true;
  const emailConnected = channelStatus.email === true;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/projects')}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-500">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{project.projectName}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">location_on</span>
            {project.city || project.location || '—'}
            {project.reraApproved && <span className="ml-2 text-emerald-600 font-bold">RERA</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ Automation Tab ═══════ */}
      {tab === 'settings' && (
        <div className="space-y-5">
          {/* Automation Toggles with lock */}
          <div className={`${cardClass} p-5`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Automation Channels</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Voice — always available */}
              <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                config?.autoCallEnabled ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5' : 'border-slate-200 dark:border-white/10'
              }`}>
                <input type="checkbox" checked={config?.autoCallEnabled || false} onChange={(e) => updateConfig('autoCallEnabled', e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary/40" />
                <span className={`material-symbols-outlined text-base ${config?.autoCallEnabled ? 'text-blue-500' : 'text-slate-400'}`}>call</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">AI Voice Call</span>
              </label>

              {/* WhatsApp — locked if not connected */}
              <label className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                !waConnected ? 'border-slate-200 dark:border-white/10 opacity-50 cursor-not-allowed' :
                config?.autoWaEnabled ? 'border-green-200 dark:border-green-500/30 bg-green-50/50 dark:bg-green-500/5 cursor-pointer' : 'border-slate-200 dark:border-white/10 cursor-pointer'
              }`}>
                <input type="checkbox" checked={waConnected ? (config?.autoWaEnabled || false) : false}
                  onChange={(e) => updateConfig('autoWaEnabled', e.target.checked)}
                  disabled={!waConnected}
                  className="rounded border-slate-300 text-primary focus:ring-primary/40" />
                <span className={`material-symbols-outlined text-base ${waConnected && config?.autoWaEnabled ? 'text-green-500' : 'text-slate-400'}`}>chat</span>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">WhatsApp</span>
                  {!waConnected && <span className="text-[9px] text-amber-600 font-bold">Not connected</span>}
                </div>
              </label>

              {/* Email — locked if not connected */}
              <label className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                !emailConnected ? 'border-slate-200 dark:border-white/10 opacity-50 cursor-not-allowed' :
                config?.autoEmailEnabled ? 'border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/5 cursor-pointer' : 'border-slate-200 dark:border-white/10 cursor-pointer'
              }`}>
                <input type="checkbox" checked={emailConnected ? (config?.autoEmailEnabled || false) : false}
                  onChange={(e) => updateConfig('autoEmailEnabled', e.target.checked)}
                  disabled={!emailConnected}
                  className="rounded border-slate-300 text-primary focus:ring-primary/40" />
                <span className={`material-symbols-outlined text-base ${emailConnected && config?.autoEmailEnabled ? 'text-purple-500' : 'text-slate-400'}`}>mail</span>
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Email</span>
                  {!emailConnected && <span className="text-[9px] text-amber-600 font-bold">Not connected</span>}
                </div>
              </label>
            </div>

            {/* Connection warnings */}
            {(!waConnected || !emailConnected) && (
              <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-500/20 px-3 py-2">
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                  {!waConnected && !emailConnected ? 'WhatsApp & Email not connected — ' :
                   !waConnected ? 'WhatsApp not connected — ' : 'Email not connected — '}
                  <a href="/integrations" className="underline hover:no-underline">Connect in Integrations</a>
                </p>
              </div>
            )}
          </div>

          {/* AI Voice Prompt */}
          <div className={`${cardClass} p-5`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">AI Voice Prompt</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              This prompt is added to the base voice settings for all leads in this project. Describe project USPs, pricing, and what action the AI should push for.
            </p>
            <textarea
              value={config?.voiceSettings?.aiPrompt || ''}
              onChange={(e) => updateConfig('voiceSettings.aiPrompt', e.target.value)}
              className={`${inputClass} min-h-[120px] resize-y`}
              placeholder="Example: This project is Aaditya Residency, 2BHK starting at ₹45L, RERA approved, ready possession, Manish Nagar Nagpur. Push for site visit booking."
              maxLength={5000}
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{(config?.voiceSettings?.aiPrompt || '').length}/5000</p>
          </div>

          {/* Voice Selection (per-project override) */}
          <div className={`${cardClass} p-5`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Voice</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Pick a voice for this project's calls, or inherit your account default. Overrides the account voice only for leads in this project.
            </p>
            <VoicePicker
              value={config?.voiceSettings?.selectedVoice || ''}
              onChange={(v) => updateConfig('voiceSettings.selectedVoice', v)}
              allowInherit
            />
          </div>

          {/* Greeting + Language + Sector */}
          <div className={`${cardClass} p-5 space-y-4`}>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Greeting Line</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                First line the AI speaks. Leave blank to use your account default greeting. Supports {'{customerName}'}, {'{agentName}'}, {'{companyName}'}.
              </p>
              <input
                type="text"
                value={config?.voiceSettings?.greetingLine || ''}
                onChange={(e) => updateConfig('voiceSettings.greetingLine', e.target.value)}
                className={inputClass}
                placeholder="Namaste {customerName} ji, main {agentName} bol rahi hu {companyName} se."
                maxLength={500}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Language */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">Language</label>
                <select
                  value={config?.voiceSettings?.language || ''}
                  onChange={(e) => updateConfig('voiceSettings.language', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Inherit account default</option>
                  {LANGUAGE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Sector */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">Sector</label>
                <select
                  value={config?.voiceSettings?.sector || ''}
                  onChange={(e) => updateConfig('voiceSettings.sector', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Inherit account default</option>
                  {SECTOR_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* WA Template — only show if connected */}
          {waConnected && (
            <div className={`${cardClass} p-5`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">WhatsApp Template</h3>
              <select
                value={config?.waTemplateName || ''}
                onChange={(e) => { updateConfig('waTemplateName', e.target.value); updateConfig('waTemplateEnabled', !!e.target.value); }}
                className={inputClass}
              >
                <option value="">— No template (skip WA message) —</option>
                {Array.isArray(waTemplates) && waTemplates.map(t => (
                  <option key={t.name || t.id} value={t.name}>{t.name} ({t.status || 'APPROVED'})</option>
                ))}
              </select>
            </div>
          )}

          {/* Email Template — only show if connected */}
          {emailConnected && (
            <div className={`${cardClass} p-5`}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Email Template</h3>
              <select
                value={config?.emailTemplateName || ''}
                onChange={(e) => { updateConfig('emailTemplateName', e.target.value); updateConfig('emailTemplateEnabled', !!e.target.value); }}
                className={inputClass}
              >
                <option value="">— No template (skip email) —</option>
                {Array.isArray(emailTemplates) && emailTemplates.map(t => (
                  <option key={t._id} value={t.name}>{t.name || t.subject}</option>
                ))}
              </select>
            </div>
          )}

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={!dirty || saving} className={btnPrimary}>
              {saving && <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ WhatsApp Templates Tab ═══════ */}
      {tab === 'templates' && (
        <div className="space-y-5">
          {/* Intro + actions */}
          <div className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Need-based WhatsApp Templates</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                  Auto-generates one template per customer need (3D tour, EMI, progress, RERA, etc.) from this project's content and submits them to Meta for approval. Each is sent to a lead only when its question comes up.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={handleSyncTemplates} disabled={syncingTemplates || generating} className={btnOutline}>
                  {syncingTemplates && <span className="animate-spin h-3 w-3 border-2 border-slate-400/40 border-t-slate-500 rounded-full" />}
                  {syncingTemplates ? 'Syncing…' : 'Sync Status'}
                </button>
                <button onClick={handleGenerateTemplates} disabled={generating || channelStatus.whatsapp === false} className={btnPrimary}>
                  {generating && <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />}
                  {generating ? 'Submitting…' : (projTemplates.length ? 'Regenerate & Submit' : 'Generate Templates')}
                </button>
              </div>
            </div>

            {channelStatus.whatsapp === false && (
              <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-500/20 px-3 py-2">
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                  WhatsApp not connected — <a href="/whatsapp-setup" className="underline hover:no-underline">connect a WABA</a> to generate templates.
                </p>
              </div>
            )}
            <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-500/20 px-3 py-2">
              <p className="text-[10px] text-blue-700 dark:text-blue-300">
                Meta approval takes a few minutes to a few hours. Use <b>Sync Status</b> to refresh, or approvals update automatically once your WABA webhook is subscribed.
              </p>
            </div>
          </div>

          {/* Template list */}
          {templatesLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
          ) : projTemplates.length === 0 ? (
            <div className={`${cardClass} p-8 text-center`}>
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 block mb-2">chat_add_on</span>
              <p className="text-sm text-slate-500">No templates yet. Click "Generate Templates" to create them from this project.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projTemplates.map(t => {
                const meta = TEMPLATE_KIND_META[t.kind] || { label: t.kind, need: '' };
                const st = TEMPLATE_STATUS_STYLES[t.status] || TEMPLATE_STATUS_STYLES.draft;
                const bodyComp = Array.isArray(t.components) ? t.components.find(c => c.type === 'BODY') : null;
                const btnComp = Array.isArray(t.components) ? t.components.find(c => c.type === 'BUTTONS') : null;
                return (
                  <div key={t.kind} className={`${cardClass} p-4`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{meta.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{meta.need}</p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${st}`}>{t.status}</span>
                    </div>

                    {t.headerImageUrl && (
                      <img src={t.headerImageUrl} alt="" className="mt-3 w-full h-24 object-cover rounded-lg" onError={e => { e.target.style.display = 'none'; }} />
                    )}

                    {bodyComp?.text && (
                      <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 whitespace-pre-wrap">{bodyComp.text}</p>
                    )}

                    {btnComp?.buttons?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {btnComp.buttons.map((b, i) => (
                          <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                            {b.text || b.type}
                          </span>
                        ))}
                      </div>
                    )}

                    {t.status === 'rejected' && t.rejectedReason && (
                      <p className="mt-2 text-[10px] text-red-600 dark:text-red-400">Rejected: {t.rejectedReason}</p>
                    )}

                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 font-mono truncate">{t.templateName}</span>
                      <button onClick={() => handleDeleteTemplate(t.kind)}
                        className="text-[9px] font-black uppercase tracking-wider text-red-500 hover:text-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════ Linked Sources Tab ═══════ */}
      {tab === 'campaigns' && (
        <div className="space-y-5">
          {campaignsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* Assigned FB Campaigns */}
              <div className={`${cardClass} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-base">data_exploration</span>
                    Facebook Ad Campaigns
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    {fbCampaignsLinked.length} assigned
                  </span>
                </div>

                {fbCampaignsLinked.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <span className="material-symbols-outlined text-2xl mb-1 block">link_off</span>
                    <p className="text-xs">No Facebook campaigns assigned to this project.</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Go to <a href="/integrations/facebook" className="text-primary underline">Facebook Ads</a> → expand a campaign → "Assign to Project"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fbCampaignsLinked.map(c => (
                      <div key={c.campaignId} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-[10px] font-bold flex-shrink-0">f</div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.campaignName}</p>
                            <p className="text-[10px] text-slate-500">{c.leadsCount || 0} leads &middot; {c.status}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
                        }`}>{c.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bulk Import Campaigns */}
              <div className={`${cardClass} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">upload_file</span>
                    Lead Imports
                  </h3>
                  <button
                    onClick={() => navigate('/campaigns')}
                    className="text-[10px] font-black uppercase tracking-wider text-primary hover:text-emerald-700 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">add</span>
                    Import Leads
                  </button>
                </div>

                {campaigns.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <span className="material-symbols-outlined text-2xl mb-1 block">upload_file</span>
                    <p className="text-xs">No lead imports yet for this project.</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Go to <a href="/campaigns" className="text-primary underline">Campaigns</a> page and select this project when uploading.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaigns.map(c => (
                      <div key={c.campaignId || c._id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.name || c.campaignId}</p>
                          <p className="text-[10px] text-slate-500">
                            {c.totalLeads} leads &middot; {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          c.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                          c.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-slate-100 text-slate-500'
                        }`}>{c.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSettingsPage;
