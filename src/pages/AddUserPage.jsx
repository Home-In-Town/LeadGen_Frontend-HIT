import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';

const AddUserPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [manualForm, setManualForm] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [file, setFile] = useState(null);

  const [manualLoading, setManualLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState('');

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

      navigate('/users');
    } catch (err) {
      console.error(err);
      setError('Failed to add user.');
    } finally {
      setManualLoading(false);
    }
  };

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

      navigate('/users');
    } catch (err) {
      console.error(err);
      setError('Failed to process document.');
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div className="relative animate-fade-in font-display pb-12">
      {/* Background Effects */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 landing-gradient-mesh opacity-10 dark:opacity-25"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 -z-10 landing-grid-bg opacity-10 dark:opacity-30"
        aria-hidden
      />

      <div className="max-w-5xl mx-auto px-3 sm:px-0 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Back Button */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="
              flex items-center gap-2
              px-4 py-2.5
              rounded-[14px]
              bg-white/70 dark:bg-white/[0.04]
              border border-slate-200/80 dark:border-white/10
              backdrop-blur-xl
              text-slate-700 dark:text-slate-200
              hover:text-primary
              hover:border-primary/30
              transition-all
              duration-200
              cursor-pointer
              shadow-sm
              hover:shadow-md
            "
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Dashboard
            </span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h1
            className="
              text-3xl sm:text-4xl
              font-black
              tracking-tight
              text-slate-900 dark:text-white
            "
          >
            Add New Person
          </h1>

          <p
            className="
              mt-2
              text-[10px]
              font-bold
              uppercase
              tracking-[0.25em]
              text-slate-600/60 dark:text-slate-300/50
            "
          >
            Expand your lead database
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Manual Entry */}
          <div
            className="
              bg-white/70 dark:bg-white/[0.04]
              border border-slate-200/80 dark:border-white/10
              backdrop-blur-xl
              rounded-[24px]
              p-6 sm:p-8
              shadow-sm
              hover:shadow-md
              transition-all
            "
          >
            {/* Card Header */}
            <div
              className="
                flex items-center gap-3
                mb-8
                pb-4
                border-b border-slate-200/70 dark:border-white/10
              "
            >
              <div className="w-11 h-11 rounded-[14px] bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  edit_note
                </span>
              </div>

              <div>
                <h2
                  className="
                    text-lg
                    font-black
                    tracking-tight
                    text-slate-900 dark:text-white
                  "
                >
                  Manual Entry
                </h2>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mt-1">
                  Create user manually
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleManualSubmit} className="space-y-5">
              {/* Name */}
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
                    w-full p-4
                    bg-white/80 dark:bg-white/[0.03]
                    border border-slate-200 dark:border-white/10
                    rounded-[16px]
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

              {/* Phone */}
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
                    w-full p-4
                    bg-white/80 dark:bg-white/[0.03]
                    border border-slate-200 dark:border-white/10
                    rounded-[16px]
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

              {/* Email (Optional) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                  Email (Optional)
                </label>

                <input
                  type="email"
                  placeholder="Enter email address"
                  value={manualForm.email}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      email: e.target.value,
                    })
                  }
                  className="
                    w-full p-4
                    bg-white/80 dark:bg-white/[0.03]
                    border border-slate-200 dark:border-white/10
                    rounded-[16px]
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

              {/* Submit */}
              <button
                type="submit"
                disabled={manualLoading}
                className="
                  w-full
                  bg-primary
                  text-white
                  py-4
                  rounded-[16px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-xs
                  hover:brightness-110
                  transition-all
                  duration-200
                  cursor-pointer
                  shadow-lg
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {manualLoading ? 'PROCESSING...' : 'ADD TO SYSTEM'}
              </button>
            </form>
          </div>

          {/* Upload Card */}
          <div
            className="
              bg-white/70 dark:bg-white/[0.04]
              border border-slate-200/80 dark:border-white/10
              backdrop-blur-xl
              rounded-[24px]
              p-6 sm:p-8
              shadow-sm
              hover:shadow-md
              transition-all
            "
          >
            {/* Card Header */}
            <div
              className="
                flex items-center gap-3
                mb-8
                pb-4
                border-b border-slate-200/70 dark:border-white/10
              "
            >
              <div className="w-11 h-11 rounded-[14px] bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500 text-[22px]">
                  upload_file
                </span>
              </div>

              <div>
                <h2
                  className="
                    text-lg
                    font-black
                    tracking-tight
                    text-slate-900 dark:text-white
                  "
                >
                  Import Document
                </h2>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mt-1">
                  DOCX / XLSX / CSV
                </p>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 mb-6">
              Upload documents and automatically extract lead information into
              the system.
            </p>

            {/* Upload Form */}
            <form onSubmit={handleFileUpload} className="space-y-6">
              {/* Upload Area */}
              <div
                className={`
                  relative
                  border border-dashed
                  rounded-[20px]
                  p-8 sm:p-12
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
                      w-16 h-16
                      rounded-full
                      flex items-center justify-center
                      mb-4
                      ${
                        file
                          ? 'bg-emerald-500/15'
                          : 'bg-slate-200/60 dark:bg-white/[0.04]'
                      }
                    `}
                  >
                    <span
                      className={`
                        material-symbols-outlined
                        text-[32px]
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

              {/* Submit */}
              <button
                type="submit"
                disabled={!file || fileLoading}
                className="
                  w-full
                  bg-primary
                  text-white
                  py-4
                  rounded-[16px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-xs
                  hover:brightness-110
                  transition-all
                  duration-200
                  cursor-pointer
                  shadow-lg
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {fileLoading ? 'EXTRACTING...' : 'PROCESS FILE'}
              </button>
            </form>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="
              mt-8
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
      </div>
    </div>
  );
};

export default AddUserPage;