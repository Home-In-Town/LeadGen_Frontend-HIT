/**
 * WhatsAppTemplatesPage.jsx
 * Full Meta-parity WhatsApp template builder.
 * Supports: all header types (text/image/video/document), body variables,
 * footer, all button types (quick reply, URL, phone, copy code), live preview.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { listWATemplates, createWATemplate, deleteWATemplate } from '../api';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES   = ['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'PAUSED'];
const CATEGORIES = ['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'];
const LANGUAGES  = [
  { value: 'en',    label: 'English' },
  { value: 'en_IN', label: 'English (India)' },
  { value: 'hi',    label: 'Hindi' },
  { value: 'mr',    label: 'Marathi' },
];
const BTN_TYPES = ['QUICK_REPLY', 'URL', 'PHONE_NUMBER', 'COPY_CODE'];

const STATUS_STYLES = {
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  PENDING:  'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300',
  REJECTED: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300',
  PAUSED:   'bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-400',
};

const BLANK_FORM = {
  name: '', category: 'MARKETING', language: 'en',
  headerType: 'NONE', headerText: '', headerMediaUrl: '',
  bodyText: '', bodyExamples: [],
  footerText: '',
  buttons: [],
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const card  = 'bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[24px] shadow-sm';
const inp   = 'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-[#25D366] transition-all';
const label = 'block text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-1';

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Replace {{N}} with bold example values for preview */
function applyVars(text, examples) {
  if (!text) return '';
  return text.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const ex = examples?.[parseInt(n, 10) - 1];
    return ex ? `*${ex}*` : `{{${n}}}`;
  });
}

/** Extract unique {{N}} placeholders from text */
function extractVarIndices(text) {
  const found = new Set();
  let m;
  const re = /\{\{(\d+)\}\}/g;
  while ((m = re.exec(text)) !== null) found.add(parseInt(m[1], 10));
  return [...found].sort((a, b) => a - b);
}

/** Build Meta components[] array from form state */
function buildComponents(form) {
  const comps = [];

  // Header
  if (form.headerType === 'TEXT' && form.headerText.trim()) {
    comps.push({ type: 'HEADER', format: 'TEXT', text: form.headerText.trim() });
  } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerType) && form.headerMediaUrl.trim()) {
    const mediaKey = form.headerType.toLowerCase() + 's'; // images / videos / documents
    comps.push({
      type: 'HEADER', format: form.headerType,
      example: { header_handle: [form.headerMediaUrl.trim()] }
    });
  }

  // Body
  if (form.bodyText.trim()) {
    const bodyComp = { type: 'BODY', text: form.bodyText.trim() };
    const indices = extractVarIndices(form.bodyText);
    if (indices.length > 0) {
      bodyComp.example = {
        body_text: [indices.map(i => form.bodyExamples[i - 1] || `example${i}`)]
      };
    }
    comps.push(bodyComp);
  }

  // Footer
  if (form.footerText.trim()) {
    comps.push({ type: 'FOOTER', text: form.footerText.trim() });
  }

  // Buttons
  if (form.buttons.length > 0) {
    const buttons = form.buttons.map(btn => {
      if (btn.type === 'QUICK_REPLY')   return { type: 'QUICK_REPLY', text: btn.text };
      if (btn.type === 'URL')           return { type: 'URL', text: btn.text, url: btn.url };
      if (btn.type === 'PHONE_NUMBER')  return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.phone };
      if (btn.type === 'COPY_CODE')     return { type: 'COPY_CODE', example: [btn.code || '123456'] };
      return null;
    }).filter(Boolean);
    if (buttons.length) comps.push({ type: 'BUTTONS', buttons });
  }

  return comps;
}

// ─── WhatsApp Preview ─────────────────────────────────────────────────────────
function WAPreview({ form }) {
  const hasBody    = !!form.bodyText.trim();
  const hasFooter  = !!form.footerText.trim();
  const hasButtons = form.buttons.length > 0;

  const previewBody = applyVars(form.bodyText, form.bodyExamples);

  // Extract domain from URL button for display (like real WA shows "www.homeintown.in")
  const urlBtn = form.buttons.find(b => b.type === 'URL' && b.url);
  let urlDomain = '';
  if (urlBtn?.url) {
    try { urlDomain = new URL(urlBtn.url).hostname; } catch { urlDomain = urlBtn.url; }
  }

  return (
    <div className="sticky top-4">
      <p className={`${label} mb-3`}>Live Preview</p>

      {/* Phone frame */}
      <div className="rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden max-w-[280px] mx-auto">

        {/* WhatsApp header bar */}
        <div className="bg-[#075E54] px-3 py-2.5 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-white text-base">arrow_back</span>
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-sm">storefront</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold leading-none truncate">
              {form.name ? form.name.replace(/_/g, ' ') : 'Your Business'}
            </p>
            <p className="text-[10px] text-emerald-300 leading-none mt-0.5">Online</p>
          </div>
          <span className="material-symbols-outlined text-white text-base">more_vert</span>
        </div>

        {/* Chat wallpaper — exact WA pattern bg */}
        <div className="bg-[#ECE5DD] relative" style={{
          minHeight: '280px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9b99a' fill-opacity='0.15'%3E%3Cpath d='M30 0C13.4 0 0 13.4 0 30s13.4 30 30 30 30-13.4 30-30S46.6 0 30 0zm0 4c14.4 0 26 11.6 26 26S44.4 56 30 56 4 44.4 4 30 15.6 4 30 4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}>
          <div className="p-3 pt-4">

            {/* Date chip */}
            <div className="flex justify-center mb-3">
              <span className="bg-white/80 text-[9px] font-bold text-slate-600 px-3 py-1 rounded-full shadow-sm">
                Today
              </span>
            </div>

            {/* Message card */}
            <div className="max-w-[85%] ml-auto">
              <div className="bg-white rounded-2xl rounded-tr-sm overflow-hidden shadow-sm">

                {/* Image header */}
                {form.headerType === 'IMAGE' && (
                  <div className="relative w-full bg-slate-200" style={{ height: '140px' }}>
                    {form.headerMediaUrl ? (
                      <img
                        src={form.headerMediaUrl}
                        alt="header"
                        className="w-full h-full object-cover"
                        onError={e => { e.target.parentNode.style.background = '#c8d6df'; e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#c8d6df]">
                        <span className="material-symbols-outlined text-white text-4xl">image</span>
                        <p className="text-white text-[10px] font-bold mt-1">Image preview</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Video header */}
                {form.headerType === 'VIDEO' && (
                  <div className="w-full bg-slate-800 flex items-center justify-center" style={{ height: '120px' }}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-2xl">play_arrow</span>
                      </div>
                      <p className="text-white text-[9px]">Video</p>
                    </div>
                  </div>
                )}

                {/* Document header */}
                {form.headerType === 'DOCUMENT' && (
                  <div className="flex items-center gap-2 px-3 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-white text-sm">description</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 truncate">Document.pdf</p>
                  </div>
                )}

                {/* Text header */}
                {form.headerType === 'TEXT' && form.headerText && (
                  <div className="px-3 pt-3">
                    <p className="text-sm font-black text-slate-900 leading-tight">{form.headerText}</p>
                  </div>
                )}

                {/* URL domain line (like WA shows "www.homeintown.in") */}
                {urlDomain && (
                  <div className="px-3 pt-2">
                    <p className="text-[10px] text-[#128C7E]">{urlDomain}</p>
                  </div>
                )}

                {/* Body */}
                <div className="px-3 py-2">
                  {hasBody
                    ? <p className="text-[12px] text-slate-800 leading-relaxed whitespace-pre-wrap">{previewBody}</p>
                    : <p className="text-[12px] text-slate-400 italic">Body text will appear here…</p>
                  }
                </div>

                {/* Footer */}
                {hasFooter && (
                  <div className="px-3 pb-1">
                    <p className="text-[10px] text-slate-400">{form.footerText}</p>
                  </div>
                )}

                {/* Timestamp */}
                <div className="px-3 pb-2 flex justify-end items-center gap-1">
                  <span className="text-[9px] text-slate-400">1:03 pm</span>
                  <span className="text-[#34B7F1] text-[10px]">✓✓</span>
                </div>
              </div>

              {/* CTA Buttons — exactly like WA shows them below the card */}
              {hasButtons && (
                <div className="mt-1 space-y-0.5">
                  {form.buttons.map((btn, i) => (
                    <div key={i} className="bg-white rounded-xl py-2.5 text-center shadow-sm border-t border-slate-100">
                      <span className="text-[12px] font-semibold text-[#128C7E] flex items-center justify-center gap-1.5">
                        {btn.type === 'URL' && <span className="material-symbols-outlined text-[14px]">open_in_new</span>}
                        {btn.type === 'PHONE_NUMBER' && <span className="material-symbols-outlined text-[14px]">call</span>}
                        {btn.type === 'COPY_CODE' && <span className="material-symbols-outlined text-[14px]">content_copy</span>}
                        {btn.type === 'QUICK_REPLY' && <span className="material-symbols-outlined text-[14px]">reply</span>}
                        {btn.text || (btn.type === 'COPY_CODE' ? 'Copy Code' : btn.type === 'URL' ? 'Visit Website' : btn.type === 'PHONE_NUMBER' ? 'Call Us' : 'Reply')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WA message input bar */}
        <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2">
          <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">sentiment_satisfied</span>
            <span className="text-[11px] text-slate-400">Message</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base">mic</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({ t, onDelete, deleting }) {
  const [expanded, setExpanded] = useState(false);
  const headerComp  = t.components?.find(c => c.type === 'HEADER');
  const bodyComp    = t.components?.find(c => c.type === 'BODY');
  const footerComp  = t.components?.find(c => c.type === 'FOOTER');
  const buttonsComp = t.components?.find(c => c.type === 'BUTTONS');

  return (
    <div className={`${card} overflow-hidden`}>
      {/* Card header */}
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-start justify-between gap-3 p-5 text-left hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{t.name}</p>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] || STATUS_STYLES.PAUSED}`}>{t.status}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
            <span className="font-bold uppercase tracking-wider">{t.category}</span>
            <span>·</span>
            <span>{t.language}</span>
            {headerComp && <><span>·</span><span className="font-bold">{headerComp.format}</span></>}
            {buttonsComp && <><span>·</span><span>{buttonsComp.buttons?.length} btn{buttonsComp.buttons?.length !== 1 ? 's' : ''}</span></>}
          </div>
        </div>
        <span className={`material-symbols-outlined text-slate-400 transition-transform mt-0.5 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-white/[0.06] px-5 pb-5 pt-4 space-y-3">
          {t.status === 'REJECTED' && t.rejected_reason && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20">
              <p className="text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">Rejection Reason</p>
              <p className="text-xs text-red-600 dark:text-red-400">{t.rejected_reason}</p>
            </div>
          )}

          {/* Header */}
          {headerComp && (
            <div>
              <p className={label}>Header · {headerComp.format}</p>
              {headerComp.format === 'TEXT' && <p className="text-sm font-bold text-slate-800 dark:text-white">{headerComp.text}</p>}
              {['IMAGE','VIDEO','DOCUMENT'].includes(headerComp.format) && (
                <p className="text-xs text-slate-500 font-mono">{headerComp.example?.header_handle?.[0] || '(media handle)'}</p>
              )}
            </div>
          )}

          {/* Body */}
          {bodyComp && (
            <div>
              <p className={label}>Body</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{bodyComp.text}</p>
            </div>
          )}

          {/* Footer */}
          {footerComp && (
            <div>
              <p className={label}>Footer</p>
              <p className="text-xs text-slate-500">{footerComp.text}</p>
            </div>
          )}

          {/* Buttons */}
          {buttonsComp && buttonsComp.buttons?.length > 0 && (
            <div>
              <p className={label}>Buttons</p>
              <div className="space-y-1.5">
                {buttonsComp.buttons.map((btn, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                    <span className="material-symbols-outlined text-sm text-[#25D366]">
                      {btn.type === 'QUICK_REPLY' ? 'reply' : btn.type === 'URL' ? 'open_in_new' : btn.type === 'PHONE_NUMBER' ? 'call' : 'content_copy'}
                    </span>
                    <span className="font-bold">{btn.text || btn.type}</span>
                    {btn.url && <span className="text-slate-400 truncate ml-auto">{btn.url}</span>}
                    {btn.phone_number && <span className="text-slate-400 ml-auto">{btn.phone_number}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button onClick={() => onDelete(t.name)} disabled={deleting === t.name}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-50 transition-all">
              <span className="material-symbols-outlined text-sm">{deleting === t.name ? 'hourglass_empty' : 'delete'}</span>
              {deleting === t.name ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }) {
  const { addToast } = useNotifications();
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [creating, setCreating] = useState(false);

  const upd = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const varIndices = extractVarIndices(form.bodyText);

  // Sync bodyExamples array length to match variable count
  const syncExamples = (text) => {
    const indices = extractVarIndices(text);
    const maxIdx = indices.length > 0 ? Math.max(...indices) : 0;
    setForm(f => {
      const ex = [...(f.bodyExamples || [])];
      while (ex.length < maxIdx) ex.push('');
      return { ...f, bodyText: text, bodyExamples: ex };
    });
  };

  const addButton = () => {
    if (form.buttons.length >= 10) return;
    setForm(f => ({ ...f, buttons: [...f.buttons, { type: 'QUICK_REPLY', text: '', url: '', phone: '', code: '' }] }));
  };

  const updBtn = (i, field, val) => setForm(f => {
    const btns = [...f.buttons];
    btns[i] = { ...btns[i], [field]: val };
    return { ...f, buttons: btns };
  });

  const removeBtn = (i) => setForm(f => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { addToast('Template name is required', 'warning'); return; }
    if (!form.bodyText.trim()) { addToast('Body text is required', 'warning'); return; }

    const components = buildComponents(form);
    if (!components.some(c => c.type === 'BODY')) { addToast('Body text is required', 'warning'); return; }

    try {
      setCreating(true);
      const res = await createWATemplate({
        name: form.name.trim().toLowerCase().replace(/\s+/g, '_'),
        category: form.category,
        language: form.language,
        components,
      });
      if (res.data.success) {
        addToast('Template submitted for Meta approval!', 'success');
        onCreated({ ...res.data.data, status: 'PENDING', components });
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create template';
      addToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl w-full max-w-5xl my-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Create WhatsApp Template</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0">

            {/* ── Left: Form ── */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">

              {/* Name + Category + Language */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={label}>Template Name *</label>
                  <input value={form.name} onChange={e => upd('name', e.target.value)}
                    placeholder="e.g. lead_welcome" className={inp} autoComplete="off" />
                  <p className="text-[9px] text-slate-400 mt-1">Lowercase, underscores only</p>
                </div>
                <div>
                  <label className={label}>Category *</label>
                  <select value={form.category} onChange={e => upd('category', e.target.value)} className={inp}>
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Language *</label>
                  <select value={form.language} onChange={e => upd('language', e.target.value)} className={inp}>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Header */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-base">crop_landscape</span>
                  <p className={`${label} mb-0`}>Header <span className="normal-case font-normal text-slate-400">(optional)</span></p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['NONE','TEXT','IMAGE','VIDEO','DOCUMENT'].map(ht => (
                    <button key={ht} type="button" onClick={() => upd('headerType', ht)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                        form.headerType === ht
                          ? 'bg-[#25D366] text-white border-[#25D366]'
                          : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-[#25D366]/40'
                      }`}>
                      {ht === 'NONE' ? 'None' : ht === 'IMAGE' ? '📷 Image' : ht === 'VIDEO' ? '🎥 Video' : ht === 'DOCUMENT' ? '📄 Doc' : '📝 Text'}
                    </button>
                  ))}
                </div>
                {form.headerType === 'TEXT' && (
                  <input value={form.headerText} onChange={e => upd('headerText', e.target.value)}
                    placeholder="Header text (max 60 chars)" maxLength={60} className={inp} />
                )}
                {['IMAGE','VIDEO','DOCUMENT'].includes(form.headerType) && (
                  <div>
                    <input value={form.headerMediaUrl} onChange={e => upd('headerMediaUrl', e.target.value)}
                      placeholder={`Public ${form.headerType.toLowerCase()} URL (https://...)`} className={inp} />
                    <p className="text-[9px] text-slate-400 mt-1">Must be a publicly accessible URL. Meta uses this as the header example during approval.</p>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-base">text_fields</span>
                    <p className={`${label} mb-0`}>Body *</p>
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3].map(n => (
                      <button key={n} type="button"
                        onClick={() => syncExamples(form.bodyText + `{{${n}}}`)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-all">
                        +&#123;&#123;{n}&#125;&#125;
                      </button>
                    ))}
                  </div>
                </div>
                <textarea rows={5} value={form.bodyText}
                  onChange={e => syncExamples(e.target.value)}
                  placeholder="Hello {{1}}, your property inquiry has been received. Our agent {{2}} will call you shortly."
                  className={`${inp} resize-none`} />
                <p className="text-[9px] text-slate-400">Use {'{{1}}'}, {'{{2}}'} etc. for dynamic values. {form.bodyText.length}/1024</p>

                {/* Variable examples */}
                {varIndices.length > 0 && (
                  <div className="space-y-2">
                    <p className={`${label}`}>Variable Examples (required by Meta)</p>
                    {varIndices.map(n => (
                      <div key={n} className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#25D366] w-8 flex-shrink-0">&#123;&#123;{n}&#125;&#125;</span>
                        <input value={form.bodyExamples[n-1] || ''} onChange={e => {
                          const ex = [...form.bodyExamples];
                          ex[n-1] = e.target.value;
                          upd('bodyExamples', ex);
                        }} placeholder={`Example for {{${n}}}`} className={`${inp} text-xs`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-base">subtitles</span>
                  <p className={`${label} mb-0`}>Footer <span className="normal-case font-normal text-slate-400">(optional)</span></p>
                </div>
                <input value={form.footerText} onChange={e => upd('footerText', e.target.value)}
                  placeholder="e.g. Reply STOP to unsubscribe" maxLength={60} className={inp} />
              </div>

              {/* Buttons */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-base">smart_button</span>
                    <p className={`${label} mb-0`}>Buttons <span className="normal-case font-normal text-slate-400">(max 10)</span></p>
                  </div>
                  {form.buttons.length < 10 && (
                    <button type="button" onClick={addButton}
                      className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#25D366] hover:text-[#20b858] transition-colors">
                      <span className="material-symbols-outlined text-sm">add_circle</span> Add Button
                    </button>
                  )}
                </div>

                {form.buttons.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center py-3">No buttons added yet. Add up to 10 buttons.</p>
                )}

                {form.buttons.map((btn, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <select value={btn.type} onChange={e => updBtn(i, 'type', e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1e293b] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#25D366]">
                        <option value="QUICK_REPLY">Quick Reply</option>
                        <option value="URL">Visit URL</option>
                        <option value="PHONE_NUMBER">Call Phone</option>
                        <option value="COPY_CODE">Copy Code (OTP)</option>
                      </select>
                      <button type="button" onClick={() => removeBtn(i)} className="text-red-400 hover:text-red-600 ml-2">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>

                    {btn.type !== 'COPY_CODE' && (
                      <input value={btn.text} onChange={e => updBtn(i, 'text', e.target.value)}
                        placeholder="Button label text" maxLength={25} className={`${inp} text-xs`} />
                    )}
                    {btn.type === 'URL' && (
                      <input value={btn.url} onChange={e => updBtn(i, 'url', e.target.value)}
                        placeholder="https://..." className={`${inp} text-xs font-mono`} />
                    )}
                    {btn.type === 'PHONE_NUMBER' && (
                      <input value={btn.phone} onChange={e => updBtn(i, 'phone', e.target.value)}
                        placeholder="+919876543210" className={`${inp} text-xs font-mono`} />
                    )}
                    {btn.type === 'COPY_CODE' && (
                      <input value={btn.code} onChange={e => updBtn(i, 'code', e.target.value)}
                        placeholder="Example OTP code (e.g. 123456)" className={`${inp} text-xs font-mono`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Note */}
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Note:</strong> Templates are submitted to Meta for review. Approval typically takes up to 24 hours. Marketing templates require business verification.
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-[#20b858] disabled:opacity-50 transition-all shadow-md shadow-[#25D366]/20">
                  {creating
                    ? <><span className="animate-spin w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full" /> Submitting…</>
                    : <><span className="material-symbols-outlined text-base">send</span> Submit for Approval</>}
                </button>
                <button type="button" onClick={onClose}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all">
                  Cancel
                </button>
              </div>
            </div>

            {/* ── Right: Live Preview ── */}
            <div className="hidden lg:block border-l border-slate-100 dark:border-white/[0.06] p-6 bg-slate-50/50 dark:bg-white/[0.01]">
              <WAPreview form={form} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WhatsAppTemplatesPage() {
  const { addToast } = useNotifications();
  const navigate     = useNavigate();

  const [templates,     setTemplates]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [statusFilter,  setStatusFilter]  = useState('ALL');
  const [categoryFilter,setCategoryFilter]= useState('ALL');
  const [search,        setSearch]        = useState('');
  const [showCreate,    setShowCreate]    = useState(false);
  const [deleting,      setDeleting]      = useState(null);
  const [notConnected,  setNotConnected]  = useState(false);
  const [tokenInvalid,  setTokenInvalid]  = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setNotConnected(false);
      setTokenInvalid(false);
      const res = await listWATemplates();
      if (res.data.success) setTemplates(res.data.data || []);
    } catch (err) {
      const code   = err.response?.data?.code;
      const status = err.response?.status;
      if (status === 400 || code === 'NOT_CONNECTED') setNotConnected(true);
      else if (code === 'TOKEN_INVALID') setTokenInvalid(true);
      else addToast(err.response?.data?.error || 'Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    try {
      setDeleting(name);
      await deleteWATemplate(name);
      setTemplates(prev => prev.filter(t => t.name !== name));
      addToast('Template deleted', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = templates.filter(t => {
    const statusOk = statusFilter   === 'ALL' || t.status   === statusFilter;
    const catOk    = categoryFilter === 'ALL' || t.category === categoryFilter;
    const searchOk = !search || t.name.includes(search.toLowerCase());
    return statusOk && catOk && searchOk;
  });

  return (
    <div className="animate-fade-in pb-10">
      <div className="mx-auto max-w-6xl px-4">

        {/* Header */}
        <div className={`${card} mb-6 p-6 md:p-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">description</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">WhatsApp Templates</h1>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Full Meta-parity template builder · {templates.length} template{templates.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={fetchTemplates} disabled={loading}
                className="flex items-center gap-2 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#25D366] hover:bg-[#25D366]/10 disabled:opacity-50 transition-all">
                <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>sync</span>
                Sync from Meta
              </button>
              {!notConnected && !tokenInvalid && (
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-md hover:bg-[#20b858] transition-all">
                  <span className="material-symbols-outlined text-base">add</span>
                  New Template
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Not connected / token invalid banner */}
        {(notConnected || tokenInvalid) && (
          <div className={`${card} mb-6 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4`}>
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/20">
              <span className="material-symbols-outlined text-amber-500 text-2xl">warning</span>
            </div>
            <div className="flex-1 min-w-0">
              {notConnected ? (
                <>
                  <p className="text-sm font-black text-slate-900 dark:text-white">WhatsApp not connected</p>
                  <p className="text-xs text-slate-500 mt-0.5">Connect your WhatsApp Business Account to view and manage templates.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-black text-slate-900 dark:text-white">WhatsApp token expired or invalid</p>
                  <p className="text-xs text-slate-500 mt-0.5">Your access token is encrypted with a mismatched key or has expired. Go to WhatsApp Setup → Clear All &amp; Reset → reconnect.</p>
                </>
              )}
            </div>
            <button onClick={() => navigate('/whatsapp-setup')}
              className="flex-shrink-0 flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#20b858] transition-all">
              <span className="material-symbols-outlined text-base">settings</span>
              {notConnected ? 'Connect WhatsApp' : 'Fix Connection'}
            </button>
          </div>
        )}

        {/* Filter bar */}
        {!notConnected && !tokenInvalid && (
          <div className={`${card} mb-6 p-4`}>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className={label}>Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-[#25D366]">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Category</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-[#25D366]">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className={label}>Search</label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search template name…"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-[#25D366]" />
              </div>
              <div className="ml-auto self-end">
                <p className="text-xs text-slate-500 pb-2">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Template list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25D366] border-t-transparent" />
          </div>
        ) : !notConnected && !tokenInvalid && filtered.length === 0 ? (
          <div className={`${card} p-12 text-center`}>
            <span className="material-symbols-outlined text-slate-300 text-5xl mb-3 block">description</span>
            <p className="text-slate-500 text-sm font-bold">No templates found</p>
            {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || search) ? (
              <button onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); setSearch(''); }}
                className="mt-3 text-xs text-[#25D366] font-bold">Clear filters</button>
            ) : (
              <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-[#25D366] font-bold">
                Create your first template →
              </button>
            )}
          </div>
        ) : !notConnected && !tokenInvalid ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map(t => (
              <TemplateCard key={t.id || t.name} t={t} onDelete={handleDelete} deleting={deleting} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(t) => setTemplates(prev => [t, ...prev])}
        />
      )}
    </div>
  );
}
