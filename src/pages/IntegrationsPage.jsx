import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://lead-filteration-backend-624770114041.asia-south1.run.app';

const ownersApi = axios.create({
  baseURL: `${API_BASE_URL}/api/owners`,
  withCredentials: true,
});

const IntegrationsPage = () => {
  const { addToast } = useNotifications();

  /* ---------------------------------- */
  /* STATE */
  /* ---------------------------------- */

  const [activeTab, setActiveTab] = useState('whatsapp');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [visibility, setVisibility] = useState({
    whatsappVendor: false,
    whatsappApi: false,
    externalSecret: false,
  });

  const [whatsappSettings, setWhatsappSettings] = useState({
    vendorUid: '',
    apiKey: '',
  });

  const [externalSource, setExternalSource] = useState({
    sourceUrl: '',
    webhookSecret: '',
    isActive: false,
  });

  const [projectSettings, setProjectSettings] = useState({
    salesWebsiteUrl: '',
  });

  /* ---------------------------------- */
  /* UI */
  /* ---------------------------------- */

  const cardClass =
    'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';

  const inputClass =
    'w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-300 outline-none transition-all focus:border-primary focus:bg-white dark:focus:bg-[#1e293b]';

  const labelClass =
    'mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500';

  const primaryButton =
    'rounded-2xl bg-black px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-white transition-all hover:-translate-y-[1px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed';

  const secondaryButton =
    'rounded-2xl border border-indigo-300 bg-white dark:bg-[#1e293b] px-6 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 transition-all hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed';

  /* ---------------------------------- */
  /* FETCH */
  /* ---------------------------------- */

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);

      const response = await ownersApi.get('/integrations');

      setWhatsappSettings(response.data.whatsapp || {});

      if (response.data.externalSource) {
        setExternalSource(response.data.externalSource);
      }

      if (response.data.projectSettings) {
        setProjectSettings(response.data.projectSettings);
      }
    } catch (error) {
      console.error(error);

      addToast(
        'Failed to load integration settings',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------- */
  /* SAVE */
  /* ---------------------------------- */

  const handleSaveWhatsapp = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await ownersApi.put(
        '/integrations/whatsapp',
        whatsappSettings
      );

      addToast(
        'WhatsApp settings saved successfully',
        'success'
      );
    } catch (error) {
      console.error(error);

      addToast(
        'Failed to save WhatsApp settings',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExternal = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await Promise.all([
        ownersApi.put(
          '/integrations/external-source',
          externalSource
        ),

        ownersApi.put(
          '/integrations/project-settings',
          projectSettings
        ),
      ]);

      addToast(
        'Project source settings saved successfully',
        'success'
      );
    } catch (error) {
      console.error(error);

      addToast(
        'Failed to save settings',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------- */
  /* TEST CONNECTION */
  /* ---------------------------------- */

  const handleTestConnection = async () => {
    if (!externalSource.sourceUrl) {
      addToast(
        'Please provide a source URL first',
        'warning'
      );

      return;
    }

    try {
      setTesting(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/projects/test-connection`,
        {
          sourceUrl: externalSource.sourceUrl,

          webhookSecret:
            externalSource.webhookSecret ===
            '********'
              ? null
              : externalSource.webhookSecret,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        addToast(
          response.data.message ||
            `Successfully connected! Found ${response.data.data.length} projects.`,
          'success'
        );
      } else {
        addToast(
          'Connected, but verification failed.',
          'warning'
        );
      }
    } catch (error) {
      console.error(error);

      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Connection failed';

      addToast(errorMsg, 'error');
    } finally {
      setTesting(false);
    }
  };

  /* ---------------------------------- */
  /* HELPERS */
  /* ---------------------------------- */

  const toggleVisibility = (field) => {
    setVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const tabs = useMemo(
    () => [
      {
        id: 'whatsapp',
        title: 'WhatsApp',
        icon: 'chat',
        activeClass: 'bg-[#25D366] text-white',
      },

      {
        id: 'external',
        title: 'Project Source',
        icon: 'webhook',
        activeClass: 'bg-indigo-600 text-white',
      },
    ],
    []
  );

  const renderPasswordField = ({
    label,
    value,
    onChange,
    placeholder,
    visible,
    onToggle,
  }) => (
    <div>
      <label className={labelClass}>
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className={`${inputClass} pr-14`}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white transition-colors hover:text-slate-700 dark:hover:text-slate-300"
        >
          <span className="material-symbols-outlined text-lg">
            {visible
              ? 'visibility_off'
              : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  );

  /* ---------------------------------- */
  /* LOADING */
  /* ---------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Loading Integrations
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------- */
  /* RENDER */
  /* ---------------------------------- */

  return (
    <div className="animate-fade-in pb-10">
      <div className="mx-auto max-w-7xl px-4">

        {/* HEADER */}

        <div className={`${cardClass} mb-8 p-6 md:p-8`}>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">

                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />

                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  System Integrations
                </span>

              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Integrations
              </h1>

              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Manage all external services & automation providers
              </p>

            </div>

          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">

          {/* SIDEBAR */}

          <div className={`${cardClass} h-fit p-4`}>

            <div className="space-y-3">

              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left transition-all ${
                    activeTab === tab.id
                      ? `${tab.activeClass} border-transparent shadow-lg`
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >

                  <span className="material-symbols-outlined text-xl">
                    {tab.icon}
                  </span>

                  <div>

                    <div className="text-[10px] font-black uppercase tracking-[0.25em]">
                      {tab.title}
                    </div>

                  </div>

                </button>
              ))}

            </div>

          </div>

          {/* CONTENT */}

          <div className={`${cardClass} p-6 md:p-8`}>

            {/* WHATSAPP */}

            {activeTab === 'whatsapp' && (
              <div className="animate-fade-in">

                <div className="mb-8 flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg">
                    <span className="material-symbols-outlined text-2xl">
                      chat
                    </span>
                  </div>

                  <div>

                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      WhatsApp Integration
                    </h2>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                      Connect via wa.homeintown.in
                    </p>

                  </div>

                </div>

                <form
                  onSubmit={handleSaveWhatsapp}
                  className="space-y-6"
                >

                  {/* ── Get Credentials Banner ─────────────────── */}
                  <div className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#25D366] mb-1">
                        Don't have credentials yet?
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Visit <span className="font-semibold">wa.homeintown.in</span> to generate your Vendor UID and API Key, then paste them below.
                      </p>
                    </div>
                    <a
                      href="https://wa.homeintown.in/auth/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-md hover:bg-[#20b858] transition-all whitespace-nowrap flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                      Get Credentials
                    </a>
                  </div>

                  {renderPasswordField({
                    label: 'Vendor UID',
                    value:
                      whatsappSettings.vendorUid,

                    placeholder:
                      'Your Vendor UID',

                    visible:
                      visibility.whatsappVendor,

                    onToggle: () =>
                      toggleVisibility(
                        'whatsappVendor'
                      ),

                    onChange: (e) =>
                      setWhatsappSettings({
                        ...whatsappSettings,
                        vendorUid:
                          e.target.value,
                      }),
                  })}

                  {renderPasswordField({
                    label: 'API Key',
                    value:
                      whatsappSettings.apiKey,

                    placeholder:
                      'Your API Key',

                    visible:
                      visibility.whatsappApi,

                    onToggle: () =>
                      toggleVisibility(
                        'whatsappApi'
                      ),

                    onChange: (e) =>
                      setWhatsappSettings({
                        ...whatsappSettings,
                        apiKey:
                          e.target.value,
                      }),
                  })}

                  <button
                    type="submit"
                    disabled={saving}
                    className={primaryButton}
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save WhatsApp Settings'}
                  </button>

                </form>

              </div>
            )}

            {/* EXTERNAL */}

            {activeTab === 'external' && (
              <div className="animate-fade-in">

                <div className="mb-8 flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
                    <span className="material-symbols-outlined text-2xl">
                      webhook
                    </span>
                  </div>

                  <div>

                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      Project Source Webhook
                    </h2>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                      External lead & project bridge
                    </p>

                  </div>

                </div>

                <form
                  onSubmit={handleSaveExternal}
                  className="space-y-6"
                >

                  <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4">

                    <input
                      type="checkbox"
                      checked={
                        externalSource.isActive
                      }
                      onChange={(e) =>
                        setExternalSource({
                          ...externalSource,
                          isActive:
                            e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />

                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700">
                      Enable External Project Source
                    </span>

                  </div>

                  <div>

                    <label className={labelClass}>
                      Sales Website URL
                    </label>

                    <input
                      type="url"
                      value={
                        projectSettings.salesWebsiteUrl ||
                        ''
                      }
                      onChange={(e) =>
                        setProjectSettings({
                          ...projectSettings,
                          salesWebsiteUrl:
                            e.target.value,
                        })
                      }
                      placeholder="https://www.yoursite.com"
                      className={inputClass}
                    />

                  </div>

                  <div>

                    <label className={labelClass}>
                      Source URL
                    </label>

                    <input
                      type="url"
                      value={
                        externalSource.sourceUrl ||
                        ''
                      }
                      onChange={(e) =>
                        setExternalSource({
                          ...externalSource,
                          sourceUrl:
                            e.target.value,
                        })
                      }
                      placeholder="https://site.com/webhook"
                      className={inputClass}
                    />

                  </div>

                  {renderPasswordField({
                    label:
                      'Webhook Secret / API Key',

                    value:
                      externalSource.webhookSecret,

                    placeholder:
                      'Enter secret key',

                    visible:
                      visibility.externalSecret,

                    onToggle: () =>
                      toggleVisibility(
                        'externalSecret'
                      ),

                    onChange: (e) =>
                      setExternalSource({
                        ...externalSource,
                        webhookSecret:
                          e.target.value,
                      }),
                  })}

                  <div className="flex flex-wrap gap-4">

                    <button
                      type="submit"
                      disabled={saving}
                      className={primaryButton}
                    >
                      {saving
                        ? 'Saving...'
                        : 'Save Settings'}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleTestConnection
                      }
                      disabled={
                        testing ||
                        !externalSource.sourceUrl
                      }
                      className={secondaryButton}
                    >
                      {testing
                        ? 'Testing...'
                        : 'Test Connection'}
                    </button>

                  </div>

                </form>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default IntegrationsPage;

