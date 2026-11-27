import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const api = vi.hoisted(() => ({
  getInstagramLoginStatus: vi.fn(),
  initiateInstagramLogin: vi.fn(),
  disconnectInstagramLogin: vi.fn(),
}));
const addToast = vi.hoisted(() => vi.fn());

vi.mock('../api', () => api);
vi.mock('../context/NotificationContext', () => ({
  useNotifications: () => ({ addToast }),
}));

import InstagramLoginCard from './InstagramLoginCard';
import { IG_ERROR_TEXT } from '../utils/igLoginErrors';

const SCOPES = [
  'instagram_business_basic',
  'instagram_business_content_publish',
  'instagram_business_manage_comments',
  'instagram_business_manage_messages',
];

const connectedStatus = (over = {}) => ({
  appConfigured: true,
  connected: true,
  username: 'test_business',
  accountType: 'BUSINESS',
  tokenExpiresAt: '2030-01-01T00:00:00.000Z',
  daysLeft: 57,
  tokenExpired: false,
  grantedScopes: SCOPES,
  missingScopes: [],
  webhookSubscribed: true,
  state: 'connected',
  ...over,
});

const renderCard = (url = '/integrations?tab=instagram') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <InstagramLoginCard />
    </MemoryRouter>
  );

describe('InstagramLoginCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it('shows a not-configured notice', async () => {
    api.getInstagramLoginStatus.mockResolvedValue({ data: { appConfigured: false, connected: false, state: 'not_connected' } });
    renderCard();
    expect(await screen.findByText(/not configured on the server/i)).toBeTruthy();
    expect(screen.queryByText('Connect with Instagram')).toBeNull();
  });

  it('shows Connect button and starts the login', async () => {
    api.getInstagramLoginStatus.mockResolvedValue({ data: { appConfigured: true, connected: false, state: 'not_connected' } });
    renderCard();
    fireEvent.click(await screen.findByText('Connect with Instagram'));
    expect(api.initiateInstagramLogin).toHaveBeenCalledTimes(1);
  });

  it('shows username and expiry when connected', async () => {
    api.getInstagramLoginStatus.mockResolvedValue({ data: connectedStatus() });
    renderCard();
    expect(await screen.findByText('@test_business')).toBeTruthy();
    expect(screen.getByText(/57 days left/)).toBeTruthy();
    expect(screen.getByText(/Live updates: on/)).toBeTruthy();
  });

  it('asks for confirmation before disconnecting', async () => {
    api.getInstagramLoginStatus.mockResolvedValue({ data: connectedStatus() });
    api.disconnectInstagramLogin.mockResolvedValue({ data: { success: true } });
    const confirmSpy = vi.spyOn(window, 'confirm');

    confirmSpy.mockReturnValueOnce(false);
    renderCard();
    fireEvent.click(await screen.findByText('Disconnect'));
    expect(api.disconnectInstagramLogin).not.toHaveBeenCalled();

    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(screen.getByText('Disconnect'));
    await waitFor(() => expect(api.disconnectInstagramLogin).toHaveBeenCalledTimes(1));
    confirmSpy.mockRestore();
  });

  it.each(Object.keys(IG_ERROR_TEXT))('shows the message for ig_error=%s', async (code) => {
    api.getInstagramLoginStatus.mockResolvedValue({ data: { appConfigured: true, connected: false, state: 'not_connected' } });
    renderCard(`/integrations?tab=instagram&ig_error=${code}`);
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.some((a) => a.textContent.includes(IG_ERROR_TEXT[code]))).toBe(true);
  });

  it('falls back to the unknown message for an unrecognised code', async () => {
    api.getInstagramLoginStatus.mockResolvedValue({ data: { appConfigured: true, connected: false, state: 'not_connected' } });
    renderCard('/integrations?tab=instagram&ig_error=something_new');
    expect(await screen.findByText(IG_ERROR_TEXT.unknown)).toBeTruthy();
  });

  it('shows an expired banner and Reconnect button', async () => {
    api.getInstagramLoginStatus.mockResolvedValue({ data: connectedStatus({ state: 'expired', tokenExpired: true }) });
    renderCard();
    expect(await screen.findByText(/connection expired/i)).toBeTruthy();
    fireEvent.click(screen.getByText('Reconnect Instagram'));
    expect(api.initiateInstagramLogin).toHaveBeenCalled();
  });

  it('shows an expiring banner', async () => {
    api.getInstagramLoginStatus.mockResolvedValue({ data: connectedStatus({ state: 'expiring', daysLeft: 3 }) });
    renderCard();
    expect(await screen.findByText(/Token expires in 3 days/)).toBeTruthy();
  });

  it('lists missing permissions', async () => {
    api.getInstagramLoginStatus.mockResolvedValue({
      data: connectedStatus({
        state: 'missing_scopes',
        grantedScopes: [SCOPES[0]],
        missingScopes: [SCOPES[3]],
      }),
    });
    renderCard();
    expect(await screen.findByText(/instagram_business_manage_messages/)).toBeTruthy();
    expect(screen.getByText('Reconnect and allow all permissions')).toBeTruthy();
  });
});
