import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';
import IntegrationSelectorModal from '../components/IntegrationSelectorModal';

const THEME_STORAGE_KEY = 'hit-landing-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    /* ignore */
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/* ---------------------------------- */
/* Reusable Components */
/* ---------------------------------- */

const SectionHeading = ({ title, icon }) => (
  <div className="flex items-center gap-3 mb-5 sm:mb-6">
    {icon && (
      <span className="material-symbols-outlined text-primary">{icon}</span>
    )}

    <h2 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-slate-700/60 dark:text-slate-300/60 whitespace-nowrap">
      {title}
    </h2>

    <div className="h-[1px] w-full bg-slate-200/70 dark:bg-white/10" />
  </div>
);

const KPIStatCard = ({
  title,
  value,
  subtitle,
  icon,
  accent = false,
  onClick,
}) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    className={`bg-white/75 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 p-4 sm:p-6 rounded-[16px] shadow-sm backdrop-blur-sm transition-all hover:-translate-y-px hover:shadow-md ${
      onClick ? 'cursor-pointer' : ''
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3
          className={`text-[10px] font-black uppercase tracking-[0.35em] ${
            accent
              ? 'text-primary'
              : 'text-slate-900/50 dark:text-slate-300/60'
          }`}
        >
          {title}
        </h3>

        <div
          className={`mt-2 text-3xl sm:text-4xl font-black tracking-tight ${
            accent
              ? 'text-primary'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {value}
        </div>

        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-900/25 dark:text-slate-300/40">
          {subtitle}
        </p>
      </div>

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-[14px] ring-1 ${
          accent
            ? 'bg-primary/10 text-primary ring-primary/20'
            : 'bg-charcoal/5 text-charcoal ring-charcoal/10 dark:bg-white/[0.04] dark:ring-white/10'
        }`}
      >
        <span className="material-symbols-outlined text-2xl">
          {icon}
        </span>
      </div>
    </div>
  </div>
);

const KPISectionSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div
        key={idx}
        className="rounded-[16px] border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-4 sm:p-6 animate-pulse"
      >
        <div className="h-[10px] w-28 rounded bg-slate-200 dark:bg-white/10" />
        <div className="mt-3 h-8 w-24 rounded bg-slate-200 dark:bg-white/10" />
        <div className="mt-3 h-[10px] w-36 rounded bg-slate-200 dark:bg-white/10" />
      </div>
    ))}
  </div>
);

const IntegrationsCard = ({ onClick }) => (
  <div
    onClick={onClick}
    className="group bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 backdrop-blur-xl p-4 sm:p-6 hover:bg-white dark:hover:bg-white/[0.07] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[160px] rounded-[18px] shadow-sm hover:-translate-y-px hover:shadow-md"
    role="button"
    tabIndex={0}
  >
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <span className="material-symbols-outlined text-slate-800/80 group-hover:text-primary transition-colors text-2xl">
          hub
        </span>

        <div className="flex gap-2">
          <div className="w-6 h-6 bg-white border border-slate-200 rounded-sm p-1 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>

          <div className="w-6 h-6 bg-[#1877F2] border border-[#1877F2] rounded-sm p-1 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 group-hover:text-primary transition-colors mb-1 dark:text-white">
        Integrations
      </h3>

      <p className="text-[10px] font-bold text-slate-700/40 group-hover:text-primary/70 transition-colors uppercase tracking-wider dark:text-slate-300/60">
        Connect external sources
      </p>
    </div>

    <div className="relative z-10 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />

        <span className="text-[9px] font-black uppercase tracking-widest text-primary">
          2 Integrations Active
        </span>
      </div>

      <span className="material-symbols-outlined text-slate-700/40 group-hover:text-primary/80 transition-colors">
        arrow_forward
      </span>
    </div>

    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-charcoal/5 group-hover:bg-primary/15 rotate-12 transition-all rounded-full dark:bg-white/5" />
  </div>
);

const EmptyUsersState = ({ onAddUser }) => (
  <div className="mx-auto max-w-7xl px-3 sm:px-0">
    <div className="mt-2 bg-white/70 dark:bg-white/[0.04] border border-dashed border-slate-200/70 dark:border-white/15 p-8 sm:p-12 text-center rounded-[18px] shadow-sm backdrop-blur-xl">
      <span className="material-symbols-outlined text-4xl sm:text-5xl text-slate-700/30 dark:text-white/20 mb-3">
        person_off
      </span>

      <p className="text-slate-700/60 dark:text-slate-300/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4">
        No data in system.
      </p>

      <button
        onClick={onAddUser}
        className="px-5 py-2 bg-charcoal text-white font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all cursor-pointer rounded-[12px]"
      >
        Add First Person
      </button>
    </div>
  </div>
);

/* ---------------------------------- */
/* Main Component */
/* ---------------------------------- */

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] =
    useState(false);

  const [theme] = useState(getInitialTheme);

  /* -------------------- */
  /* NEW STATES */
  /* -------------------- */

  const [manualForm, setManualForm] = useState({
    name: '',
    phone: '',
  });

  const [file, setFile] = useState(null);

  const [manualLoading, setManualLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState('');

  const isDark = theme === 'dark';

  /* -------------------- */
  /* FETCH USERS */
  /* -------------------- */

  const fetchUsers = useCallback(async () => {
    if (!user) {
      setUsers([]);
      setIsUsersLoading(false);
      return;
    }

    setIsUsersLoading(true);

    try {
      const params = {
        userId: user.id,
        role: user.role,
      };

      const res = await api.getAllUsers(params);

      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* -------------------- */
  /* MANUAL ENTRY LOGIC */
  /* -------------------- */

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    setManualLoading(true);
    setError('');

    try {
      const creatorData = user
        ? {
            userId: user.id,
            role: user.role,
            name: user.name,
          }
        : null;

      await api.createUser({
        ...manualForm,
        createdBy: creatorData,
      });

      setManualForm({
        name: '',
        phone: '',
      });

      await fetchUsers();

      navigate('/users');
    } catch (err) {
      console.error(err);
      setError('Failed to add user.');
    } finally {
      setManualLoading(false);
    }
  };

  /* -------------------- */
  /* FILE UPLOAD LOGIC */
  /* -------------------- */

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!file) return;

    setFileLoading(true);
    setError('');

    try {
      const creatorData = user
        ? {
            userId: user.id,
            role: user.role,
            name: user.name,
          }
        : null;

      await api.uploadUser(file, creatorData);

      setFile(null);

      await fetchUsers();

      navigate('/users');
    } catch (err) {
      console.error(err);
      setError('Failed to process document.');
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div
      className={`relative animate-fade-in font-display pb-10 transition-colors duration-300 ${
        isDark ? 'dark' : ''
      }`}
    >
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 landing-gradient-mesh opacity-10 dark:opacity-25"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 -z-10 landing-grid-bg opacity-10 dark:opacity-30"
        aria-hidden
      />

      <div className="min-h-[50vh] bg-transparent text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Header */}
        <div className="mx-auto max-w-7xl px-3 sm:px-0">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-between items-center bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-white/10 backdrop-blur-xl p-3 sm:p-5 mb-5 sm:mb-8 shadow-sm rounded-[18px] transition-all">
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
                System Dashboard
              </h1>

              <p className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600/70 dark:text-slate-300/70">
                Overview & Statistics
              </p>
            </div>

            <button
              onClick={() => navigate('/users')}
              className="w-full sm:w-auto bg-primary text-white py-2 sm:py-3 px-4 sm:px-6 font-black uppercase tracking-widest text-[10px] sm:text-xs border border-primary hover:bg-charcoal hover:border-charcoal transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg rounded-[14px]"
            >
              <span className="material-symbols-outlined text-base sm:text-lg font-black">
                groups
              </span>

              VIEW USERS
            </button>
          </div>
        </div>

        

        {/* Tools & Settings */}
        <section className="mx-auto max-w-7xl mb-10 sm:mb-12 px-3 sm:px-0">
          <SectionHeading title="Tools & Settings" icon={
            <span className="material-symbols-outlined text-primary">
              settings
            </span>
          } />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

            {/* Integrations */}
            <IntegrationsCard
              onClick={() => setIsIntegrationModalOpen(true)}
            />

            {/* Manual User Entry */}
            <form
              onSubmit={handleManualSubmit}
              className="
                bg-white/70 dark:bg-white/[0.04]
                border border-slate-200/80 dark:border-white/10
                backdrop-blur-xl
                rounded-[18px]
                p-5 sm:p-6
                shadow-sm
                hover:shadow-md
                transition-all
              "
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-[14px] bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    person_add
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Manual Entry
                  </h3>

                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mt-1">
                    Add new person
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                    Full Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={manualForm.name}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        name: e.target.value,
                      })
                    }
                    required
                    className="
                      w-full p-3
                      bg-white/80 dark:bg-white/[0.03]
                      border border-slate-200 dark:border-white/10
                      rounded-[14px]
                      text-slate-900 dark:text-slate-100
                      placeholder:text-slate-400 dark:placeholder:text-slate-500
                      focus:border-primary
                      focus:ring-4
                      focus:ring-primary/10
                      focus:outline-none
                      transition-all
                      font-mono text-sm
                    "
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={manualForm.phone}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        phone: e.target.value,
                      })
                    }
                    required
                    className="
                      w-full p-3
                      bg-white/80 dark:bg-white/[0.03]
                      border border-slate-200 dark:border-white/10
                      rounded-[14px]
                      text-slate-900 dark:text-slate-100
                      placeholder:text-slate-400 dark:placeholder:text-slate-500
                      focus:border-primary
                      focus:ring-4
                      focus:ring-primary/10
                      focus:outline-none
                      transition-all
                      font-mono text-sm
                    "
                  />
                </div>

                <button
                  type="submit"
                  disabled={manualLoading}
                  className="
                    w-full
                    bg-primary
                    text-white
                    py-3
                    rounded-[14px]
                    font-black
                    uppercase
                    tracking-[0.2em]
                    text-[10px]
                    hover:brightness-110
                    transition-all
                    duration-200
                    cursor-pointer
                    shadow-lg
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  {manualLoading
                    ? 'PROCESSING...'
                    : 'ADD TO SYSTEM'}
                </button>
              </div>
            </form>

            {/* Upload Document */}
            <form
              onSubmit={handleFileUpload}
              className="
                bg-white/70 dark:bg-white/[0.04]
                border border-slate-200/80 dark:border-white/10
                backdrop-blur-xl
                rounded-[18px]
                p-5 sm:p-6
                shadow-sm
                hover:shadow-md
                transition-all
              "
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-[14px] bg-blue-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-500 text-[22px]">
                    upload_file
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Import Document
                  </h3>

                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mt-1">
                    DOCX / XLSX / CSV
                  </p>
                </div>
              </div>

              <div
                className={`
                  relative
                  border border-dashed
                  rounded-[18px]
                  p-8
                  transition-all
                  duration-300
                  backdrop-blur-sm
                  overflow-hidden
                  ${
                    file
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-slate-300 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]'
                  }
                `}
              >
                <input
                  type="file"
                  accept=".docx,.xlsx,.csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                <div className="flex flex-col items-center justify-center text-center">
                  <div
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center mb-4
                      ${
                        file
                          ? 'bg-emerald-500/15'
                          : 'bg-slate-200/60 dark:bg-white/[0.04]'
                      }
                    `}
                  >
                    <span
                      className={`
                        material-symbols-outlined text-[30px]
                        ${
                          file
                            ? 'text-emerald-500'
                            : 'text-slate-400 dark:text-slate-500'
                        }
                      `}
                    >
                      {file ? 'task_alt' : 'cloud_upload'}
                    </span>
                  </div>

                  <p
                    className={`
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.2em]
                      ${
                        file
                          ? 'text-emerald-500'
                          : 'text-slate-500 dark:text-slate-400'
                      }
                    `}
                  >
                    {file ? 'File Loaded' : 'Click To Upload'}
                  </p>

                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    DOCX, XLSX or CSV
                  </p>

                  {file && (
                    <p className="mt-3 text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                      {file.name}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!file || fileLoading}
                className="
                  w-full
                  mt-5
                  bg-primary
                  text-white
                  py-3
                  rounded-[14px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-[10px]
                  hover:brightness-110
                  transition-all
                  duration-200
                  cursor-pointer
                  shadow-lg
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {fileLoading
                  ? 'EXTRACTING...'
                  : 'PROCESS FILE'}
              </button>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div
              className="
                mt-6
                p-4
                rounded-[16px]
                bg-red-500/10
                border border-red-500/20
                backdrop-blur-xl
                text-red-400
                text-center
              "
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                {error}
              </p>
            </div>
          )}
        </section>

        {/* Empty State */}
        {!isUsersLoading && users.length === 0 && (
          <EmptyUsersState
            onAddUser={() => navigate('/add-user')}
          />
        )}

        {/* KPI Section */}
        <section
          aria-label="KPI overview"
          className="mx-auto max-w-7xl mb-6 sm:mb-10 px-3 sm:px-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                monitoring
              </span>

              <h2 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-slate-700/60 dark:text-slate-300/60 whitespace-nowrap">
                Key metrics
              </h2>
            </div>
          </div>

          {isUsersLoading ? (
            <KPISectionSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KPIStatCard
                title="Total Users"
                value={users.length}
                subtitle="Real-time roster"
                icon="groups"
                accent
                onClick={() => navigate('/users')}
              />

              <KPIStatCard
                title="System Status"
                value="Active"
                subtitle="Operational"
                icon="check_circle"
                accent
              />

              <KPIStatCard
                title="Integrations"
                value="2"
                subtitle="Connected sources"
                icon="integration_instructions"
                accent
                onClick={() => setIsIntegrationModalOpen(true)}
              />

              <KPIStatCard
                title="Automation Health"
                value={
                  <>
                    99.2
                    <span className="text-[13px] font-black text-primary align-top">
                      %
                    </span>
                  </>
                }
                subtitle="Smart rules stable"
                icon="verified"
                accent
              />
            </div>
          )}
        </section>

        {/* Modal */}
        <IntegrationSelectorModal
          isOpen={isIntegrationModalOpen}
          onClose={() => setIsIntegrationModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default DashboardPage;