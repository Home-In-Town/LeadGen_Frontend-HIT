import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  describeAutomation,
  describeLadder,
  inCallWindowIST,
  istMinutes,
  formatIST,
  stopLabel,
  newIdempotencyKey,
  STOP_LABELS,
  TONE_CLASSES,
} from './automationStatus';

// IST = UTC+05:30. 2026-10-27 hh:mm IST as a Date.
const ist = (hh, mm, day = 27) =>
  new Date(Date.UTC(2026, 9, day, hh, mm) - 330 * 60000);

describe('describeAutomation — WhatsApp rows', () => {
  const wa = (displayStatus, extra = {}) => ({
    _id: 'r1',
    channel: undefined,
    status: 'sent',
    templateName: 'welcome_offer',
    displayStatus,
    ...extra,
  });

  it.each([
    ['scheduled', 'Scheduled', 'blue'],
    ['sending', 'Sending', 'blue'],
    ['sent', 'Sent', 'green'],
    ['delivered', 'Delivered', 'green'],
    ['read', 'Read', 'green'],
    ['not_delivered', 'Not delivered', 'red'],
    ['failed', 'Failed', 'red'],
    ['skipped', 'Skipped', 'slate'],
    ['stopped', 'Stopped', 'slate'],
  ])('%s → "%s" (%s)', (status, label, tone) => {
    const d = describeAutomation(wa(status));
    expect(d.channel).toBe('whatsapp');
    expect(d.statusLabel).toBe(label);
    expect(d.tone).toBe(tone);
    expect(TONE_CLASSES[d.tone]).toBeTruthy();
    expect(d.canCancelCall).toBe(false);
    expect(d.hasCallResult).toBe(false);
  });

  it('retrying shows the attempt number out of 5', () => {
    expect(describeAutomation(wa('retrying', { status: 'pending', attempts: 1 })).statusLabel)
      .toBe('Retrying (attempt 2 of 5)');
    expect(describeAutomation(wa('retrying', { status: 'pending', attempts: 3 })).statusLabel)
      .toBe('Retrying (attempt 4 of 5)');
    expect(describeAutomation(wa('retrying', { status: 'pending', attempts: 9 })).statusLabel)
      .toBe('Retrying (attempt 5 of 5)');
    expect(describeAutomation(wa('retrying', { status: 'pending', attempts: 1 })).tone).toBe('amber');
  });

  it('project template title uses the project name and the kind label', () => {
    const d = describeAutomation(
      wa('sent', { templateName: 'proj_skyline_greens_emi_v3', kind: 'emi' }),
      undefined,
      'Skyline Greens',
    );
    expect(d.title).toBe('Skyline Greens · 6. Budget & EMI');
  });

  it('kind is parsed from the name when the row has none', () => {
    const d = describeAutomation(wa('sent', { templateName: 'proj_x_rera_v2' }), undefined, 'Sai Dham');
    expect(d.title).toBe('Sai Dham · 5. RERA & Legal Papers');
  });

  it('custom kindLabelFn is used', () => {
    const d = describeAutomation(wa('sent', { kind: 'emi', templateName: 'proj_a_emi' }), () => 'EMI', 'A');
    expect(d.title).toBe('A · EMI');
  });

  it('own templates keep their raw name', () => {
    expect(describeAutomation(wa('sent')).title).toBe('welcome_offer');
  });

  it('retry / delete flags', () => {
    expect(describeAutomation(wa('failed', { status: 'failed', retryable: true })).canRetry).toBe(true);
    expect(describeAutomation(wa('failed', { status: 'failed', retryable: false })).canRetry).toBe(false);
    expect(describeAutomation(wa('scheduled', { status: 'pending' })).canDelete).toBe(true);
    expect(describeAutomation(wa('sent')).canDelete).toBe(false);
  });

  it('stopped rows carry their stop reason, not "failed"', () => {
    const d = describeAutomation(wa('stopped', { status: 'cancelled', reason: 'Stopped: lead replied' }));
    expect(d.statusLabel).toBe('Stopped');
    expect(d.reason).toBe('Stopped: lead replied');
    expect(d.tone).toBe('slate');
  });

  it('unknown status is humanized, slate', () => {
    const d = describeAutomation(wa('weird_state'));
    expect(d.statusLabel).toBe('Weird state');
    expect(d.tone).toBe('slate');
  });
});

describe('describeAutomation — AI call rows', () => {
  const voice = (status, extra = {}) => ({ _id: 'v1', channel: 'voice', status, displayStatus: status, ...extra });

  it.each([
    ['scheduled', 'Call scheduled', 'blue', true, false],
    ['dialing', 'Calling', 'amber', false, false],
    ['completed', 'Call completed', 'green', false, true],
    ['no-answer', 'No answer', 'amber', false, true],
    ['failed', 'Call failed', 'red', false, false],
    ['cancelled', 'Cancelled', 'slate', false, false],
  ])('%s → "%s"', (status, label, tone, canCancel, hasResult) => {
    const d = describeAutomation(voice(status));
    expect(d.channel).toBe('voice');
    expect(d.title).toBe('AI call');
    expect(d.statusLabel).toBe(label);
    expect(d.tone).toBe(tone);
    expect(d.canCancelCall).toBe(canCancel);
    expect(d.hasCallResult).toBe(hasResult);
    expect(d.canRetry).toBe(false);
    expect(d.canDelete).toBe(false);
  });

  it('reason is passed through', () => {
    const d = describeAutomation(voice('failed', { reason: 'All lines are busy' }));
    expect(d.reason).toBe('All lines are busy');
  });
});

describe('describeLadder', () => {
  const fmt = () => 'Tue 28 Oct, 10:12';
  const base = { applicable: true, total: 15, done: 0, delivered: 0, notDelivered: 0, nextAt: null, stoppedLabel: null };

  it('null when not applicable or missing', () => {
    expect(describeLadder(null)).toBeNull();
    expect(describeLadder({ ...base, applicable: false, state: 'in_progress' })).toBeNull();
  });

  it('in progress', () => {
    expect(describeLadder({ ...base, state: 'in_progress', done: 5, delivered: 4, nextAt: '2026-10-28T04:42:00Z' }, fmt))
      .toBe('Touch 6 of 15 · next on Tue 28 Oct, 10:12 · 4 delivered');
  });

  it('starts on <date> when nothing is done yet', () => {
    expect(describeLadder({ ...base, state: 'in_progress', nextAt: '2026-10-28T04:42:00Z' }, fmt))
      .toBe('Starts on Tue 28 Oct, 10:12');
  });

  it('stopped', () => {
    expect(describeLadder({ ...base, state: 'stopped', done: 3, stoppedReason: 'replied', stoppedLabel: 'Stopped: lead replied' }))
      .toBe('Stopped: lead replied · 3 of 15 sent');
    expect(describeLadder({ ...base, state: 'stopped', done: 2, stoppedReason: 'opted_out' }))
      .toBe('Stopped: lead opted out · 2 of 15 sent');
  });

  it('completed', () => {
    expect(describeLadder({ ...base, state: 'completed', done: 15 })).toBe('All 15 touches done');
    expect(describeLadder({ ...base, state: 'completed', done: 12 })).toBe('Ladder finished · 12 of 15 sent');
  });

  it('not enrolled', () => {
    expect(describeLadder({ ...base, state: 'not_enrolled' })).toBe('Not enrolled in the 15-touch ladder');
  });

  it('default formatter is IST', () => {
    // 2026-10-28 04:42 UTC = Wed 28 Oct, 10:12 IST
    expect(describeLadder({ ...base, state: 'in_progress', done: 1, delivered: 1, nextAt: '2026-10-28T04:42:00Z' }))
      .toBe('Touch 2 of 15 · next on Wed 28 Oct, 10:12 · 1 delivered');
  });
});

describe('stopLabel', () => {
  it('maps every reason and falls back to "Stopped"', () => {
    for (const [k, v] of Object.entries(STOP_LABELS)) expect(stopLabel(k)).toBe(v);
    expect(stopLabel('something_else')).toBe('Stopped');
    expect(stopLabel(undefined)).toBe('Stopped');
  });
});

describe('inCallWindowIST', () => {
  it('window edges 08:59 / 09:00 / 20:59 / 21:00 IST', () => {
    expect(inCallWindowIST(ist(8, 59))).toBe(false);
    expect(inCallWindowIST(ist(9, 0))).toBe(true);
    expect(inCallWindowIST(ist(20, 59))).toBe(true);
    expect(inCallWindowIST(ist(21, 0))).toBe(false);
  });

  it('midnight and invalid dates are outside', () => {
    expect(inCallWindowIST(ist(0, 0))).toBe(false);
    expect(inCallWindowIST(new Date('nope'))).toBe(false);
    expect(inCallWindowIST(undefined)).toBe(false);
  });

  it('istMinutes / formatIST', () => {
    expect(istMinutes(ist(9, 30))).toBe(570);
    expect(formatIST(ist(10, 12, 28))).toBe('Wed 28 Oct, 10:12');
    expect(formatIST('bad')).toBe('');
  });
});

describe('newIdempotencyKey', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns distinct keys the backend accepts', () => {
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{1,128}$/);
  });

  it('falls back to Math.random without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {});
    const k = newIdempotencyKey();
    expect(k).toMatch(/^k_[A-Za-z0-9_-]+$/);
    expect(k.length).toBeLessThanOrEqual(128);
  });
});
