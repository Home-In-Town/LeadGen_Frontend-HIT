import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, syncProjects, createHitProject, createHomeinTownAccount, deleteHitProject } from '../api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const cardClass = 'rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 shadow-sm hover:shadow-md transition-all';

const CATEGORY_OPTIONS = ['Residential', 'Commercial', 'Mixed Use'];
const PROJECT_TYPE_OPTIONS = ['flat', 'plot', 'villa', 'penthouse', 'row-house', 'commercial'];
const STATUS_OPTIONS = ['pre-launch', 'under-construction', 'ready-to-move', 'new-launch'];

// ── Add Project Modal ────────────────────────────────────────────────────────
function AddProjectModal({ open, onClose, onCreated }) {
  const { addToast } = useNotifications();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectName: '',
    projectType: 'flat',
    category: 'Residential',
    city: '',
    location: '',
    projectStatus: 'pre-launch',
    reraApproved: false,
    reraNumber: '',
    startingPrice: '',
    pricePerSqFt: '',
    bhkOptions: '',
    carpetAreaRange: '',
    plotSizeRange: '',
    amenities: '',
    whatsappNumber: '',
    callNumber: '',
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectName.trim()) {
      addToast('Project name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        projectName: form.projectName.trim(),
        projectType: form.projectType,
        category: form.category,
        city: form.city.trim(),
        location: form.location.trim(),
        projectStatus: form.projectStatus,
        reraApproved: form.reraApproved,
        ...(form.reraNumber && { reraNumber: form.reraNumber.trim() }),
        pricing: {
          ...(form.startingPrice && { startingPrice: Number(form.startingPrice) }),
          ...(form.pricePerSqFt && { pricePerSqFt: Number(form.pricePerSqFt) }),
        },
        configuration: {
          ...(form.bhkOptions && { bhkOptions: form.bhkOptions.split(',').map(s => s.trim()).filter(Boolean) }),
          ...(form.carpetAreaRange && { carpetAreaRange: form.carpetAreaRange.trim() }),
          ...(form.plotSizeRange && { plotSizeRange: form.plotSizeRange.trim() }),
        },
        ...(form.amenities && { amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean) }),
        cta: {
          ...(form.whatsappNumber && { whatsappNumber: form.whatsappNumber.trim() }),
          ...(form.callNumber && { callNumber: form.callNumber.trim() }),
        },
      };

      await createHitProject(payload);
      addToast(`Project "${form.projectName}" created successfully!`, 'success');
      onCreated();
      onClose();
      setForm({ projectName: '', projectType: 'flat', category: 'Residential', city: '', location: '', projectStatus: 'pre-launch', reraApproved: false, reraNumber: '', startingPrice: '', pricePerSqFt: '', bhkOptions: '', carpetAreaRange: '', plotSizeRange: '', amenities: '', whatsappNumber: '', callNumber: '' });
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create project', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New Project</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-xl text-slate-500">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">Project Name *</label>
            <input type="text" value={form.projectName} onChange={e => handleChange('projectName', e.target.value)} required
              placeholder="e.g. Manish Nagar Residential Plots"
              className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none" />
          </div>

          {/* Type + Category + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">Type</label>
              <select value={form.projectType} onChange={e => handleChange('projectType', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-primary focus:outline-none">
                {PROJECT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">Category</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-primary focus:outline-none">
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">Status</label>
              <select value={form.projectStatus} onChange={e => handleChange('projectStatus', e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-primary focus:outline-none">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* City + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">City</label>
              <input type="text" value={form.city} onChange={e => handleChange('city', e.target.value)} placeholder="Nagpur"
                className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">Location</label>
              <input type="text" value={form.location} onChange={e => handleChange('location', e.target.value)} placeholder="Near Manish Nagar Metro"
                className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
            </div>
          </div>

          {/* RERA */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.reraApproved} onChange={e => handleChange('reraApproved', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">RERA Approved</span>
            </label>
            {form.reraApproved && (
              <input type="text" value={form.reraNumber} onChange={e => handleChange('reraNumber', e.target.value)} placeholder="RERA Number"
                className="flex-1 p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
            )}
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">Pricing</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={form.startingPrice} onChange={e => handleChange('startingPrice', e.target.value)} placeholder="Starting price (₹)"
                className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
              <input type="number" value={form.pricePerSqFt} onChange={e => handleChange('pricePerSqFt', e.target.value)} placeholder="Price per sq ft (₹)"
                className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
            </div>
          </div>

          {/* Configuration */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">Configuration</label>
            <div className="grid grid-cols-3 gap-3">
              <input type="text" value={form.bhkOptions} onChange={e => handleChange('bhkOptions', e.target.value)} placeholder="BHK (e.g. 1,2,3)"
                className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
              <input type="text" value={form.carpetAreaRange} onChange={e => handleChange('carpetAreaRange', e.target.value)} placeholder="Carpet area (sq ft)"
                className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
              <input type="text" value={form.plotSizeRange} onChange={e => handleChange('plotSizeRange', e.target.value)} placeholder="Plot size (sq ft)"
                className="w-full p-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">Amenities (comma separated)</label>
            <input type="text" value={form.amenities} onChange={e => handleChange('amenities', e.target.value)} placeholder="e.g. Garden, Club House, Swimming Pool, Gym"
              className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
          </div>

          {/* CTA */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">Contact Numbers</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="tel" value={form.whatsappNumber} onChange={e => handleChange('whatsappNumber', e.target.value)} placeholder="WhatsApp number"
                className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
              <input type="tel" value={form.callNumber} onChange={e => handleChange('callNumber', e.target.value)} placeholder="Call number"
                className="w-full p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none" />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listProjects();
      setProjects(res.data?.projects || []);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load projects';
      if (err.response?.status === 403) {
        setError('not_linked');
      } else {
        setError(msg);
        addToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ── Not linked state ────────────────────────────────────────────────────────
  if (error === 'not_linked') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-8 text-center space-y-6">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-2 block">apartment</span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enable Projects</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Projects let you manage leads per property/product with customized AI prompts, templates, and automation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Option 1: Create new HIT account */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-5 text-left">
              <span className="material-symbols-outlined text-2xl text-primary mb-2">add_circle</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">New to HomeInTown?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Create a HomeInTown account instantly using your current phone &amp; PIN. No separate registration needed.
              </p>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const res = await createHomeinTownAccount();
                    addToast(res.data?.message || 'Account created! You can now add projects.', 'success');
                    setError(null);
                    fetchProjects();
                  } catch (err) {
                    addToast(err.response?.data?.error || 'Failed to create account', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-white hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <span className="material-symbols-outlined text-sm">bolt</span>}
                {loading ? 'Creating...' : 'Create & Enable'}
              </button>
            </div>

            {/* Option 2: Connect existing HIT account */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-5 text-left">
              <span className="material-symbols-outlined text-2xl text-slate-500 mb-2">link</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Already have an account?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                If you already use homeintown.in, connect your existing account to sync projects.
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Connect Existing Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Your HomeInTown projects with per-project lead automation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Project
          </button>
          <button
            onClick={async () => {
              try {
                setSyncing(true);
                const res = await syncProjects();
                addToast(`Synced ${res.data.synced} projects from HomeInTown`, 'success');
                fetchProjects();
              } catch (err) {
                addToast(err.response?.data?.error || 'Sync failed', 'error');
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${syncing ? 'animate-spin' : ''}`}>sync</span>
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Add Project Modal */}
      <AddProjectModal open={showAddModal} onClose={() => setShowAddModal(false)} onCreated={fetchProjects} />

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4 block">apartment</span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No projects yet</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Add a project to start managing leads with project-specific automation.</p>
          <button onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-white hover:brightness-110 transition-all">
            <span className="material-symbols-outlined text-sm">add</span>
            Add Your First Project
          </button>
        </div>
      )}

      {/* Projects grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.hitProjectId}
            className={`${cardClass} overflow-hidden group relative`}
          >
            {/* Cover image or placeholder */}
            <div className="h-32 bg-gradient-to-br from-primary/10 to-emerald-500/10 dark:from-primary/5 dark:to-emerald-500/5 relative overflow-hidden cursor-pointer"
              onClick={() => navigate(`/projects/${project.hitProjectId}`)}>
              {project.coverImage ? (
                <img
                  src={project.coverImage}
                  alt={project.projectName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-primary/30">apartment</span>
                </div>
              )}
              {/* Status badge */}
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  project.status === 'published'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                }`}>
                  {project.projectStatus || project.status || 'draft'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/projects/${project.hitProjectId}`)}>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {project.projectName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {project.city || project.location || 'Location not set'}
                  </p>
                </div>
                {/* Edit + Delete buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.hitProjectId}`); }}
                    title="Edit settings"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm(`Delete "${project.projectName}"? This will unlink all associated campaigns and leads.`)) return;
                      try {
                        await deleteHitProject(project.hitProjectId);
                        addToast(`Project "${project.projectName}" deleted`, 'success');
                        fetchProjects();
                      } catch (err) {
                        addToast(err.response?.data?.error || 'Failed to delete project', 'error');
                      }
                    }}
                    title="Delete project"
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Automation status pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  project.autoCallEnabled
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
                }`}>
                  <span className="material-symbols-outlined text-[10px]">call</span>
                  Voice
                </span>
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  project.autoWaEnabled
                    ? 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
                }`}>
                  <span className="material-symbols-outlined text-[10px]">chat</span>
                  WA
                </span>
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  project.autoEmailEnabled
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
                }`}>
                  <span className="material-symbols-outlined text-[10px]">mail</span>
                  Email
                </span>
              </div>

              {/* Configured badge */}
              {project.configured && (
                <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  Configured
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
