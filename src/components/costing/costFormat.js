// Pure helpers for the costing UI. The backend already sends rupee values rounded from integer
// micro-INR, so the UI only formats them and never re-sums line items (a re-sum would drift by paise).

const num = (n) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);

// Below Rs 1 the paise-level cost of one lead/token batch matters, so show 4 decimals.
// Previous behaviour to avoid: rounding a Rs 0.003 lead cost to "Rs 0.00", which looks like free usage.
export function formatInr(n) {
  const v = num(typeof n === 'string' ? Number(n) : n);
  if (v === 0) return '₹0.00';
  const abs = Math.abs(v);
  if (abs < 0.0001) return v < 0 ? '-<₹0.0001' : '<₹0.0001';
  if (abs < 1) return `${v < 0 ? '-' : ''}₹${abs.toFixed(4)}`;
  return `${v < 0 ? '-' : ''}₹${abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatUsd(n) {
  const v = num(n);
  return `$${v.toFixed(v !== 0 && Math.abs(v) < 1 ? 4 : 2)}`;
}

// Tailwind classes are written out in full so the compiler can see them.
export const COMPONENT_META = {
  whatsapp: { label: 'WhatsApp (Meta)', color: '#25D366', bar: 'bg-[#25D366]' },
  llm: { label: 'AI tokens (LLM)', color: '#8B5CF6', bar: 'bg-violet-500' },
  tts: { label: 'Text to speech', color: '#F59E0B', bar: 'bg-amber-500' },
  stt: { label: 'Speech to text', color: '#3B82F6', bar: 'bg-blue-500' },
  telephony: { label: 'Telephony (talk time)', color: '#EF4444', bar: 'bg-red-500' },
  email: { label: 'Email', color: '#06B6D4', bar: 'bg-cyan-500' },
  otp: { label: 'OTP SMS', color: '#EC4899', bar: 'bg-pink-500' },
  infra: { label: 'Infra (allocated)', color: '#64748B', bar: 'bg-slate-500' },
};
export const COMPONENT_ORDER = ['whatsapp', 'llm', 'tts', 'stt', 'telephony', 'email', 'otp', 'infra'];

export function componentLabel(key) {
  return COMPONENT_META[key]?.label || key;
}
export function componentColor(key) {
  return COMPONENT_META[key]?.color || '#94A3B8';
}

export const BASIS_META = {
  metered: { label: 'Metered', swatch: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', hint: 'Exact usage reported by the provider' },
  estimated: { label: 'Estimated', swatch: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', hint: 'Calculated from call duration or history, not reported by the provider' },
  allocated: { label: 'Allocated', swatch: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-300', hint: 'Our monthly infrastructure bill shared per interaction' },
};

export function basisLabel(basis) {
  return BASIS_META[basis]?.label || 'Unknown';
}

// byComponent[].basis is an object {metered: ₹, estimated: ₹} for normal components and the string
// 'allocated' for infra. Return the list of basis keys that carry money (or the single string).
export function basisKeys(basis) {
  if (typeof basis === 'string') return [basis];
  if (!basis || typeof basis !== 'object') return [];
  return Object.keys(basis).filter((k) => num(basis[k]) !== 0 || Object.keys(basis).length === 1);
}

const fmtNum = (n) => Math.round(num(n)).toLocaleString('en-IN');
const fmtMin = (sec) => `${(Math.round((num(sec) / 60) * 10) / 10).toLocaleString('en-IN')} min`;

export function formatQuantity(component, units) {
  const u = units || {};
  switch (component) {
    case 'llm': {
      const total = num(u.tokensIn) + num(u.tokensOut);
      return total ? `${fmtNum(total)} tokens` : '0 tokens';
    }
    case 'tts':
      return `${fmtNum(u.chars)} characters`;
    case 'stt':
      return fmtMin(u.audioSec ?? num(u.minutes) * 60);
    case 'telephony':
      return fmtMin(u.callSec ?? num(u.minutes) * 60);
    case 'whatsapp':
      return `${fmtNum(u.messages)} messages`;
    case 'email':
    case 'otp':
      return `${fmtNum(u.messages)} sent`;
    case 'infra':
      return `${fmtNum(u.interactions)} interactions`;
    default:
      return '';
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatMonthLabel(month) {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month || '');
  if (!m) return month || '';
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function formatDayLabel(day) {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(day || '');
  if (!m) return day || '';
  return `${Number(m[2])} ${MONTHS[Number(m[1]) - 1]}`;
}

export function shareOf(part, total) {
  const t = num(total);
  if (t <= 0) return 0;
  return Math.max(0, Math.min(100, (num(part) / t) * 100));
}

export function formatShare(part, total) {
  const s = shareOf(part, total);
  return s > 0 && s < 1 ? '<1%' : `${Math.round(s)}%`;
}

// A voice row has provider null for calls-only rows (voice with talk time but no TTS cost yet).
export function providerLabel(provider) {
  if (!provider) return 'Agent default';
  const p = String(provider).toLowerCase();
  if (p === 'sarvam') return 'Sarvam';
  if (p === 'google') return 'Google';
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
