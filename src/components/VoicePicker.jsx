/**
 * VoicePicker.jsx
 *
 * Reusable, self-contained voice selection UI.
 * Used by both the owner-level Voice Settings and the Phase-2 Project Settings page.
 *
 * Controlled component:
 *   - value: current selectedVoice string ('' = inherit owner default, 'sarvam:priya', 'Aoede', etc.)
 *   - onChange(newVoice): called when a voice is picked
 *   - allowInherit: when true, shows an "Inherit owner default" option (used by project settings)
 *
 * Voice lists mirror VoiceSettingsPanel exactly (30 Google Chirp3 HD + Sarvam bulbul:v3).
 */

// ── Google Chirp3 HD voices ─────────────────────────────────────────────────
export const VOICE_OPTIONS = {
  female: ['Achernar', 'Aoede', 'Autonoe', 'Callirrhoe', 'Despina', 'Erinome',
           'Gacrux', 'Kore', 'Laomedeia', 'Leda', 'Pulcherrima', 'Sulafat',
           'Umbriel', 'Vindemiatrix', 'Zephyr'],
  male:   ['Achird', 'Algenib', 'Algieba', 'Alnilam', 'Charon', 'Enceladus',
           'Fenrir', 'Iapetus', 'Orus', 'Puck', 'Rasalgethi', 'Sadachbia',
           'Sadaltager', 'Schedar', 'Zubenelgenubi'],
};

// ── Sarvam bulbul:v3 voices (stored with "sarvam:" prefix) ───────────────────
export const SARVAM_VOICES = {
  female: ['ritu', 'priya', 'neha', 'pooja', 'simran', 'kavya', 'ishita',
           'shreya', 'roopa', 'tanya', 'shruti', 'suhani', 'kavitha', 'rupali'],
  male:   ['shubh', 'aditya', 'rahul', 'rohan', 'amit', 'dev', 'ratan',
           'varun', 'manan', 'sumit', 'kabir', 'aayan', 'ashutosh', 'advait',
           'anand', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'mohit',
           'rehan', 'soham'],
};

export const DEFAULT_SARVAM_VOICE = 'sarvam:priya';
export const DEFAULT_GOOGLE_VOICE = 'Aoede';

export const LANGUAGE_OPTIONS = [
  { value: 'default', label: 'Default (Auto-detect)' },
  { value: 'hinglish', label: 'Hinglish (Hindi + English)' },
  { value: 'hindi', label: 'Hindi Only' },
  { value: 'english', label: 'English Only' },
  { value: 'marathi', label: 'Marathi (मराठी)' },
];

export const SECTOR_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'automotive', label: 'Automotive' },
];

export const isSarvamVoice = (v) => typeof v === 'string' && v.startsWith('sarvam:');
export const sarvamDisplayName = (v) => v?.replace('sarvam:', '') || '';

/**
 * VoicePicker — provider tabs (Sarvam / Google) + voice grid.
 *
 * @param {string}   value        - current selectedVoice
 * @param {Function} onChange     - (voice: string) => void
 * @param {boolean}  [allowInherit=false] - show "Inherit owner default" option
 */
export default function VoicePicker({ value, onChange, allowInherit = false }) {
  // When inheriting (empty value), treat as "not selected"; provider tabs still work.
  const inheriting = allowInherit && (!value || value === '');
  // For provider tab highlighting, fall back to Sarvam view when inheriting.
  const effectiveVoice = inheriting ? DEFAULT_SARVAM_VOICE : value;
  const usingSarvam = isSarvamVoice(effectiveVoice);

  return (
    <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
            Voice
          </label>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {inheriting
              ? 'Inheriting your account default voice'
              : usingSarvam
                ? `Sarvam · ${sarvamDisplayName(effectiveVoice)} · Indian AI voice`
                : `Google Chirp3 HD · ${effectiveVoice} · ${VOICE_OPTIONS.female.includes(effectiveVoice) ? 'Female' : 'Male'}`}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
          usingSarvam
            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
            : 'bg-primary/10 text-primary'
        }`}>
          <span className="material-symbols-outlined text-[12px]">
            {usingSarvam ? 'record_voice_over' : 'voice_chat'}
          </span>
          {usingSarvam ? 'Sarvam bulbul:v3' : 'Google Chirp3 HD'}
        </span>
      </div>

      {/* Inherit option (project-level only) */}
      {allowInherit && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={`w-full mb-3 rounded-[12px] border px-4 py-2.5 text-[11px] font-bold transition-all ${
            inheriting
              ? 'border-primary bg-primary/10 text-primary shadow-sm'
              : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:border-primary/40'
          }`}
        >
          Inherit account default voice
        </button>
      )}

      {/* Provider toggle */}
      <div className="mb-4 flex gap-2 rounded-[12px] bg-slate-100 dark:bg-white/[0.04] p-1">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_SARVAM_VOICE)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-[10px] px-4 py-2.5 text-center transition-all ${
            !inheriting && usingSarvam ? 'bg-white dark:bg-white/[0.08] shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          style={!inheriting && usingSarvam ? { color: '#ea580c' } : {}}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Sarvam</span>
          <span className="text-[9px] font-bold text-slate-400">Premium · Indian AI</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_GOOGLE_VOICE)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-[10px] px-4 py-2.5 text-center transition-all ${
            !inheriting && !usingSarvam ? 'bg-white dark:bg-white/[0.08] text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Google</span>
          <span className="text-[9px] font-bold text-slate-400">Standard · Chirp3 HD</span>
        </button>
      </div>

      {/* Sarvam voices */}
      {!inheriting && usingSarvam && (
        <div>
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">face_3</span>Female
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 mb-4">
            {SARVAM_VOICES.female.map((v) => {
              const key = `sarvam:${v}`;
              return (
                <button key={key} type="button" onClick={() => onChange(key)}
                  className={`rounded-[12px] border px-2 py-2 text-[11px] font-medium capitalize transition-all ${
                    value === key
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:border-orange-300 hover:text-orange-600'
                  }`}>
                  {v}
                </button>
              );
            })}
          </div>
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">face</span>Male
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {SARVAM_VOICES.male.map((v) => {
              const key = `sarvam:${v}`;
              return (
                <button key={key} type="button" onClick={() => onChange(key)}
                  className={`rounded-[12px] border px-2 py-2 text-[11px] font-medium capitalize transition-all ${
                    value === key
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:border-orange-300 hover:text-orange-600'
                  }`}>
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Google Chirp3 HD voices */}
      {!inheriting && !usingSarvam && (
        <div>
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">face_3</span>Female
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 mb-4">
            {VOICE_OPTIONS.female.map((voice) => (
              <button key={voice} type="button" onClick={() => onChange(voice)}
                className={`rounded-[12px] border px-2 py-2 text-[11px] font-medium transition-all ${
                  value === voice
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:border-primary/40'
                }`}>
                {voice}
              </button>
            ))}
          </div>
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">face</span>Male
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {VOICE_OPTIONS.male.map((voice) => (
              <button key={voice} type="button" onClick={() => onChange(voice)}
                className={`rounded-[12px] border px-2 py-2 text-[11px] font-medium transition-all ${
                  value === voice
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:border-primary/40'
                }`}>
                {voice}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
