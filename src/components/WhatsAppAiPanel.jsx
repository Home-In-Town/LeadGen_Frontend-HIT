/**
 * WhatsAppAiPanel.jsx
 *
 * Standalone panel for WhatsApp AI auto-reply settings.
 * - Locked (disabled toggle) when WhatsApp is not connected
 * - Unlocked and fully editable when WA is connected
 * - Toggle, reply-delay selector, and editable custom prompt
 * - Saves via PUT /api/voice/settings
 */
import { useState, useEffect, useRef } from 'react';
import { getVoiceSettings, updateVoiceSettings, getChannelStatus } from '../api';
import { useNavigate } from 'react-router-dom';

// ── Delay options ─────────────────────────────────────────────────────────────
const DELAY_OPTIONS = [
  { value: 60000,   label: '1 minute' },
  { value: 180000,  label: '3 minutes' },
  { value: 300000,  label: '5 minutes (recommended)' },
  { value: 600000,  label: '10 minutes' },
  { value: 900000,  label: '15 minutes' },
  { value: 1800000, label: '30 minutes' },
];

const DEFAULT_WA_PROMPT = `You are a WhatsApp sales assistant. Keep replies SHORT (1-3 sentences max).

YOUR GOALS:
1. Book a meeting / site visit — get a confirmed date and time
2. Pitch the product — highlight key benefits relevant to their question
3. Answer questions warmly and keep the conversation moving forward

RULES:
- Sound human, warm, professional. Never mention you are an AI.
- Always end with a question or clear next step.
- If they want to meet, immediately propose a specific time slot.
- If they ask price, give a range and pivot to booking a visit.
- Never use bullet points or markdown — plain conversational text only.
- Reply in the same language the customer uses (Hindi/Hinglish/English/Marathi).`;

// ── Small reusable toast ───────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  const colors = type === 'error'
    ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300'
    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  const icon = type === 'error' ? 'error' : 'check_circle';
  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in">
      <div className={`flex items-center gap-3 rounded-[14px] border px-5 py-3 shadow-lg backdrop-blur-xl ${colors}`}>
        <span className="material-symbols-outlined">{icon}</span>
        <span className="text-sm font-bold">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-7 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 ${
      disabled
        ? 'cursor-not-allowed bg-slate-200 dark:bg-slate-700 opacity-50'
        : checked
          ? 'bg-[#25D366]'
          : 'bg-slate-300 dark:bg-slate-600'
    }`}
    style={{ width: '52px' }}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
        checked && !disabled ? 'translate-x-7' : 'translate-x-1'
      }`}
    />
  </button>
);

// ── Main component ────────────────────────────────────────────────────────────
const WhatsAppAiPanel = () => {
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────────────────────────────────
  const [waConnected, setWaConnected]           = useState(null);   // null=loading, true, false
  const [enabled, setEnabled]                   = useState(false);
  const [delayMs, setDelayMs]                   = useState(300000); // default 5 min
  const [prompt, setPrompt]                     = useState('');

  const [loading, setLoading]                   = useState(true);
  const [checkingWa, setCheckingWa]             = useState(true);
  const [saving, setSaving]                     = useState(false);
  const [toast, setToast]                       = useState(null);   // { message, type }

  const promptRef = useRef(null);
  const toastTimer = useRef(null);

  // ── Show toast helper ───────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  // ── Load settings + WA status in parallel ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [settingsRes, channelRes] = await Promise.allSettled([
          getVoiceSettings(),
          getChannelStatus(),
        ]);

        if (cancelled) return;

        // Voice settings
        if (settingsRes.status === 'fulfilled') {
          const data = settingsRes.value.data?.data || settingsRes.value.data || {};
          setEnabled(data.whatsappAiEnabled === true);
          setDelayMs(data.whatsappAiDelayMs || 300000);
          setPrompt(data.whatsappAiPrompt || '');
        }

        // Channel status — only lock when explicitly false (connected = false)
        if (channelRes.status === 'fulfilled') {
          const d = channelRes.value.data;
          setWaConnected(d?.success && d?.whatsapp === true ? true : false);
        } else {
          // API error — don't block the UI; treat as unknown (allow interaction)
          setWaConnected(null);
        }
      } catch (err) {
        console.error('WhatsAppAiPanel load error:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCheckingWa(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVoiceSettings({
        whatsappAiEnabled: enabled,
        whatsappAiDelayMs: delayMs,
        whatsappAiPrompt:  prompt.trim(),
      });
      showToast('WhatsApp AI settings saved!');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.whatsappAiPrompt || 'Failed to save. Please try again.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const isLocked = waConnected === false; // only lock when definitively not connected

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-[#25D366] border-t-transparent animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Loading WhatsApp AI Settings...
          </p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in space-y-5 pb-10">

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header card ─────────────────────────────────────────────────────── */}
      <div className="rounded-[22px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#25D366]/10 flex-shrink-0">
              <span className="material-symbols-outlined text-[28px] text-[#25D366]">smart_toy</span>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                WhatsApp AI Auto-Reply
              </h2>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                Powered by Groq · llama-3.3-70b
              </p>
            </div>
          </div>

          {/* WA connection status badge */}
          <div className="flex items-center gap-2">
            {checkingWa ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className="h-3 w-3 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
                Checking WhatsApp...
              </span>
            ) : waConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp Connected
              </span>
            ) : (
              <button
                onClick={() => navigate('/whatsapp-setup')}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-50 dark:bg-amber-900/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[13px]">warning</span>
                Connect WhatsApp →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Not connected warning ────────────────────────────────────────────── */}
      {isLocked && (
        <div className="rounded-[16px] border border-amber-400/30 bg-amber-50 dark:bg-amber-900/10 px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500 text-[22px] mt-0.5 flex-shrink-0">lock</span>
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              WhatsApp is not connected
            </p>
            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              You need to connect a WhatsApp Business number before enabling AI auto-reply.{' '}
              <button
                onClick={() => navigate('/whatsapp-setup')}
                className="text-[#25D366] font-bold underline hover:no-underline"
              >
                Go to WhatsApp Setup →
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ── Master toggle card ───────────────────────────────────────────────── */}
      <div className={`rounded-[22px] border bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm transition-all ${
        isLocked
          ? 'border-slate-200/50 dark:border-white/5 opacity-60'
          : enabled
            ? 'border-[#25D366]/30 dark:border-[#25D366]/20'
            : 'border-slate-200/70 dark:border-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-[22px] ${enabled && !isLocked ? 'text-[#25D366]' : 'text-slate-400'}`}>
              {enabled && !isLocked ? 'toggle_on' : 'toggle_off'}
            </span>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                AI Auto-Reply
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isLocked
                  ? 'Connect WhatsApp to enable'
                  : enabled
                    ? 'Active — AI will reply if no manual response within the delay window'
                    : 'Disabled — enable to let AI reply to incoming WhatsApp messages'}
              </p>
            </div>
          </div>

          <Toggle
            checked={enabled}
            onChange={setEnabled}
            disabled={isLocked}
          />
        </div>

        {/* How it works — shown when enabled */}
        {enabled && !isLocked && (
          <div className="mt-4 rounded-[12px] border border-[#25D366]/20 bg-[#25D366]/5 px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-[#25D366] text-[16px] mt-0.5 flex-shrink-0">info</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
              <p>
                <strong>How it works:</strong> When a WhatsApp message arrives, a timer starts.
                If no team member replies manually within the delay window, the AI sends a reply automatically.
              </p>
              <p>
                Manual replies always cancel the AI timer. The AI focuses on:{' '}
                <strong>booking visits · pitching your product · answering questions</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Settings cards (only when enabled + connected) ───────────────────── */}
      {enabled && !isLocked && (
        <>
          {/* ── Reply Delay ─────────────────────────────────────────────────── */}
          <div className="rounded-[22px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#25D366] text-[20px]">timer</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                  Reply Delay
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  How long to wait after receiving a message before AI responds
                </p>
              </div>
            </div>

            {/* Pill selector */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {DELAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDelayMs(opt.value)}
                  className={`rounded-[12px] border px-3 py-2.5 text-[11px] font-bold text-center transition-all ${
                    delayMs === opt.value
                      ? 'border-[#25D366] bg-[#25D366]/10 text-[#25D366] shadow-sm'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:border-[#25D366]/40 hover:text-[#25D366]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
              <p className="text-[10px] font-bold text-slate-400">
                Currently set to{' '}
                <span className="text-[#25D366]">
                  {DELAY_OPTIONS.find(o => o.value === delayMs)?.label || `${delayMs / 60000} minutes`}
                </span>
              </p>
            </div>
          </div>

          {/* ── Custom Prompt ────────────────────────────────────────────────── */}
          <div className="rounded-[22px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#25D366] text-[20px]">edit_note</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                    WhatsApp AI Prompt
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Instructions for how the AI should respond (optional — leave blank to use Voice Settings prompt)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrompt(DEFAULT_WA_PROMPT)}
                className="flex items-center gap-1.5 rounded-[10px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 transition-all hover:border-[#25D366] hover:text-[#25D366] flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">content_paste</span>
                Load default
              </button>
            </div>

            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={DEFAULT_WA_PROMPT}
              rows={10}
              maxLength={2000}
              className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400/50 placeholder:text-[11px] outline-none transition-all focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/10 resize-y font-mono leading-relaxed"
            />

            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400">
                {prompt.length}/2000 characters
              </p>
              {prompt.length === 0 && (
                <span className="text-[10px] font-bold text-slate-400">
                  Blank = uses your Voice Settings custom prompt
                </span>
              )}
            </div>

            {/* Auto-injected context note */}
            <div className="mt-3 rounded-[10px] border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[16px] mt-0.5 flex-shrink-0">auto_awesome</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400 mb-1">
                  Automatically injected at reply time
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  The system adds: <strong>customer name · phone · location · lead score · interest level · last 15 messages of conversation history</strong>. You don't need to add these yourself.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Save button ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || isLocked}
          className="flex items-center gap-2 rounded-[14px] bg-[#25D366] px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#25D366]/20 transition-all hover:-translate-y-px hover:shadow-xl hover:shadow-[#25D366]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {saving ? (
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">save</span>
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {isLocked && (
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Connect WhatsApp first to save
          </p>
        )}
      </div>
    </div>
  );
};

export default WhatsAppAiPanel;
