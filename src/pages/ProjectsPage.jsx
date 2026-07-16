import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, syncProjects } from '../api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const cardClass = 'rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 shadow-sm hover:shadow-md transition-all';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

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
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4 block">link_off</span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">HomeInTown Not Connected</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Connect your HomeInTown account to see your real estate projects here and manage leads per project.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-6 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
          >
            <span className="material-symbols-outlined text-base">person</span>
            Go to Profile to Connect
          </button>
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
          {syncing ? 'Syncing...' : 'Sync Projects'}
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4 block">apartment</span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No projects found</p>
          <p className="text-xs text-slate-500 mt-1">Create projects in your HomeInTown dashboard and they will appear here.</p>
        </div>
      )}

      {/* Projects grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.hitProjectId}
            onClick={() => navigate(`/projects/${project.hitProjectId}`)}
            className={`${cardClass} cursor-pointer overflow-hidden group`}
          >
            {/* Cover image or placeholder */}
            <div className="h-32 bg-gradient-to-br from-primary/10 to-emerald-500/10 dark:from-primary/5 dark:to-emerald-500/5 relative overflow-hidden">
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
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {project.projectName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">location_on</span>
                {project.city || project.location || 'Location not set'}
              </p>

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
