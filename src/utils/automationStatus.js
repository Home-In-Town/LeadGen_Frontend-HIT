/**
 * automationStatus.js — how Automation page rows and the 15-touch ladder are
 * described to the owner. Pure helpers (no React), shared by the calendar
 * chips, the history list and the header.
 *
 * Input rows come from GET /api/lead-automation/lead/:leadId/overview:
 *   LeadAutomation row + { displayStatus, reason, retryable }
 *   WhatsApp displayStatus: scheduled | retrying | sending | sent | delivered |
 *                           read | not_delivered | failed | skipped | stopped
 *   Voice (channel 'voice') displayStatus: scheduled | dialing | completed |
 *                           no-answer | failed | cancelled
 */
import { KIND_LABEL, describeTemplate } from './templateNames';

// Same attempt cap as the backend (services/automationOutcome MAX_ATTEMPTS).
export const MAX_SEND_ATTEMPTS = 5;

// Same texts as the backend (services/automationView STOP_LABELS).
export const STOP_LABELS = {
  replied: 'Stopped: lead replied',
  link_click: 'Stopped: lead clicked a link',
  ladder_link_click: 'Stopped: lead clicked a link',
  opted_out: 'Stopped: lead opted out',
  engaged: 'Stopped: lead engaged',
  engaged_at_cron: 'Stopped: lead engaged',
  lead_deleted: 'Stopped: lead was deleted',
  undeliverable: "Stopped: number can't receive WhatsApp",
  project_inactive: 'Stopped: project inactive',
  manual_cancel: 'Stopped by you',
};

export const stopLabel = (reason) => STOP_LABELS[reason] || 'Stopped';

// Tailwind classes per tone (chips and badges). Text is always shown too,
// so status is never conveyed by colour alone.
export const TONE_CLASSES = {
  green: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
};

const WA_STATUS = {
  scheduled: { label: 'Scheduled', tone: 'blue' },
  retrying: { label: 'Retrying', tone: 'amber' },
  sending: { label: 'Sending', tone: 'blue' },
  sent: { label: 'Sent', tone: 'green' },
  delivered: { label: 'Delivered', tone: 'green' },
  read: { label: 'Read', tone: 'green' },
  not_delivered: { label: 'Not delivered', tone: 'red' },
  failed: { label: 'Failed', tone: 'red' },
  skipped: { label: 'Skipped', tone: 'slate' },
  stopped: { label: 'Stopped', tone: 'slate' },
};

const VOICE_STATUS = {
  scheduled: { label: 'Call scheduled', tone: 'blue' },
  dialing: { label: 'Calling', tone: 'amber' },
  completed: { label: 'Call completed', tone: 'green' },
  'no-answer': { label: 'No answer', tone: 'amber' },
  failed: { label: 'Call failed', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
};

const humanize = (s) => {
  const t = String(s || 'unknown').replace(/[_-]+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const defaultKindLabel = (kind) => KIND_LABEL[kind] || null;

/**
 * Title of a WhatsApp row: "<Project> · <n. Kind>" for project templates,
 * the raw template name otherwise.
 */
function templateTitle(row, kindLabelFn, projectName) {
  const parsed = describeTemplate(row?.templateName);
  const kind = row?.kind || parsed.kind;
  const kindLabel = kind ? (kindLabelFn(kind) || defaultKindLabel(kind)) : null;
  if (kindLabel) {
    const project = projectName || parsed.projectSlug || '';
    return project ? `${project} · ${kindLabel}` : kindLabel;
  }
  return row?.templateName || 'WhatsApp template';
}

/**
 * Describe one overview row for display.
 * @param {Object} row  overview row (LeadAutomation + displayStatus/reason/retryable)
 * @param {(kind: string) => string|null} [kindLabelFn]  kind → label (default KIND_LABEL)
 * @param {string} [projectName]  the lead's project name (prefix for project templates)
 * @returns {{ channel, title, statusLabel, tone, reason, canRetry, canCancelCall, canDelete, hasCallResult }}
 */
export function describeAutomation(row, kindLabelFn = defaultKindLabel, projectName = '') {
  const labelFn = typeof kindLabelFn === 'function' ? kindLabelFn : defaultKindLabel;
  const r = row || {};
  const isVoice = r.channel === 'voice';
  const status = r.displayStatus || r.status || 'unknown';
  const reason = r.reason || null;

  if (isVoice) {
    const s = VOICE_STATUS[status] || { label: humanize(status), tone: 'slate' };
    return {
      channel: 'voice',
      title: 'AI call',
      statusLabel: s.label,
      tone: s.tone,
      reason,
      canRetry: false,
      canCancelCall: status === 'scheduled',
      canDelete: false,
      hasCallResult: status === 'completed' || status === 'no-answer',
    };
  }

  const s = WA_STATUS[status] || { label: humanize(status), tone: 'slate' };
  let statusLabel = s.label;
  if (status === 'retrying') {
    const attempt = Math.min(Math.max((Number(r.attempts) || 0) + 1, 2), MAX_SEND_ATTEMPTS);
    statusLabel = `Retrying (attempt ${attempt} of ${MAX_SEND_ATTEMPTS})`;
  }

  return {
    channel: 'whatsapp',
    title: templateTitle(r, labelFn, projectName),
    statusLabel,
    tone: s.tone,
    reason,
    canRetry: !!r.retryable,
    canCancelCall: false,
    canDelete: r.status === 'pending',
    hasCallResult: false,
  };
}

const IST_OFFSET_MIN = 330;

/** Minutes since IST midnight for a date (NaN for an invalid date). */
export function istMinutes(date) {
  const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (!Number.isFinite(t)) return NaN;
  const utcMin = Math.floor(t / 60000);
  return (((utcMin + IST_OFFSET_MIN) % 1440) + 1440) % 1440;
}

/** AI calls run 09:00 (inclusive) to 21:00 (exclusive) IST. */
export function inCallWindowIST(date) {
  const m = istMinutes(date);
  if (!Number.isFinite(m)) return false;
  return m >= 9 * 60 && m < 21 * 60;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Tue 28 Oct, 10:12" in IST (deterministic, no locale data needed). */
export function formatIST(date) {
  const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (!Number.isFinite(t)) return '';
  const d = new Date(t + IST_OFFSET_MIN * 60000); // read with getUTC* = IST wall clock
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${hh}:${mm}`;
}

/**
 * One-line ladder progress for the header (null when the ladder doesn't apply).
 * @param {Object} ladder  overview.ladder
 * @param {(date) => string} [fmtDate]
 */
export function describeLadder(ladder, fmtDate = formatIST) {
  if (!ladder || !ladder.applicable) return null;
  const fmt = typeof fmtDate === 'function' ? fmtDate : formatIST;
  const total = Number(ladder.total) || 15;
  const done = Number(ladder.done) || 0;
  const delivered = Number(ladder.delivered) || 0;

  switch (ladder.state) {
    case 'not_enrolled':
      return `Not enrolled in the ${total}-touch ladder`;
    case 'stopped':
      return `${ladder.stoppedLabel || stopLabel(ladder.stoppedReason)} · ${done} of ${total} sent`;
    case 'completed':
      return done >= total
        ? `All ${total} touches done`
        : `Ladder finished · ${done} of ${total} sent`;
    case 'in_progress': {
      if (done === 0) {
        return ladder.nextAt ? `Starts on ${fmt(ladder.nextAt)}` : `Touch 1 of ${total} scheduled`;
      }
      const parts = [`Touch ${Math.min(done + 1, total)} of ${total}`];
      if (ladder.nextAt) parts.push(`next on ${fmt(ladder.nextAt)}`);
      parts.push(`${delivered} delivered`);
      return parts.join(' · ');
    }
    default:
      return null;
  }
}

/** Idempotency key for AI call requests (matches the backend /^[A-Za-z0-9_-]{1,128}$/). */
export function newIdempotencyKey() {
  try {
    const c = globalThis.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  } catch {
    // fall through to the Math.random fallback
  }
  const rand = () => Math.random().toString(36).slice(2, 12);
  return `k_${Date.now().toString(36)}_${rand()}${rand()}`;
}

export default {
  STOP_LABELS,
  TONE_CLASSES,
  MAX_SEND_ATTEMPTS,
  stopLabel,
  describeAutomation,
  describeLadder,
  inCallWindowIST,
  istMinutes,
  formatIST,
  newIdempotencyKey,
};
