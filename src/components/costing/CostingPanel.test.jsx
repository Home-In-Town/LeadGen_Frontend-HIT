import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api', () => ({
  getCostSummary: vi.fn(),
  getCostMonth: vi.fn(),
  getCostMonths: vi.fn(),
  getCostPrices: vi.fn(),
}));
import { getCostSummary, getCostMonth, getCostMonths, getCostPrices } from '../../api';
import CostingPanel from './CostingPanel';

const summary = (over = {}) => ({
  range: { from: '2026-10-01', to: '2026-10-30' }, currency: 'INR', totalInr: 123.45,
  byBasis: { metered: 80, estimated: 33.45, allocated: 10 },
  byComponent: [
    { component: 'whatsapp', label: 'WhatsApp (Meta)', costInr: 60, events: 10, units: { messages: 10 }, basis: { estimated: 60 }, priceNote: 'Paid by you directly to Meta from your WhatsApp account.' },
    { component: 'tts', label: 'Text to speech', costInr: 40, events: 5, units: { chars: 5000 }, basis: { metered: 40 } },
    { component: 'infra', label: 'Infra (allocated)', costInr: 10, events: 0, units: { interactions: 20 }, basis: 'allocated', rate: { month: '2026-09', status: 'provisional', inrPerUnit: 0.5 } },
  ],
  byVoice: [{ voice: 'priya', provider: 'sarvam', calls: 3, chars: 5000, costInr: 40 }],
  talk: { calls: 3, seconds: 600, minutes: 10 },
  whatsapp: { templatesSent: 8, templatesFree: 2, textMessages: 2, byCategory: { utility: 8, service: 2 } },
  daily: [{ day: '2026-10-29', totalInr: 50, byComponent: { whatsapp: 30, tts: 20 } }, { day: '2026-10-30', totalInr: 73.45, byComponent: { whatsapp: 30, tts: 20, infra: 10 } }],
  bySource: [{ source: 'facebook', costInr: 100, leads: 4 }], byProject: [{ projectId: 'p1', projectName: 'Green Park', costInr: 90, leads: 3 }],
  topLeads: [{ leadId: 'L1', name: 'Asha Rao', costInr: 12.5 }],
  priceMissing: { events: 0, components: [], fx: false },
  ...over,
});
const monthData = (over = {}) => ({
  month: '2026-10', days: [{ day: '2026-10-30', totalInr: 73.45, byComponent: { whatsapp: 30 } }, { day: '2026-10-31', totalInr: 50, byComponent: {}, projected: true }],
  mtdInr: 123.45, byBasis: {}, byComponent: [], infraRate: { month: '2026-09', status: 'provisional', inrPerUnit: 0.5 },
  projection: { projectedTotalInr: 400, lowInr: 300, highInr: 500, method: 'run-rate-7d', confidence: 'medium', basisNote: 'Based on your average daily cost.', label: 'estimate' },
  ...over,
});
const monthsList = { months: [
  { month: '2026-10', totalInr: 123.45, infraStatus: 'provisional' },
  { month: '2026-09', totalInr: 99, infraStatus: 'final' },
] };
const ok = (data) => Promise.resolve({ data });
const renderPanel = () => render(<MemoryRouter><CostingPanel /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  getCostSummary.mockImplementation(() => ok(summary()));
  getCostMonth.mockImplementation(() => ok(monthData()));
  getCostMonths.mockImplementation(() => ok(monthsList));
  getCostPrices.mockImplementation(() => ok({ prices: [], infra: { month: null, status: 'pending', inrPerUnit: 0 }, methodology: 'Costs are our actual provider rates.' }));
});
afterEach(() => { vi.useRealTimers(); });

describe('CostingPanel', () => {
  it('renders totals and the three-label legend', async () => {
    renderPanel();
    expect((await screen.findByTestId('total-inr')).textContent).toBe('₹123.45');
    const legend = screen.getByTestId('cost-legend');
    expect(legend.textContent).toMatch(/Estimated/);
    expect(legend.textContent).toMatch(/Metered/);
    expect(legend.textContent).toMatch(/Allocated/);
    expect(screen.getByText(/of this total is estimated/)).toBeTruthy();
  });

  it('labels the month-end projection as an estimate', async () => {
    renderPanel();
    const card = await screen.findByTestId('projection-card');
    expect(card.textContent).toMatch(/Projected month end/);
    expect(card.textContent).toMatch(/₹400\.00/);
    expect(card.textContent).toMatch(/estimate/);
  });

  it('says not enough data when projection is null', async () => {
    getCostMonth.mockImplementation(() => ok(monthData({ projection: null })));
    renderPanel();
    expect(await screen.findByText(/not enough data yet/i)).toBeTruthy();
  });

  it('shows the empty state', async () => {
    getCostSummary.mockImplementation(() => ok(summary({ totalInr: 0, byComponent: [], byBasis: { metered: 0, estimated: 0, allocated: 0 } })));
    renderPanel();
    expect(await screen.findByText('No usage recorded yet.')).toBeTruthy();
  });

  it('shows an error card and Retry refetches', async () => {
    getCostSummary.mockImplementationOnce(() => Promise.reject({ response: { data: { error: 'boom' } } }));
    renderPanel();
    expect(await screen.findByText('boom')).toBeTruthy();
    const calls = getCostSummary.mock.calls.length;
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(getCostSummary.mock.calls.length).toBeGreaterThan(calls));
    expect((await screen.findByTestId('total-inr')).textContent).toBe('₹123.45');
  });

  it('renders the WhatsApp (Meta) row with its note, plus voices, talk time and templates', async () => {
    renderPanel();
    expect((await screen.findAllByText('WhatsApp (Meta)')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Paid by you directly to Meta/)).toBeTruthy();
    expect(screen.getByText('priya')).toBeTruthy();
    expect(screen.getByText('Sarvam')).toBeTruthy();
    expect(screen.getByText('10 min')).toBeTruthy();
    expect(screen.getByText('Templates sent')).toBeTruthy();
    expect(screen.getByText('Asha Rao').closest('a').getAttribute('href')).toBe('/lead/L1');
    expect(screen.getByText(/Allocated estimate, Sep 2026 rate, provisional/)).toBeTruthy();
  });

  it('month selector loads that month and hides the projection', async () => {
    renderPanel();
    await screen.findByTestId('projection-card');
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-09' } });
    await waitFor(() => expect(getCostMonth).toHaveBeenCalledWith('2026-09'));
    await waitFor(() => expect(screen.queryByTestId('projection-card')).toBeNull());
    expect(getCostSummary).toHaveBeenLastCalledWith({ from: '2026-09-01', to: '2026-09-30' });
  });

  it('selecting the current month clamps `to` to today', async () => {
    renderPanel();
    await screen.findByTestId('total-inr');
    const now = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
    const cur = now.slice(0, 7);
    getCostMonths.mockImplementation(() => ok({ months: [{ month: cur, totalInr: 1, infraStatus: 'provisional' }, { month: '2026-09', totalInr: 99, infraStatus: 'final' }] }));
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-09' } });
    await waitFor(() => expect(getCostMonth).toHaveBeenCalledWith('2026-09'));
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: cur } });
    await waitFor(() => {
      const last = getCostSummary.mock.calls[getCostSummary.mock.calls.length - 1][0];
      expect(last.from).toBe(`${cur}-01`);
      expect(last.to <= now).toBe(true);
    });
  });

  it('shows price-missing and FX notices', async () => {
    getCostSummary.mockImplementation(() => ok(summary({ priceMissing: { events: 3, components: ['llm'], fx: true } })));
    renderPanel();
    expect(await screen.findByText(/3 events are not priced yet; totals may be low/)).toBeTruthy();
    expect(screen.getByText(/USD rates missing for some days/)).toBeTruthy();
  });

  it('polls while visible and stops after unmount', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { unmount } = renderPanel();
    await screen.findByTestId('total-inr');
    const before = getCostSummary.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(30500); });
    expect(getCostSummary.mock.calls.length).toBeGreaterThan(before);
    unmount();
    const after = getCostSummary.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(65000); });
    expect(getCostSummary.mock.calls.length).toBe(after);
  });

  it('does not poll a past month', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderPanel();
    await screen.findByTestId('total-inr');
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-09' } });
    await waitFor(() => expect(getCostMonth).toHaveBeenCalledWith('2026-09'));
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    const n = getCostSummary.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(95000); });
    expect(getCostSummary.mock.calls.length).toBe(n);
  });
});
