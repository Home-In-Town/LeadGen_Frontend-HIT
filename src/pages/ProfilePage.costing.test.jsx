import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api', () => ({
  getProfile: vi.fn(() => Promise.resolve({ data: { name: 'Owner', companyName: 'Acme', email: 'o@x.in', mobile: '9999999999' } })),
  updateProfile: vi.fn(), changePin: vi.fn(),
  getHomeinTownStatus: vi.fn(() => Promise.resolve({ data: { linked: false } })),
  verifyHitAccount: vi.fn(), confirmLinkHomeintown: vi.fn(), unlinkHomeintown: vi.fn(),
  getUsageStats: vi.fn(() => Promise.resolve({ data: { stats: { leads: { total: 1, hot: 0, warm: 0, cold: 1 }, voice: { totalMinutes: 0 }, whatsapp: { templatesSent: 0, aiReplies: 0 } } } })),
  syncIntegrationStatus: vi.fn(() => Promise.resolve({ data: { integrations: {} } })),
  getCostSummary: vi.fn(() => Promise.reject(new Error('costing down'))),
  getCostMonth: vi.fn(() => Promise.reject(new Error('costing down'))),
  getCostMonths: vi.fn(() => Promise.reject(new Error('costing down'))),
  getCostPrices: vi.fn(),
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1', role: 'owner' }, checkAuth: vi.fn() }) }));
vi.mock('../context/NotificationContext', () => ({ useNotifications: () => ({ addToast: vi.fn() }) }));

import ProfilePage from './ProfilePage';

beforeEach(() => vi.clearAllMocks());

describe('ProfilePage costing panel', () => {
  it('renders the panel as the last card, before Account Info, and survives a failing costing API', async () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    const panel = await screen.findByTestId('costing-panel');
    expect(await screen.findByText('Retry')).toBeTruthy();
    const accountInfo = screen.getByText(/Account ID:/);
    // Panel comes before the Account Info footer in document order.
    expect(panel.compareDocumentPosition(accountInfo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The rest of the page still renders.
    expect(screen.getByText('Costing / Usage')).toBeTruthy();
  });
});
