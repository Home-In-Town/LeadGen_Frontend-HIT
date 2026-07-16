import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  getProjectDetails,
  getProjectSettings,
  updateProjectSettings,
  getProjectCampaigns,
  uploadProjectCampaign,
  listWATemplates,
  listEmailTemplates,
} from '../api';

const cardClass = 'rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 shadow-sm';
const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';
const labelClass = 'block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1.5';
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-primary/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnOutline = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50';

const TABS = [
  { id: 'settings', label: 'Automation', icon: 'settings_suggest' },
  { id: 'campaigns', label: 'Campaigns', icon: 'campaign' },
  { id: 'upload', label: 'Upload Leads', icon: 'upload_file' },
];

const ProjectSettingsPage = () => {
  const { hitProjectId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const fileRef = useRef(null);

  const [tab, setTab] = useState('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [config, setConfig] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Campaign & upload state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // Template options
  const [waTemplates, setWaTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);

  // ── Fetch project + settings ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, settingsRes] = await Promise.all([
        getProjectDetails(hitProjectId),
        getProjectSettings(hitProjectId),
      ]);
      setProject(projRes.data?.project || null);
      setConfig(settingsRes.data?.settings || {
        autoCallEnabled: true,
        autoWaEnabled: true,
        autoEmailEnabled: false,
        voiceSettings: { aiPrompt: '', selectedVoice: '', greetingLine: '', language: '', sector: '' },
        waTemplateName: '',
        waTemplateEnabled: false,
        emailTemplateName: '',
        emailTemplateEnabled: false,
        linkedFbFormIds: [],
        isActive: true,
      });

      // Fetch templates in parallel (non-blocking)
      Promise.allSettled([listWATemplates(), listEmailTemplates()]).then(([waRes, emailRes]) => {
        if (waRes.status === 'fulfilled') setWaTemplates(waRes.value.data?.templates || waRes.value.data || []);
        if (emailRes.status === 'fulfilled') setEmailTemplates(emailRes.value.data || []);
      });
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load project', 'error');
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  }, [hitProjectId, addToast, navigate]);

  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      const res = await getProjectCampaigns(hitProjectId);
      setCampaigns(res.data?.campaigns || []);
    } catch {
      /* silent */
    } finally {
      setCampaignsLoading(false);
    }
  }, [hitProjectId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (tab === 'campaigns') fetchCampaigns(); }, [tab, fetchCampaigns]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const updateConfig = (path, value) => {
    setConfig(prev => {
      const copy = { ...prev };
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        copy[parent] = { ...copy[parent], [child]: value };
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

  const handleUpload = async () => {
    if (!uploadFile) { addToast('Please select a file', 'error'); return; }
    try {
      setUploading(true);
      const res = await uploadProjectCampaign(hitProjectId, uploadFile);
      const data = res.data;
      addToast(`Campaign created: ${data.inserted} leads imported`, 'success');
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchCampaigns();
      setTab('campaigns');
    } catch (err) {
      addToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploading(false);
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

      {/* ═══════ Settings Tab ═══════ */}
      {tab === 'settings' && (
        <div className="space-y-5">
          {/* Automation Toggles */}
          <div className={`${cardClass} p-5`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Automation Channels</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: 'autoCallEnabled', label: 'AI Voice Call', icon: 'call', color: 'blue' },
                { key: 'autoWaEnabled', label: 'WhatsApp', icon: 'chat', color: 'green' },
                { key: 'autoEmailEnabled', label: 'Email', icon: 'mail', color: 'purple' },
              ].map(ch => (
                <label
                  key={ch.key}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                    config[ch.key]
                      ? `border-${ch.color}-200 dark:border-${ch.color}-500/30 bg-${ch.color}-50/50 dark:bg-${ch.color}-500/5`
                      : 'border-slate-200 dark:border-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={config[ch.key] || false}
                    onChange={(e) => updateConfig(ch.key, e.target.checked)}
                    className="rounded border-slate-300 text-primary focus:ring-primary/40"
                  />
                  <span className={`material-symbols-outlined text-base ${config[ch.key] ? `text-${ch.color}-500` : 'text-slate-400'}`}>{ch.icon}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ch.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* AI Voice Prompt */}
          <div className={`${cardClass} p-5`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">AI Voice Prompt</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              What should the AI agent pitch when calling leads for this project? Describe the project USPs, pricing, and call-to-action.
            </p>
            <textarea
              value={config.voiceSettings?.aiPrompt || ''}
              onChange={(e) => updateConfig('voiceSettings.aiPrompt', e.target.value)}
              className={`${inputClass} min-h-[120px] resize-y`}
              placeholder="Example: This campaign is for Aaditya Residency, 2BHK starting at ₹45L, RERA approved, ready possession, located in Manish Nagar, Nagpur. Goal: book a site visit."
              maxLength={5000}
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{(config.voiceSettings?.aiPrompt || '').length}/5000</p>
          </div>

          {/* WA Template */}
          <div className={`${cardClass} p-5`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">WhatsApp Template</h3>
            <div className="flex items-center gap-3">
              <select
                value={config.waTemplateName || ''}
                onChange={(e) => { updateConfig('waTemplateName', e.target.value); updateConfig('waTemplateEnabled', !!e.target.value); }}
                className={inputClass}
              >
                <option value="">— No template (skip WA) —</option>
                {waTemplates.map(t => (
                  <option key={t.name || t.id} value={t.name}>{t.name} ({t.status || 'APPROVED'})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email Template */}
          <div className={`${cardClass} p-5`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Email Template</h3>
            <select
              value={config.emailTemplateName || ''}
              onChange={(e) => { updateConfig('emailTemplateName', e.target.value); updateConfig('emailTemplateEnabled', !!e.target.value); }}
              className={inputClass}
            >
              <option value="">— No template (skip email) —</option>
              {emailTemplates.map(t => (
                <option key={t._id} value={t._id}>{t.name || t.subject}</option>
              ))}
            </select>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={!dirty || saving} className={btnPrimary}>
              {saving && <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ Campaigns Tab ═══════ */}
      {tab === 'campaigns' && (
        <div className="space-y-4">
          {campaignsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className={`${cardClass} p-8 text-center`}>
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">campaign</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No campaigns yet</p>
              <p className="text-xs text-slate-500 mt-1">Upload a CSV file in the "Upload Leads" tab to create your first campaign for this project.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => (
                <div key={c.campaignId || c._id} className={`${cardClass} p-4 flex items-center justify-between gap-3`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.name || c.campaignId}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.totalLeads} leads &middot; {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2 text-[9px] font-bold uppercase">
                    <span className={`px-2 py-0.5 rounded-full ${c.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : c.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-slate-100 text-slate-500'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ Upload Tab ═══════ */}
      {tab === 'upload' && (
        <div className={`${cardClass} p-6 space-y-5`}>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Upload Leads for {project.projectName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Leads will be processed using this project's automation settings (voice prompt, WA template, email template).
            </p>
          </div>

          {/* File input */}
          <div className="border-2 border-dashed border-slate-200 dark:border-white/15 rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-3xl text-slate-400 mb-2 block">upload_file</span>
            <p className="text-xs text-slate-500 mb-3">CSV or Excel file with columns: Name, Phone (required), Email (optional)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
          </div>

          {uploadFile && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-primary text-lg">description</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{uploadFile.name}</span>
                <span className="text-[10px] text-slate-400">({(uploadFile.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button onClick={() => { setUploadFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-slate-400 hover:text-red-500">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleUpload} disabled={!uploadFile || uploading} className={btnPrimary}>
              {uploading && <span className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />}
              {uploading ? 'Uploading...' : 'Upload & Start Campaign'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSettingsPage;
