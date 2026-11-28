import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('../../api', () => ({ getLeadCost: vi.fn(), getLeadCostEvents: vi.fn() }));
import { getLeadCost, getLeadCostEvents } from '../../api';
import LeadCostBadge from './LeadCostBadge';

const leadCost = {
  leadId: 'L1', totalInr: 12.5,
  byComponent: [
    { component: 'whatsapp', label: 'WhatsApp (Meta)', costInr: 8, events: 2, units: { messages: 2 }, basis: { estimated: 8 } },
    { component: 'tts', label: 'Text to speech', costInr: 3.5, events: 1, units: { chars: 900 }, basis: { metered: 3.5 } },
    { component: 'infra', label: 'Infra (allocated)', costInr: 1, events: 0, units: { interactions: 2 }, basis: 'allocated' },
  ],
  byBasis: { metered: 3.5, estimated: 8, allocated: 1 },
  voice: { byVoice: [{ voice: 'priya', provider: 'sarvam', calls: 1, chars: 900, costInr: 3.5 }], calls: 1, seconds: 120, minutes: 2 },
  whatsapp: { templatesSent: 2, templatesFree: 0, textMessages: 0, byCategory: {} },
  infraIncluded: true, priceMissing: { events: 0, components: [], fx: false },
};

beforeEach(() => { vi.clearAllMocks(); });

describe('LeadCostBadge', () => {
  it('renders nothing when the request fails', async () => {
    getLeadCost.mockRejectedValue(new Error('404'));
    const { container } = render(<LeadCostBadge leadId="L1" />);
    await waitFor(() => expect(getLeadCost).toHaveBeenCalled());
    expect(container.textContent).toBe('');
  });

  it('makes no request without a leadId', () => {
    const { container } = render(<LeadCostBadge leadId={undefined} />);
    expect(getLeadCost).not.toHaveBeenCalled();
    expect(container.textContent).toBe('');
  });

  it('shows the formatted total and a popover with components and basis tags', async () => {
    getLeadCost.mockResolvedValue({ data: leadCost });
    render(<LeadCostBadge leadId="L1" />);
    const pill = await screen.findByTestId('lead-cost-pill');
    expect(pill.textContent).toBe('₹12.50');
    fireEvent.click(pill);
    expect(screen.getByText('WhatsApp (Meta)')).toBeTruthy();
    expect(screen.getByText('Text to speech')).toBeTruthy();
    expect(screen.getByText('Estimated')).toBeTruthy();
    expect(screen.getByText('Metered')).toBeTruthy();
    expect(screen.getByText('Allocated')).toBeTruthy();
    expect(screen.getByText(/Voice: priya \(Sarvam\)/)).toBeTruthy();
    expect(screen.getByText(/Infra is allocated, not metered/)).toBeTruthy();
  });

  it('closes on Escape', async () => {
    getLeadCost.mockResolvedValue({ data: leadCost });
    render(<LeadCostBadge leadId="L1" />);
    fireEvent.click(await screen.findByTestId('lead-cost-pill'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('refetches when refreshKey changes', async () => {
    getLeadCost.mockResolvedValue({ data: leadCost });
    const { rerender } = render(<LeadCostBadge leadId="L1" refreshKey={0} />);
    await screen.findByTestId('lead-cost-pill');
    expect(getLeadCost).toHaveBeenCalledTimes(1);
    rerender(<LeadCostBadge leadId="L1" refreshKey={1} />);
    await waitFor(() => expect(getLeadCost).toHaveBeenCalledTimes(2));
  });

  it('lists recent events with USD and INR', async () => {
    getLeadCost.mockResolvedValue({ data: leadCost });
    getLeadCostEvents.mockResolvedValue({ data: { events: [{ ts: '2026-10-30T10:00:00.000Z', component: 'llm', costInr: 0.84, origUsd: 0.01, basis: 'metered' }], nextCursor: null } });
    render(<LeadCostBadge leadId="L1" />);
    fireEvent.click(await screen.findByTestId('lead-cost-pill'));
    fireEvent.click(screen.getByText('Recent events'));
    const list = await screen.findByTestId('lead-cost-events');
    expect(list.textContent).toMatch(/\$0\.0100 → ₹0\.8400/);
    expect(getLeadCostEvents).toHaveBeenCalledWith('L1', { limit: 10 });
  });
});
