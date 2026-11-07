/**
 * LeadAutomationPage — component tests with mocked API, auth, toasts and socket.
 *
 * Runs in a non-IST browser timezone (America/Los_Angeles) so AI-call times
 * must be built, grouped and shown in Asia/Kolkata regardless of the browser.
 * "Now" is 2026-10-27 10:00 IST (= 26 Oct 21:30 in Los Angeles).
 */
/* global process */
import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

const PREV_TZ = process.env.TZ;
beforeAll(() => { process.env.TZ = 'America/Los_Angeles'; });
afterAll(() => {
  if (PREV_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = PREV_TZ;
});

const h = vi.hoisted(() => ({
  user: { id: 'owner1', name: 'Owner One', role: 'owner' },
  notif: { socket: null, addToast: null, playChime: null },
}));

vi.mock('../api', () => ({
  getAllUsers: vi.fn(),
  getSummary: vi.fn(),
  createLeadFromUser: vi.fn(),
  getLeadAutomationOverview: vi.fn(),
  enrollLeadNurture: vi.fn(),
  cancelLeadNurture: vi.fn(),
  callLeadNow: vi.fn(),
  scheduleLeadCall: vi.fn(),
  createLeadAutomation: vi.fn(),
  retryLeadAutomation: vi.fn(),
  cancelLeadCall: vi.fn(),
  deleteLeadAutomation: vi.fn(),
  getLeadCallHistory: vi.fn(),
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: h.user }) }));
vi.mock('../context/NotificationContext', () => ({ useNotifications: () => h.notif }));

import * as api from '../api';
import LeadAutomationPage from './LeadAutomationPage';

// ── fixtures ────────────────────────────────────────────────────────────────

const NOW = new Date('2026-10-27T04:30:00.000Z'); // 10:00 IST

const LEAD = { id: 'L1', first_name: 'Test', last_name: 'Lead', phone_number: '9000000000' };

const ok = (data) => Promise.resolve({ data });

const overviewBody = (over = {}) => ({
  success: true,
  data: {
    lead: { id: 'L1', name: 'Test Lead', projectName: 'Sky Greens' },
    automations: [],
    ladder: null,
    templateOptions: { project: [], own: [{ templateName: 'hello_world' }], warning: null },
    voice: { available: true, code: null, reason: null, inProgress: false },
    ...over,
  },
});

/** Promise whose resolve / reject the test controls. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function makeSocket() {
  const handlers = {};
  return {
    emit: vi.fn(),
    on: vi.fn((ev, fn) => { (handlers[ev] ||= new Set()).add(fn); }),
    off: vi.fn((ev, fn) => { handlers[ev]?.delete(fn); }),
    fire(ev, payload) { handlers[ev]?.forEach((fn) => fn(payload)); },
  };
}

const LocationDisplay = () => <div data-testid="location">{useLocation().pathname}</div>;

function renderPage(path = '/lead-automation/L1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lead-automation" element={<LeadAutomationPage />} />
        <Route path="/lead-automation/:leadId" element={<LeadAutomationPage />} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>,
  );
}

async function renderLoaded(path) {
  const view = renderPage(path);
  await screen.findByText('Automation Calendar');
  await waitFor(() => expect(api.getLeadAutomationOverview).toHaveBeenCalled());
  return view;
}

const dayCell = (re) => screen.getByRole('button', { name: re });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  h.notif = { socket: null, addToast: vi.fn(), playChime: vi.fn() };
  vi.mocked(api.getAllUsers).mockImplementation(() => ok({ users: [] }));
  vi.mocked(api.getSummary).mockImplementation(() => ok(LEAD));
  vi.mocked(api.getLeadAutomationOverview).mockImplementation(() => ok(overviewBody()));
  vi.mocked(api.getLeadCallHistory).mockImplementation(() => ok({ data: [] }));
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// ── tests ───────────────────────────────────────────────────────────────────

describe('LeadAutomationPage — timezone', () => {
  it('runs under a non-IST browser timezone', () => {
    // Los Angeles is UTC-7 in October (IST would be -330).
    expect(new Date(2026, 9, 28).getTimezoneOffset()).toBe(420);
  });
});

describe('LeadAutomationPage — loading', () => {
  it('shows the loading state until the lead is loaded', async () => {
    const users = deferred();
    vi.mocked(api.getAllUsers).mockImplementation(() => users.promise);
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    expect(screen.queryByText('Automation Calendar')).not.toBeInTheDocument();

    await act(async () => users.resolve({ data: { users: [] } }));
    expect(await screen.findByText('Automation Calendar')).toBeInTheDocument();
    expect(api.getSummary).toHaveBeenCalledWith('L1');
    expect(api.getLeadAutomationOverview).toHaveBeenCalledWith('L1');
  });

  it('shows a readable error when the overview cannot be loaded', async () => {
    vi.mocked(api.getLeadAutomationOverview).mockImplementation(() =>
      Promise.reject({ response: { status: 500, data: { success: false, error: 'Overview is down' } } }));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Overview is down');
    // No voice block → Call now is disabled with the reason.
    expect(screen.getByRole('button', { name: 'Call now' })).toBeDisabled();
    expect(screen.getByText('AI calling status is unavailable.')).toBeInTheDocument();
  });
});

describe('LeadAutomationPage — Call now', () => {
  it('places one call per press, shows the busy state and refreshes', async () => {
    const call = deferred();
    vi.mocked(api.callLeadNow).mockImplementation(() => call.promise);
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Call now' }));
    expect(window.confirm).toHaveBeenCalledWith('Start an AI call to Test Lead now?');

    const busy = screen.getByRole('button', { name: 'Calling…' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(busy); // a second press while busy does nothing
    expect(api.callLeadNow).toHaveBeenCalledTimes(1);

    const [leadId, key] = vi.mocked(api.callLeadNow).mock.calls[0];
    expect(leadId).toBe('L1');
    expect(key).toMatch(/^[A-Za-z0-9_-]{1,128}$/);

    const loadsBefore = vi.mocked(api.getLeadAutomationOverview).mock.calls.length;
    await act(async () => call.resolve({ data: { success: true, message: 'AI call queued.' } }));

    expect(h.notif.addToast).toHaveBeenCalledWith('AI call queued.', 'success', 'AI call started');
    expect(screen.getByRole('button', { name: 'Call now' })).toBeEnabled();
    await waitFor(() =>
      expect(vi.mocked(api.getLeadAutomationOverview).mock.calls.length).toBeGreaterThan(loadsBefore));
  });

  it('keeps the idempotency key after a network error, so a second press cannot place a second call', async () => {
    vi.mocked(api.callLeadNow)
      .mockImplementationOnce(() => Promise.reject(new Error('Network Error')))
      .mockImplementationOnce(() => ok({ success: true, duplicate: true, message: 'Already requested.' }));
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Call now' }));
    await waitFor(() => expect(h.notif.addToast).toHaveBeenCalledWith(
      'Could not reach the server. Check your connection and try again.', 'error', 'AI call not started'));

    fireEvent.click(await screen.findByRole('button', { name: 'Call now' }));
    await waitFor(() => expect(api.callLeadNow).toHaveBeenCalledTimes(2));
    const keys = vi.mocked(api.callLeadNow).mock.calls.map((c) => c[1]);
    expect(keys[1]).toBe(keys[0]);
    await waitFor(() =>
      expect(h.notif.addToast).toHaveBeenCalledWith('Already requested.', 'info', 'Already requested'));
  });

  it('a server rejection shows its reason and the next press uses a new key', async () => {
    vi.mocked(api.callLeadNow)
      .mockImplementationOnce(() => Promise.reject({ response: { status: 409, data: { error: 'Daily call limit reached.' } } }))
      .mockImplementationOnce(() => ok({ success: true }));
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Call now' }));
    await waitFor(() => expect(h.notif.addToast).toHaveBeenCalledWith('Daily call limit reached.', 'error', 'AI call not started'));
    fireEvent.click(await screen.findByRole('button', { name: 'Call now' }));
    await waitFor(() => expect(api.callLeadNow).toHaveBeenCalledTimes(2));
    const keys = vi.mocked(api.callLeadNow).mock.calls.map((c) => c[1]);
    expect(keys[1]).not.toBe(keys[0]);
  });

  it('cancelling the confirm places no call', async () => {
    window.confirm.mockReturnValue(false);
    await renderLoaded();
    fireEvent.click(screen.getByRole('button', { name: 'Call now' }));
    expect(api.callLeadNow).not.toHaveBeenCalled();
  });

  it('is disabled with the reason while a call is in progress', async () => {
    vi.mocked(api.getLeadAutomationOverview).mockImplementation(() =>
      ok(overviewBody({ voice: { available: false, inProgress: true, code: 'CALL_IN_PROGRESS', reason: 'x' } })));
    await renderLoaded();
    const btn = await screen.findByRole('button', { name: 'Call now' });
    await waitFor(() => expect(btn).toBeDisabled());
    expect(screen.getByText('A call to this lead is already in progress.')).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-describedby', 'call-now-reason');
  });
});

describe('LeadAutomationPage — Schedule modal', () => {
  const openScheduleOn28 = () => {
    fireEvent.click(screen.getByRole('button', { name: /^Schedule on .*October 28$/ }));
    return screen.getByRole('dialog', { name: 'Schedule Automation' });
  };

  it('schedules an AI call at the IST wall time, not the browser time', async () => {
    const save = deferred();
    vi.mocked(api.scheduleLeadCall).mockImplementation(() => save.promise);
    await renderLoaded();

    const dialog = openScheduleOn28();
    fireEvent.click(within(dialog).getByRole('radio', { name: 'AI call' }));
    expect(within(dialog).getByText(/India time \(IST\)/)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/Time/), { target: { value: '10:30' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Schedule' }));

    // 28 Oct 10:30 IST = 05:00 UTC (Los Angeles would give 17:30 UTC).
    expect(api.scheduleLeadCall).toHaveBeenCalledTimes(1);
    const [leadId, iso, key] = vi.mocked(api.scheduleLeadCall).mock.calls[0];
    expect(leadId).toBe('L1');
    expect(iso).toBe('2026-10-28T05:00:00.000Z');
    expect(key).toMatch(/^[A-Za-z0-9_-]{1,128}$/);

    const saving = within(dialog).getByRole('button', { name: 'Saving...' });
    expect(saving).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeDisabled();

    await act(async () => save.resolve({ data: { success: true, message: 'AI call scheduled for 10:30.' } }));
    expect(h.notif.addToast).toHaveBeenCalledWith('AI call scheduled for 10:30.', 'success', 'AI call scheduled');
    expect(screen.queryByRole('dialog', { name: 'Schedule Automation' })).not.toBeInTheDocument();
  });

  it('rejects an AI call outside 09:00–21:00 IST without calling the API', async () => {
    await renderLoaded();
    const dialog = openScheduleOn28();
    fireEvent.click(within(dialog).getByRole('radio', { name: 'AI call' }));
    // 08:00 IST is outside the window (08:00 Los Angeles time would be inside it).
    fireEvent.change(within(dialog).getByLabelText(/Time/), { target: { value: '08:00' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Schedule' }));

    expect(within(dialog).getByRole('alert'))
      .toHaveTextContent('AI calls can only be placed between 9:00 AM and 9:00 PM IST.');
    expect(api.scheduleLeadCall).not.toHaveBeenCalled();
  });

  it('WhatsApp: needs a template, then shows the server error text', async () => {
    vi.mocked(api.createLeadAutomation).mockImplementation(() =>
      Promise.reject({ response: { status: 400, data: { error: 'This template is not approved yet.' } } }));
    await renderLoaded();
    const dialog = openScheduleOn28();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Schedule' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Choose a template to send.');
    expect(api.createLeadAutomation).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/Template/), { target: { value: 'hello_world' } });
    fireEvent.change(within(dialog).getByLabelText(/Time/), { target: { value: '11:15' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Schedule' }));

    await waitFor(() => expect(api.createLeadAutomation).toHaveBeenCalledTimes(1));
    const body = vi.mocked(api.createLeadAutomation).mock.calls[0][0];
    expect(body.leadId).toBe('L1');
    expect(body.templateName).toBe('hello_world');
    // WhatsApp rows keep the browser time: 28 Oct 11:15 Los Angeles.
    expect(body.scheduledAt).toBe(new Date(2026, 9, 28, 11, 15).toISOString());
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('This template is not approved yet.');
    expect(screen.getByRole('dialog', { name: 'Schedule Automation' })).toBeInTheDocument();
  });

  it('Escape closes the modal', async () => {
    await renderLoaded();
    openScheduleOn28();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Schedule Automation' })).not.toBeInTheDocument();
  });
});

describe('LeadAutomationPage — history and row actions', () => {
  const FAILED_ROW = {
    _id: 'w1', leadId: 'L1', templateName: 'hello_world', status: 'failed', displayStatus: 'failed',
    reason: 'A template value is missing', retryable: true, scheduledAt: '2026-10-26T20:00:00.000Z', // 26 Oct 13:00 LA
  };

  it('Retry: busy state, toast, overview refresh', async () => {
    vi.mocked(api.getLeadAutomationOverview).mockImplementation(() => ok(overviewBody({ automations: [FAILED_ROW] })));
    const retry = deferred();
    vi.mocked(api.retryLeadAutomation).mockImplementation(() => retry.promise);
    await renderLoaded();

    fireEvent.click(await screen.findByRole('button', { name: /October 26: 1 entry/ }));
    const dialog = screen.getByRole('dialog', { name: 'Automation History' });
    expect(within(dialog).getByText('A template value is missing')).toBeInTheDocument();

    const btn = within(dialog).getByRole('button', { name: 'Retry hello_world' });
    fireEvent.click(btn);
    expect(api.retryLeadAutomation).toHaveBeenCalledWith('w1');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveTextContent('Retrying…');
    fireEvent.click(btn);
    expect(api.retryLeadAutomation).toHaveBeenCalledTimes(1);

    const loadsBefore = vi.mocked(api.getLeadAutomationOverview).mock.calls.length;
    await act(async () => retry.resolve({ data: { success: true, message: 'Retry queued for 10:05.' } }));
    expect(h.notif.addToast).toHaveBeenCalledWith('Retry queued for 10:05.', 'success', 'Retry queued');
    await waitFor(() =>
      expect(vi.mocked(api.getLeadAutomationOverview).mock.calls.length).toBeGreaterThan(loadsBefore));
    expect(within(dialog).getByRole('button', { name: 'Retry hello_world' })).toBeEnabled();
  });

  it('Retry of a message WhatsApp already confirmed is an info, not an error', async () => {
    vi.mocked(api.getLeadAutomationOverview).mockImplementation(() => ok(overviewBody({ automations: [FAILED_ROW] })));
    vi.mocked(api.retryLeadAutomation).mockImplementation(() => Promise.reject({
      response: { status: 409, data: { code: 'ALREADY_SENT', error: 'WhatsApp confirms this was sent.' } },
    }));
    await renderLoaded();
    fireEvent.click(await screen.findByRole('button', { name: /October 26: 1 entry/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry hello_world' }));
    await waitFor(() =>
      expect(h.notif.addToast).toHaveBeenCalledWith('WhatsApp confirms this was sent.', 'info', 'Already sent'));
  });

  it('AI call rows sit on their IST day and show IST time', async () => {
    // 28 Oct 10:30 IST = 27 Oct 22:00 in Los Angeles.
    const callRow = {
      _id: 'v1', leadId: 'L1', channel: 'voice', status: 'scheduled', displayStatus: 'scheduled',
      scheduledAt: '2026-10-28T05:00:00.000Z',
    };
    vi.mocked(api.getLeadAutomationOverview).mockImplementation(() => ok(overviewBody({ automations: [callRow] })));
    vi.mocked(api.cancelLeadCall).mockImplementation(() => ok({ success: true, message: 'AI call cancelled.' }));
    await renderLoaded();

    expect(await screen.findByRole('button', { name: /October 28: 1 entry/ })).toBeInTheDocument();
    expect(dayCell(/October 27: 0 entries/)).toBeInTheDocument();

    fireEvent.click(dayCell(/October 28: 1 entry/));
    const dialog = screen.getByRole('dialog', { name: 'Automation History' });
    expect(within(dialog).getByText('10:30 IST')).toBeInTheDocument();
    expect(within(dialog).getByText('Call scheduled')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel this AI call' }));
    expect(window.confirm).toHaveBeenCalledWith('Cancel this AI call?');
    await waitFor(() => expect(api.cancelLeadCall).toHaveBeenCalledWith('v1'));
    await waitFor(() =>
      expect(h.notif.addToast).toHaveBeenCalledWith('AI call cancelled.', 'info', 'Call cancelled'));
  });
});

describe('LeadAutomationPage — call result (no unrelated call)', () => {
  const HISTORY = [
    { callId: 'old-1', callNumber: 1, status: 'completed', startTime: '2026-10-20T05:00:00Z', summary: 'Old call summary' },
    { callId: 'c2', callNumber: 2, status: 'no-answer', startTime: '2026-10-27T03:00:00Z', summary: 'This call summary' },
  ];
  const voiceRow = (over) => ({
    _id: 'v9', leadId: 'L1', channel: 'voice', status: 'no-answer', displayStatus: 'no-answer',
    reason: 'Not answered.', scheduledAt: '2026-10-26T20:00:00.000Z', dialedAt: '2026-10-26T20:00:00.000Z', ...over,
  });

  const openRow = async (row) => {
    vi.mocked(api.getLeadAutomationOverview).mockImplementation(() => ok(overviewBody({ automations: [row] })));
    vi.mocked(api.getLeadCallHistory).mockImplementation(() => ok({ data: HISTORY }));
    await renderLoaded();
    // 26 Oct 20:00 UTC = 27 Oct 01:30 IST → the IST day.
    fireEvent.click(await screen.findByRole('button', { name: /October 27: 1 entry/ }));
    return screen.getByRole('dialog', { name: 'Automation History' });
  };

  it('a no-answer row without a matching call has no result link', async () => {
    const dialog = await openRow(voiceRow({ hasCallResult: false }));
    expect(within(dialog).getByText('No answer')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'View call result' })).not.toBeInTheDocument();
  });

  it('a row with no call id (older backend) has no result link', async () => {
    const dialog = await openRow(voiceRow({}));
    expect(within(dialog).queryByRole('button', { name: 'View call result' })).not.toBeInTheDocument();
  });

  it('opens exactly this call; Escape closes the result first', async () => {
    const dialog = await openRow(voiceRow({ hasCallResult: true, callId: 'c2', callNumber: 2 }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'View call result' }));

    const result = screen.getByRole('dialog', { name: 'AI call result' });
    expect(within(result).getByText('Tue 27 Oct, 01:30 IST')).toBeInTheDocument();
    await waitFor(() => expect(api.getLeadCallHistory).toHaveBeenCalledWith('L1'));
    const expanded = (await within(result).findByText('AI Summary')).parentElement;
    expect(expanded).toHaveTextContent('This call summary');
    expect(within(result).getAllByText('AI Summary')).toHaveLength(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'AI call result' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Automation History' })).toBeInTheDocument();
  });

  it('when the requested call is missing from history, says so and opens no other call', async () => {
    const dialog = await openRow(voiceRow({ hasCallResult: true, callId: 'c-missing' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'View call result' }));
    const result = screen.getByRole('dialog', { name: 'AI call result' });

    expect(await within(result).findByText(/result is not in the call history yet/)).toBeInTheDocument();
    expect(within(result).queryByText('AI Summary')).not.toBeInTheDocument();
    // Both older calls are listed, collapsed.
    expect(within(result).getByText('Old call summary')).toBeInTheDocument();
    expect(within(result).getByText('This call summary')).toBeInTheDocument();
  });
});

describe('LeadAutomationPage — socket refresh', () => {
  it('joins the lead room and reloads (debounced) on events for this lead only', async () => {
    const socket = makeSocket();
    h.notif = { ...h.notif, socket };
    await renderLoaded();

    await waitFor(() => expect(socket.emit).toHaveBeenCalledWith('join_lead', 'L1'));
    const base = vi.mocked(api.getLeadAutomationOverview).mock.calls.length;

    act(() => socket.fire('automation_update', { leadId: 'OTHER' }));
    await new Promise((r) => setTimeout(r, 900));
    expect(api.getLeadAutomationOverview).toHaveBeenCalledTimes(base);

    act(() => {
      socket.fire('automation_update', { leadId: 'L1' });
      socket.fire('call_update', { leadId: 'L1' });
    });
    await waitFor(() => expect(api.getLeadAutomationOverview).toHaveBeenCalledTimes(base + 1), { timeout: 2000 });
    await new Promise((r) => setTimeout(r, 900));
    expect(api.getLeadAutomationOverview).toHaveBeenCalledTimes(base + 1);
  });
});

describe('LeadAutomationPage — user picker', () => {
  const USERS = [
    { id: 'u1', first_name: 'asha', last_name: 'rao', phone_number: '9000000001' },
    { id: 'u2', first_name: 'ravi', last_name: 'k', phone_number: '9000000002' },
  ];

  it('without a lead id: pick a user → lead created without a call → opens its automation page', async () => {
    vi.mocked(api.getAllUsers).mockImplementation(() => ok({ users: USERS, total: 2 }));
    vi.mocked(api.createLeadFromUser).mockImplementation(() => ok({ id: 'L9' }));
    vi.mocked(api.getSummary).mockImplementation(() => ok({ ...LEAD, id: 'L9' }));
    renderPage('/lead-automation');

    const picker = await screen.findByRole('dialog', { name: 'Select User' });
    expect(within(picker).getByText('Total Users: 2')).toBeInTheDocument();
    fireEvent.click(within(picker).getByText('Asha Rao'));

    await waitFor(() => expect(api.createLeadFromUser).toHaveBeenCalledWith('u1', {
      creatorId: 'owner1', creatorName: 'Owner One', creatorRole: 'owner', skipCall: true,
    }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/lead-automation/L9'));
    await waitFor(() => expect(api.getLeadAutomationOverview).toHaveBeenCalledWith('L9'));
  });

  it('shows a toast when the lead cannot be opened', async () => {
    vi.mocked(api.getAllUsers).mockImplementation(() => ok({ users: USERS }));
    vi.mocked(api.createLeadFromUser).mockImplementation(() => Promise.reject(new Error('boom')));
    renderPage('/lead-automation');

    const picker = await screen.findByRole('dialog', { name: 'Select User' });
    fireEvent.click(within(picker).getByText('Ravi K'));
    await waitFor(() =>
      expect(h.notif.addToast).toHaveBeenCalledWith('Unable to open lead automation.', 'error', 'Failed'));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/lead-automation$/);
  });
});
