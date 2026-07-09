import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getVoiceSettings,
  updateVoiceSettings,
  resetVoiceSettings,
  uploadVoiceDocument,
  listVoiceDocuments,
  deleteVoiceDocument,
} from '../api';

// All 30 Chirp3 HD voices from Google TTS docs (June 2026)
// All work with all Indian locales (en-IN, hi-IN, mr-IN, etc.)
const VOICE_OPTIONS = {
  female: ['Achernar', 'Aoede', 'Autonoe', 'Callirrhoe', 'Despina', 'Erinome',
           'Gacrux', 'Kore', 'Laomedeia', 'Leda', 'Pulcherrima', 'Sulafat',
           'Umbriel', 'Vindemiatrix', 'Zephyr'],
  male:   ['Achird', 'Algenib', 'Algieba', 'Alnilam', 'Charon', 'Enceladus',
           'Fenrir', 'Iapetus', 'Orus', 'Puck', 'Rasalgethi', 'Sadachbia',
           'Sadaltager', 'Schedar', 'Zubenelgenubi'],
};
// Flat list used for validation in handleReset
const ALL_VOICE_NAMES = [...VOICE_OPTIONS.female, ...VOICE_OPTIONS.male];
// Default voice on reset
const DEFAULT_VOICE_NAME = 'Aoede';
const LANGUAGE_OPTIONS = [
  { value: 'default', label: 'Default (Auto-detect)' },
  { value: 'hinglish', label: 'Hinglish (Hindi + English)' },
  { value: 'hindi', label: 'Hindi Only' },
  { value: 'english', label: 'English Only' },
  { value: 'marathi', label: 'Marathi (मराठी)' },
];

const SECTOR_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'automotive', label: 'Automotive' },
];

const SECTOR_CONTEXT_PREVIEW = {
  real_estate: 'SECTOR: REAL ESTATE SALES\nGoals: Book site visit. Close on specific unit/configuration.\nKey terms: BHK, carpet area, possession date, RERA, floor plan, loan pre-approval.\nPitch angles: location advantage, amenities, price appreciation, limited availability, ready possession.\nUrgency triggers: "limited units at this price", "prices going up next month", "last few units left".\nQualifying questions: "Aapka budget kya hai?", "Ready possession chahiye ya under construction?", "2BHK ya 3BHK?"',
  insurance: 'SECTOR: INSURANCE SALES\nGoals: Schedule a detailed consultation call or close policy sale.\nKey terms: premium, coverage, claim settlement ratio, riders, 80C/80D tax benefit, maturity value.\nPitch angles: family protection, tax savings, high claim settlement ratio, low premium entry age.\nUrgency triggers: "premium increases with age", "open enrollment period ending".\nQualifying questions: "Aapki age kya hai?", "Term ya savings policy chahiye?", "Family cover chahiye?"',
  education: 'SECTOR: EDUCATION ENROLLMENT SALES\nGoals: Book a counselling session, campus visit, or application submission.\nKey terms: placement rate, accreditation, scholarship, batch deadline, EMI fee option.\nPitch angles: placement record, industry-recognised certification, affordable EMI.\nUrgency triggers: "batch is filling up", "scholarship deadline this Friday", "early bird discount expiring".',
  healthcare: 'SECTOR: HEALTHCARE SERVICES SALES\nGoals: Book appointment, health check package, or consultation.\nKey terms: specialist availability, insurance panel, diagnostic package, home collection.\nPitch angles: top specialist, quick appointment, insurance cashless, affordable health package.',
  financial_services: 'SECTOR: FINANCIAL SERVICES SALES\nGoals: Schedule a financial planning call or close investment/loan product.\nKey terms: returns, SIP, NAV, tenure, CIBIL score, interest rate, tax-saving.\nPitch angles: higher returns vs FD, tax saving under 80C, quick loan disbursal.\nUrgency triggers: "interest rates rising soon", "tax season ending".',
  automotive: 'SECTOR: AUTOMOTIVE SALES\nGoals: Book a test drive or close deal commitment.\nKey terms: ex-showroom price, EMI, exchange value, delivery timeline, warranty, variants.\nPitch angles: best-in-class mileage, safety rating, EMI starting price, exchange bonus, limited-time offer.\nUrgency triggers: "price revision next month", "festive offer ending", "last few units in this colour".',
};

const LANGUAGE_INSTRUCTION_PREVIEW = {
  default: 'LANGUAGE: Auto-detect from caller speech (English/Hindi/Marathi) and respond accordingly.',
  english: 'LANGUAGE: Always reply in clear, simple Indian English.',
  hindi: 'LANGUAGE: Always reply in Hindi (Devanagari script mixed with English technical terms).',
  hinglish: 'LANGUAGE: Always reply in Hinglish (Hindi words in Roman script mixed with English).',
  marathi: 'LANGUAGE: Reply in Marathi (Devanagari script with English for technical terms). Use formal "तुम्ही".',
};

const DYNAMIC_VARIABLES = [
  { token: '{customerName}', label: 'Customer Name', icon: 'person' },
  { token: '{agentName}', label: 'Agent Name', icon: 'support_agent' },
  { token: '{companyName}', label: 'Company Name', icon: 'business' },
  { token: '{projectData}', label: 'Project Data', icon: 'apartment' },
  { token: '{customerLocation}', label: 'Location', icon: 'location_on' },
];

const DEFAULT_PROMPT = `You are {agentName}, a confident and persuasive Indian sales executive calling on behalf of {companyName}.

CORE MISSION:
Your ONLY job is to PITCH the product or service, create interest, and convert the call into a concrete next step — site visit, demo, callback, or purchase intent. You are NOT a customer support agent. Never solve complaints. Always redirect to the pitch.

PERSONALITY & TONE:
- Confident, energetic, warm — like a top-performing Indian field sales rep
- Use "ji" to show respect. Be direct but never rude.
- Speak naturally like a real phone call — NOT like a bot reading a script
- If rejected once, acknowledge politely and try ONE more angle before accepting "not interested"
- Never be passive. Always drive the conversation forward.

SALES PLAYBOOK (follow this sequence):
1. OPEN: Greet and establish context — "Maine dekha aapne hamari ad mein interest show kiya tha"
2. HOOK: Lead with the strongest USP of the product in the first 2 sentences
3. QUALIFY: Ask 1-2 quick qualification questions (budget, timeline, requirement)
4. PITCH: Match their answers to the product benefits. Use specifics — prices, features, timelines.
5. CLOSE: Push for a concrete commitment — site visit, demo booking, or callback slot
6. HANDLE OBJECTION: If they hesitate, address with a counter-benefit or create urgency
7. WRAP: If truly not interested after 2 attempts, thank them and end gracefully

STRICT RULES:
- ONLY discuss the product/service described in the CAMPAIGN CONTEXT section below
- Never invent details, prices, or features not in the data
- If no product data is provided, ask open-ended questions to understand their need
- NEVER start a response with "Certainly!", "Of course!", "Great!", "Absolutely!" — sound natural
- Keep responses SHORT: 2-3 sentences max per turn. Phone calls are fast-paced.
- End every response with either a question (to keep conversation going) or a clear call-to-action

RESPONSE FORMAT:
- Plain spoken sentences. No bullet points, markdown, URLs, or formatting.
- Prices in Indian format: "aath lakh", "forty-five lakh", "1.2 crore"
- Each sentence ends with . or ? or !

CALL TERMINATION:
When appointment is confirmed OR customer says bye/not interested after your second attempt, end with [TERMINATE].
Example: "Perfect! Maine aapka Saturday 11 baje note kar liya. See you then! [TERMINATE]"
NEVER say "TERMINATE" aloud.`;

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
  const [language, setLanguage] = useState('default');
  const [sector, setSector] = useState('general');

  // Prompt preview state
  const [promptPreview, setPromptPreview] = useState('');
  const [isPreviewManuallyEdited, setIsPreviewManuallyEdited] = useState(false);

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
  const promptRef = useRef(null);
  const debounceRef = useRef(null);

  // Insert dynamic variable at cursor position in prompt textarea
  const insertVariable = (token) => {
    const textarea = promptRef.current;
    if (!textarea) {
      setCustomPrompt((prev) => prev + token);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = customPrompt.substring(0, start) + token + customPrompt.substring(end);
    setCustomPrompt(newValue);
    // Restore cursor position after the inserted token
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + token.length;
    }, 0);
  };

  // Load default prompt into textarea
  const loadDefaultPrompt = () => {
    setCustomPrompt(DEFAULT_PROMPT);
  };

  // Compose prompt preview from current settings
  const composePromptPreview = useCallback(() => {
    let preview = customPrompt || DEFAULT_PROMPT;

    // Sector context
    const sectorCtx = SECTOR_CONTEXT_PREVIEW[sector];
    if (sectorCtx && sector !== 'general') {
      preview += `\n\n${sectorCtx}`;
    }

    // Language instruction preview
    const langInstruction = LANGUAGE_INSTRUCTION_PREVIEW[language] || LANGUAGE_INSTRUCTION_PREVIEW['default'];
    preview += `\n\n${langInstruction}`;

    // Campaign context placeholder
    preview += `\n\n---\nCAMPAIGN-SPECIFIC CONTEXT:\n[Campaign-specific context will be appended here at call time from the active campaign configuration]`;

    return preview;
  }, [customPrompt, sector, language]);

  // Debounced auto-update of prompt preview when settings change
  useEffect(() => {
    if (isPreviewManuallyEdited) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setPromptPreview(composePromptPreview());
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [composePromptPreview, isPreviewManuallyEdited]);

  // Handle manual edit of prompt preview
  const handlePreviewEdit = (e) => {
    setPromptPreview(e.target.value);
    setIsPreviewManuallyEdited(true);
  };

  // Reset prompt preview to auto-generated
  const resetPreviewToAutoGenerated = () => {
    setIsPreviewManuallyEdited(false);
    setPromptPreview(composePromptPreview());
  };

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
      setLanguage(data.language || 'default');
      setSector(data.sector || 'general');
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

    // If the preview was manually edited, use it as the customPrompt
    const finalPrompt = isPreviewManuallyEdited ? promptPreview : customPrompt;

    try {
      await updateVoiceSettings({
        customPrompt: finalPrompt,
        selectedVoice,
        greetingLine,
        companyName,
        agentName,
        language,
        sector,
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
      setLanguage('default');
      setSector('general');
      setIsPreviewManuallyEdited(false);
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

      {/* Voice Selection — all 30 Chirp3 HD voices, grouped by gender */}
      <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            TTS Voice
          </label>
          <span className="text-[10px] font-bold text-slate-400">
            {selectedVoice} · {VOICE_OPTIONS.female.includes(selectedVoice) ? 'Female' : 'Male'} · Indian accent
          </span>
        </div>

        {/* Female voices */}
        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[13px]">face_3</span>Female
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 mb-4">
          {VOICE_OPTIONS.female.map((voice) => (
            <button
              key={voice}
              onClick={() => setSelectedVoice(voice)}
              className={`rounded-[12px] border px-2 py-2 text-[11px] font-medium transition-all ${
                selectedVoice === voice
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:border-primary/40'
              }`}
            >
              {voice}
            </button>
          ))}
        </div>

        {/* Male voices */}
        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[13px]">face</span>Male
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {VOICE_OPTIONS.male.map((voice) => (
            <button
              key={voice}
              onClick={() => setSelectedVoice(voice)}
              className={`rounded-[12px] border px-2 py-2 text-[11px] font-medium transition-all ${
                selectedVoice === voice
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:border-primary/40'
              }`}
            >
              {voice}
            </button>
          ))}
        </div>

        <p className="mt-3 text-[10px] font-bold text-slate-400">
          All voices support Indian accent for en-IN, hi-IN, mr-IN and other Indian locales.
        </p>
        {errors.selectedVoice && (
          <p className="mt-2 text-[11px] font-bold text-red-500">{errors.selectedVoice}</p>
        )}
      </div>

      {/* Language & Sector Selectors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Language Preference */}
        <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[10px] font-bold text-slate-400">
            Controls the AI agent's response language
          </p>
        </div>

        {/* Sector Selector */}
        <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Business Sector
          </label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
          >
            {SECTOR_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[10px] font-bold text-slate-400">
            Adds industry-specific vocabulary and objectives to the AI prompt
          </p>
          {errors.sector && (
            <p className="mt-1 text-[11px] font-bold text-red-500">{errors.sector}</p>
          )}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Custom System Prompt
          </label>
          <button
            onClick={loadDefaultPrompt}
            className="flex items-center gap-1 rounded-[10px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 transition-all hover:border-primary hover:text-primary"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            Load Default Prompt
          </button>
        </div>

        {/* Dynamic Variable Chips */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Insert:
          </span>
          {DYNAMIC_VARIABLES.map((v) => (
            <button
              key={v.token}
              onClick={() => insertVariable(v.token)}
              className="flex items-center gap-1 rounded-[8px] border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary transition-all hover:bg-primary/10 hover:border-primary/40"
            >
              <span className="material-symbols-outlined text-[13px]">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>

        <textarea
          ref={promptRef}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={DEFAULT_PROMPT}
          rows={10}
          maxLength={5000}
          className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400/60 placeholder:text-[11px] outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 resize-y font-mono"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400">
            {customPrompt.length}/5000 characters
          </span>
          {errors.customPrompt && (
            <span className="text-[11px] font-bold text-red-500">{errors.customPrompt}</span>
          )}
        </div>

        {/* Auto-appended sections info */}
        <div className="mt-3 rounded-[10px] border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[16px] mt-0.5">info</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400">
                Auto-appended to your prompt
              </p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                The system automatically adds: language instructions, customer context ({'{customerName}'}, location), 
                call history with this customer, project data (prices, BHK, amenities), and your uploaded knowledge base documents. 
                You don't need to include these in your prompt.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Name, Agent Name & Greeting */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Company Name */}
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

        {/* Agent Name */}
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

      {/* Prompt Preview */}
      <div className="rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl p-6 shadow-sm">        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">preview</span>
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              Prompt Preview
            </label>
            {isPreviewManuallyEdited && (
              <span className="rounded-[6px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                Manually Edited
              </span>
            )}
          </div>
          {isPreviewManuallyEdited && (
            <button
              onClick={resetPreviewToAutoGenerated}
              className="flex items-center gap-1 rounded-[10px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 transition-all hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Reset to Auto-Generated
            </button>
          )}
        </div>

        <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          This is the composed system prompt that will be sent to the AI at call time. 
          It auto-updates based on your settings above. You can also edit it directly — edited content will be saved as your custom prompt.
        </p>

        <textarea
          value={promptPreview}
          onChange={handlePreviewEdit}
          rows={14}
          className="w-full rounded-[14px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 resize-y font-mono"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400">
            {promptPreview.length} characters
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {isPreviewManuallyEdited ? 'This edited content will be saved as your prompt' : 'Auto-composed from settings above'}
          </span>
        </div>
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
