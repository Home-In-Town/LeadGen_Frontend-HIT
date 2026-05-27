import React, { useEffect, useState } from 'react';
import {
  getBuilderProjects,
  getGoogleMappings,
  createGoogleMapping,
  deleteGoogleMapping,
} from '../api';

const GoogleIntegrationPage = () => {
  const [mappings, setMappings] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newMapping, setNewMapping] = useState({
    googleKey: '',
    salesWebsiteProjectId: '',
    formName: '',
  });

  const WEBHOOK_URL =
    'https://lead-filteration-backend-624770114041.asia-south1.run.app/api/google/webhook';

  /* ---------------------------------- */
  /* THEME */
  /* ---------------------------------- */

  const cardClass =
    'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

  const inputClass =
    'w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-primary';

  const buttonPrimary =
    'bg-primary text-white border border-primary hover:bg-charcoal hover:border-charcoal transition-all rounded-[14px] font-black uppercase tracking-widest text-[10px] px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed';

  const buttonSecondary =
    'bg-white dark:bg-white/[0.04] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all rounded-[14px] font-black uppercase tracking-widest text-[10px] px-5 py-3';

  /* ---------------------------------- */
  /* FETCH */
  /* ---------------------------------- */

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [mappingsRes, projectsRes] =
        await Promise.all([
          getGoogleMappings(),
          getBuilderProjects(),
        ]);

      setMappings(mappingsRes.data.data || []);
      setProjects(projectsRes.data.data || []);
    } catch (error) {
      console.error(
        'Error fetching data:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------- */
  /* ACTIONS */
  /* ---------------------------------- */

  const handleCreateMapping = async (
    e
  ) => {
    e.preventDefault();

    if (
      !newMapping.googleKey ||
      !newMapping.salesWebsiteProjectId
    ) {
      alert(
        'Google Key and Project are required'
      );
      return;
    }

    setSubmitting(true);

    try {
      await createGoogleMapping(
        newMapping
      );

      setNewMapping({
        googleKey: '',
        salesWebsiteProjectId: '',
        formName: '',
      });

      fetchData();
    } catch (error) {
      console.error(
        'Error creating mapping:',
        error
      );

      alert(
        error.response?.data?.error ||
          'Failed to create mapping'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMapping = async (
    id
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this mapping?'
    );

    if (!confirmed) return;

    try {
      await deleteGoogleMapping(id);

      fetchData();
    } catch (error) {
      console.error(
        'Error deleting mapping:',
        error
      );

      alert('Failed to delete mapping');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);

    alert('Copied to clipboard!');
  };

  /* ---------------------------------- */
  /* RENDER */
  /* ---------------------------------- */

  return (
    <div className="relative animate-fade-in pb-10 font-display">

      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0 -z-10 landing-gradient-mesh opacity-10 dark:opacity-25" />

      <div className="pointer-events-none absolute inset-0 -z-10 landing-grid-bg opacity-10 dark:opacity-30" />

      <div className="mx-auto max-w-7xl px-4">

        {/* HEADER */}

        <div className={`${cardClass} mb-8 p-6 md:p-8`}>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">

                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />

                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Google Lead Forms
                </span>

              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Google Integration
              </h1>

              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Manage Google Ads webhook mappings
              </p>

            </div>

          </div>

        </div>

        {/* WEBHOOK INFO */}

        <div className={`${cardClass} mb-8 p-6`}>

          <div className="mb-5">

            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Webhook Configuration
            </h2>

            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              Connect Google Ads lead forms
            </p>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* WEBHOOK URL */}

            <div className="rounded-[18px] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03] p-5">

              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Webhook URL
              </label>

              <div className="flex gap-2">

                <input
                  readOnly
                  value={WEBHOOK_URL}
                  className={`${inputClass} font-mono text-xs`}
                />

                <button
                  onClick={() =>
                    copyToClipboard(
                      WEBHOOK_URL
                    )
                  }
                  className={buttonPrimary}
                >
                  Copy
                </button>

              </div>

            </div>

            {/* SECRET INFO */}

            <div className="rounded-[18px] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03] p-5">

              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Google Shared Secret
              </label>

              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Create a unique secret key below
                and use the exact same value
                inside your Google Ads Lead Form
                webhook settings.
              </p>

            </div>

          </div>

        </div>

        {/* CONTENT */}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* FORM */}

          <div className={`${cardClass} p-6`}>

            <div className="mb-6">

              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Create Mapping
              </h2>

              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Add new Google form mapping
              </p>

            </div>

            <form
              onSubmit={handleCreateMapping}
              className="space-y-5"
            >

              {/* GOOGLE KEY */}

              <div>

                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Google Key
                </label>

                <input
                  type="text"
                  value={newMapping.googleKey}
                  onChange={(e) =>
                    setNewMapping({
                      ...newMapping,
                      googleKey:
                        e.target.value,
                    })
                  }
                  placeholder="Enter shared secret"
                  className={inputClass}
                />

              </div>

              {/* PROJECT */}

              <div>

                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Project
                </label>

                <select
                  value={
                    newMapping.salesWebsiteProjectId
                  }
                  onChange={(e) =>
                    setNewMapping({
                      ...newMapping,
                      salesWebsiteProjectId:
                        e.target.value,
                    })
                  }
                  className={inputClass}
                >

                  <option value="">
                    Select Project
                  </option>

                  {projects.map((proj) => (
                    <option
                      key={proj._id}
                      value={proj._id}
                    >
                      {proj.projectName}
                    </option>
                  ))}

                </select>

              </div>

              {/* FORM NAME */}

              <div>

                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Form Name
                </label>

                <input
                  type="text"
                  value={newMapping.formName}
                  onChange={(e) =>
                    setNewMapping({
                      ...newMapping,
                      formName:
                        e.target.value,
                    })
                  }
                  placeholder="Search Campaign Leads"
                  className={inputClass}
                />

              </div>

              {/* BUTTON */}

              <button
                type="submit"
                disabled={submitting}
                className={`${buttonPrimary} w-full`}
              >
                {submitting
                  ? 'Creating...'
                  : 'Create Mapping'}
              </button>

            </form>

          </div>

          {/* TABLE */}

          <div className="lg:col-span-2">

            <div className={`${cardClass} overflow-hidden`}>

              <div className="border-b border-slate-200 dark:border-white/10 px-6 py-5">

                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Active Mappings
                </h2>

                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                  Connected Google lead forms
                </p>

              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">

                  <div className="flex flex-col items-center gap-4">

                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                      Loading
                    </p>

                  </div>

                </div>
              ) : mappings.length === 0 ? (
                <div className="p-12 text-center">

                  <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-white/20">
                    link_off
                  </span>

                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    No mappings found
                  </p>

                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">

                      <tr>

                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                          Form
                        </th>

                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                          Google Key
                        </th>

                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                          Project
                        </th>

                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                          Status
                        </th>

                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {mappings.map((m) => (

                        <tr
                          key={m._id}
                          className="border-b border-slate-200 transition-all hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.03]"
                        >

                          <td className="px-6 py-5">

                            <div className="font-black text-slate-900 dark:text-white">
                              {m.formName ||
                                'Unnamed Form'}
                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <div className="font-mono text-sm text-slate-600 dark:text-slate-300">
                              {m.googleKey}
                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              {projects.find(
                                (p) =>
                                  p._id ===
                                  m.salesWebsiteProjectId
                              )?.projectName ||
                                m.salesWebsiteProjectId}
                            </div>

                          </td>

                          <td className="px-6 py-5 text-center">

                            <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                              Active
                            </span>

                          </td>

                          <td className="px-6 py-5 text-right">

                            <button
                              onClick={() =>
                                handleDeleteMapping(
                                  m._id
                                )
                              }
                              className="rounded-[12px] border border-red-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                            >
                              Delete
                            </button>

                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default GoogleIntegrationPage;

