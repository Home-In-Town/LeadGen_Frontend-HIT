import { useState, useEffect, useRef } from 'react';
import {
  getVoiceSettings,
  updateVoiceSettings,
  resetVoiceSettings,
  uploadVoiceDocument,
  listVoiceDocuments,
  deleteVoiceDocument,
} from '../api';

const VOICE_OPTIONS = ['Aoede', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda'];

const SuccessToast = ({ message, onClose }) => (
  <div className="fixed top-6 right-6 z-50 animate-fade-in">
    <div className="flex items-center gap-3 rounded-[14px] border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 shadow-lg backdrop-blur-xl">
      <span className="material-symbols-outlined text-emerald-500">check_circle</span>
      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{message}</span>
      <button onClick={onClose} className="ml-2 text-emerald-500 hover:text-emerald-700">
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  </div>
);

const VoiceSettingsPanel = () => {
  // Form state
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Aoede');
  const [greetingLine, setGreetingLine] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [agentName, setAgentName] = useState('');

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingDocId, setDeletingDocId] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
    fetchDocuments();
  }, []);

  // Auto-dismiss success toast
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchSettings = async () => {
    try {
      const res = await getVoiceSettings();
      const data = res.data?.data || res.data || {};
      setCustomPrompt(data.customPrompt || '');
      setSelectedVoice(data.selectedVoice || 'Aoede');
      setGreetingLine(data.greetingLine || '');
      setCompanyName(data.companyName || '');
      setAgentName(data.agentName || '');
    } catch (err) {
      console.error('Failed to fetch voice settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await listVoiceDocuments();
      setDocuments(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});

    try {
      await updateVoiceSettings({
        customPrompt,
        selectedVoice,
        greetingLine,
        companyName,
        agentName,
      });
      setSuccessMessage('Settings saved successfully!');
    } catch (err) {
      if (err.response?.status === 400) {
        const responseErrors = err.response.data?.errors || {};
        const message = err.response.data?.message;
        if (Object.keys(responseErrors).length > 0) {
          setErrors(responseErrors);
        } else if (message) {
          setErrors({ general: message });
        }
      } else {
        setErrors({ general: 'Failed to save settings. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setErrors({});

    try {
      await resetVoiceSettings();
      setCustomPrompt('');
      setSelectedVoice('Aoede');
      setGreetingLine('');
      setCompanyName('');
      setAgentName('');
      setSuccessMessage('Settings reset to defaults!');
    } catch (err) {
      setErrors({ general: 'Failed to reset settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadProgress(true);

    try {
      await uploadVoiceDocument(file);
      await fetchDocuments();
      setSuccessMessage('Document uploaded successfully!');
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to upload document. Please try again.';
      setUploadError(message);
    } finally {
      setUploadProgress(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDocument = async (docId) => {
    setDeletingDocId(docId);

    try {
      await deleteVoiceDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.documentId !== docId));
      setSuccessMessage('Document deleted.');
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setDeletingDocId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Loading Voice Settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Success Toast */}
      {successMessage && (
        <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />
      )}

      {/* General Error */}
      {errors.general && (
        <div className="rounded-[14px] border border-red-500/20 bg-red-500/10 px-5 py-3">
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{errors.general}</p>
        </div>
      )}

      {/* Custom Prompt */}
      <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
        <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Custom System Prompt
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Enter your custom AI agent prompt... (max 5000 characters)"
          rows={6}
          maxLength={5000}
          className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 resize-y"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400">
            {customPrompt.length}/5000 characters
          </span>
          {errors.customPrompt && (
            <span className="text-[11px] font-bold text-red-500">{errors.customPrompt}</span>
          )}
        </div>
      </div>

      {/* Voice Selection & Greeting */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Voice Selection */}
        <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            TTS Voice
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
          >
            {VOICE_OPTIONS.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
          {errors.selectedVoice && (
            <p className="mt-2 text-[11px] font-bold text-red-500">{errors.selectedVoice}</p>
          )}
        </div>

        {/* Greeting Line */}
        <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Greeting Line
          </label>
          <input
            type="text"
            value={greetingLine}
            onChange={(e) => setGreetingLine(e.target.value)}
            placeholder="Hello {customerName}, this is {agentName} from {companyName}!"
            maxLength={500}
            className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <p className="mt-2 text-[10px] font-bold text-slate-400">
            Use {'{customerName}'}, {'{agentName}'}, {'{companyName}'} as placeholders
          </p>
          {errors.greetingLine && (
            <p className="mt-1 text-[11px] font-bold text-red-500">{errors.greetingLine}</p>
          )}
        </div>
      </div>

      {/* Company Name & Agent Name */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company name"
            maxLength={200}
            className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          {errors.companyName && (
            <p className="mt-2 text-[11px] font-bold text-red-500">{errors.companyName}</p>
          )}
        </div>

        <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Agent Name
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Priya"
            maxLength={100}
            className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          {errors.agentName && (
            <p className="mt-2 text-[11px] font-bold text-red-500">{errors.agentName}</p>
          )}
        </div>
      </div>

      {/* Document Upload */}
      <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">description</span>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Knowledge Base Documents
          </span>
        </div>

        {/* Upload Area */}
        <div
          onClick={() => !uploadProgress && fileInputRef.current?.click()}
          className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-8 transition-all hover:border-primary hover:bg-primary/5"
        >
          {uploadProgress ? (
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Uploading...
              </span>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined mb-2 text-3xl text-slate-400 dark:text-slate-500">
                cloud_upload
              </span>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Click to upload a document
              </p>
              <p className="mt-1 text-[10px] font-bold text-slate-400">
                PDF or TXT files, max 5MB
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-2">
            <p className="text-[11px] font-bold text-red-600 dark:text-red-400">{uploadError}</p>
          </div>
        )}

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.documentId}
                className="flex items-center justify-between rounded-[12px] border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    article
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {doc.fileName}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Uploaded {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.documentId)}
                  disabled={deletingDocId === doc.documentId}
                  className="ml-3 flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                >
                  {deletingDocId === doc.documentId ? (
                    <div className="h-4 w-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-[14px] bg-primary px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-px hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">save</span>
          )}
          Save Settings
        </button>

        <button
          onClick={handleReset}
          disabled={saving}
          className="flex items-center gap-2 rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300 transition-all hover:-translate-y-px hover:border-red-300 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          Reset to Default
        </button>
      </div>
    </div>
  );
};

export default VoiceSettingsPanel;
