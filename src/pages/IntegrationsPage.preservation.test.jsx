/**
 * Preservation Property Tests — WhatsApp & Project Source Tabs
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 *
 * These tests capture the EXISTING (baseline) behavior of the WhatsApp and
 * Project Source tabs on the UNFIXED code. They MUST PASS before and after
 * the Aguken removal fix, ensuring no regressions are introduced.
 *
 * Uses fast-check for property-based testing to verify behavior across
 * many random inputs (vendorUid, apiKey, URLs, secrets, booleans).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import axios from 'axios';

// Mock axios to prevent real network calls
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn().mockResolvedValue({
      data: {
        whatsapp: { vendorUid: '', apiKey: '' },
        externalSource: { sourceUrl: '', webhookSecret: '', isActive: false },
        projectSettings: { salesWebsiteUrl: '' },
        aguken: { agentId: '', clientId: '' },
      },
    }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      post: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    },
    __mockInstance: mockAxiosInstance,
  };
});

// Mock the NotificationContext
vi.mock('../context/NotificationContext', () => ({
  useNotifications: () => ({
    addToast: vi.fn(),
  }),
}));

// The page calls useNavigate(); these tests render it without a Router.
const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

import IntegrationsPage from './IntegrationsPage';

// Property tests render the page once per generated value. Under a loaded
// machine the default 5 s budget is too small, and a timed-out property keeps
// rendering in the background into later tests.
const PROPERTY_TIMEOUT_MS = 60000;

describe('Preservation Property Tests: WhatsApp & Project Source Tabs', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    mockAxiosInstance = axios.create();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /* ------------------------------------------------------------------ */
  /* Helper: run one property iteration on a clean DOM. A failed run (or */
  /* a fast-check shrink re-run) must not leave its page mounted, or the */
  /* next run finds every text twice.                                    */
  /* ------------------------------------------------------------------ */
  const isolated = (body) => async (...args) => {
    cleanup();
    try {
      await body(...args);
    } finally {
      cleanup();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Helper: wait for loading to finish                                  */
  /* ------------------------------------------------------------------ */
  const waitForLoad = async () => {
    await waitFor(() => {
      expect(screen.queryByText('Loading Integrations')).not.toBeInTheDocument();
    });
  };

  /* ------------------------------------------------------------------ */
  /* Helper: switch to a tab by clicking its sidebar button              */
  /* ------------------------------------------------------------------ */
  const switchToTab = (tabTitle) => {
    const tabButton = screen.getByText(tabTitle).closest('button');
    fireEvent.click(tabButton);
  };

  /* ================================================================== */
  /* Property 2a: WhatsApp Tab Renders and Saves Correctly              */
  /* Validates: Requirements 3.1, 3.3                                   */
  /* ================================================================== */
  describe('WhatsApp Tab Preservation', () => {
    // The WhatsApp tab is status-only: numbers come from the phone-numbers
    // endpoint and setup happens on /whatsapp-setup. Legacy vendorUid/apiKey
    // values in the settings response are never shown or saved from here.
    it('for any legacy WhatsApp credentials in the settings response, the WhatsApp tab shows the connection status, renders no credential fields and sends setup to /whatsapp-setup', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          isolated(async (vendorUid, apiKey) => {
            mockNavigate.mockClear();
            mockAxiosInstance.put.mockClear();
            mockAxiosInstance.get.mockResolvedValue({
              data: {
                whatsapp: { vendorUid, apiKey },
                externalSource: { sourceUrl: '', webhookSecret: '', isActive: false },
                projectSettings: { salesWebsiteUrl: '' },
                aguken: { agentId: '', clientId: '' },
              },
            });

            render(<IntegrationsPage />);
            await waitForLoad();

            switchToTab('WhatsApp');

            expect(screen.getByText('WhatsApp Integration')).toBeInTheDocument();
            expect(screen.getByText('No WhatsApp numbers connected yet')).toBeInTheDocument();

            // No legacy credentials form
            expect(screen.queryByText('Vendor UID')).not.toBeInTheDocument();
            expect(screen.queryByText('API Key')).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Save WhatsApp Settings/i })).not.toBeInTheDocument();
            expect(document.querySelectorAll('input')).toHaveLength(0);

            fireEvent.click(screen.getAllByRole('button', { name: /Connect WhatsApp/i })[0]);
            expect(mockNavigate).toHaveBeenCalledWith('/whatsapp-setup');

            const whatsappPuts = mockAxiosInstance.put.mock.calls.filter(
              (call) => call[0] && call[0].includes('/integrations/whatsapp')
            );
            expect(whatsappPuts).toHaveLength(0);
          })
        ),
        { numRuns: 10 }
      );
    }, PROPERTY_TIMEOUT_MS);
  });

  /* ================================================================== */
  /* Property 2b: Project Source Tab Renders and Saves Correctly         */
  /* Validates: Requirements 3.2, 3.4                                   */
  /* ================================================================== */
  describe('Project Source Tab Preservation', () => {
    it('for all valid Project Source settings, tab renders correctly and save triggers correct API calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.webUrl(),
          fc.boolean(),
          isolated(async (sourceUrl, webhookSecret, salesWebsiteUrl, isActive) => {
            // Setup: mock API returns the generated settings
            mockAxiosInstance.get.mockResolvedValue({
              data: {
                whatsapp: { vendorUid: '', apiKey: '' },
                externalSource: { sourceUrl, webhookSecret, isActive },
                projectSettings: { salesWebsiteUrl },
                aguken: { agentId: '', clientId: '' },
              },
            });
            mockAxiosInstance.put.mockResolvedValue({ data: {} });

            const { unmount } = render(<IntegrationsPage />);
            await waitForLoad();

            // Switch to Project Source tab
            switchToTab('Project Source');

            // Assert: Project Source heading is visible
            expect(screen.getByText('Project Source Webhook')).toBeInTheDocument();

            // Assert: sourceUrl field is rendered
            const sourceUrlInput = screen.getByPlaceholderText('https://site.com/webhook');
            expect(sourceUrlInput).toBeInTheDocument();

            // Assert: salesWebsiteUrl field is rendered
            const salesInput = screen.getByPlaceholderText('https://www.yoursite.com');
            expect(salesInput).toBeInTheDocument();

            // Assert: webhookSecret field is rendered (via label)
            expect(screen.getByText('Webhook Secret / API Key')).toBeInTheDocument();

            // Assert: isActive checkbox is rendered
            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toBeInTheDocument();

            // Assert: Test Connection button is rendered
            const testButton = screen.getByRole('button', { name: /Test Connection/i });
            expect(testButton).toBeInTheDocument();

            // Assert: Save button exists
            const saveButton = screen.getByRole('button', { name: /Save Settings/i });
            expect(saveButton).toBeInTheDocument();

            // Submit the form
            fireEvent.click(saveButton);

            await waitFor(() => {
              const putCalls = mockAxiosInstance.put.mock.calls;

              // Assert: PUT /integrations/external-source was called
              const externalPuts = putCalls.filter(
                (call) => call[0] && call[0].includes('/integrations/external-source')
              );
              expect(externalPuts.length).toBeGreaterThanOrEqual(1);

              // Assert: PUT /integrations/project-settings was called
              const projectPuts = putCalls.filter(
                (call) => call[0] && call[0].includes('/integrations/project-settings')
              );
              expect(projectPuts.length).toBeGreaterThanOrEqual(1);
            });

            unmount();
          })
        ),
        { numRuns: 10 }
      );
    }, PROPERTY_TIMEOUT_MS);
  });

  /* ================================================================== */
  /* Property 2c: Test Connection Calls Correct Endpoint                 */
  /* Validates: Requirements 3.5                                         */
  /* ================================================================== */
  describe('Test Connection Preservation', () => {
    it('Test Connection calls POST /api/projects/test-connection with sourceUrl and webhookSecret payload', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          fc.string({ minLength: 1, maxLength: 50 }),
          isolated(async (sourceUrl, webhookSecret) => {
            mockAxiosInstance.get.mockResolvedValue({
              data: {
                whatsapp: { vendorUid: '', apiKey: '' },
                externalSource: { sourceUrl, webhookSecret, isActive: true },
                projectSettings: { salesWebsiteUrl: '' },
                aguken: { agentId: '', clientId: '' },
              },
            });

            const { unmount } = render(<IntegrationsPage />);
            await waitForLoad();

            // Switch to Project Source tab
            switchToTab('Project Source');

            // Click Test Connection
            const testButton = screen.getByRole('button', { name: /Test Connection/i });
            fireEvent.click(testButton);

            await waitFor(() => {
              // Assert: POST to /api/projects/test-connection was called
              const postCalls = axios.post.mock.calls;
              expect(postCalls.length).toBeGreaterThanOrEqual(1);

              const lastPostCall = postCalls[postCalls.length - 1];
              expect(lastPostCall[0]).toContain('/api/projects/test-connection');

              // Assert: payload contains sourceUrl and webhookSecret
              expect(lastPostCall[1]).toHaveProperty('sourceUrl', sourceUrl);
              expect(lastPostCall[1]).toHaveProperty('webhookSecret');
            });

            unmount();
          })
        ),
        { numRuns: 10 }
      );
    }, PROPERTY_TIMEOUT_MS);
  });

  /* ================================================================== */
  /* Property 2d: Tab Switching — Only Correct Panel Renders             */
  /* Validates: Requirements 3.1, 3.2                                    */
  /* ================================================================== */
  describe('Tab Switching Preservation', () => {
    it('for all tab switch sequences between whatsapp and external, only the correct panel renders', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constantFrom('whatsapp', 'external'), { minLength: 1, maxLength: 10 }),
          isolated(async (tabSequence) => {
            mockAxiosInstance.get.mockResolvedValue({
              data: {
                whatsapp: { vendorUid: 'test-uid', apiKey: 'test-key' },
                externalSource: { sourceUrl: 'https://example.com', webhookSecret: 'secret', isActive: true },
                projectSettings: { salesWebsiteUrl: 'https://sales.com' },
                aguken: { agentId: '', clientId: '' },
              },
            });

            const { unmount } = render(<IntegrationsPage />);
            await waitForLoad();

            for (const tab of tabSequence) {
              if (tab === 'whatsapp') {
                switchToTab('WhatsApp');

                // WhatsApp panel should be visible
                expect(screen.getByText('WhatsApp Integration')).toBeInTheDocument();
                // Project Source panel should NOT be visible
                expect(screen.queryByText('Project Source Webhook')).not.toBeInTheDocument();
              } else {
                switchToTab('Project Source');

                // Project Source panel should be visible
                expect(screen.getByText('Project Source Webhook')).toBeInTheDocument();
                // WhatsApp panel should NOT be visible
                expect(screen.queryByText('WhatsApp Integration')).not.toBeInTheDocument();
              }
            }

            unmount();
          })
        ),
        { numRuns: 20 }
      );
    }, PROPERTY_TIMEOUT_MS);
  });

  /* ================================================================== */
  /* Property 2e: Password Field Visibility Toggle                       */
  /* Validates: Requirements 3.1, 3.2 (password field behavior)          */
  /* ================================================================== */
  describe('Visibility Toggle Preservation', () => {
    // The webhook secret is the only password field left (the WhatsApp tab
    // has no credential fields). Its visibility survives tab switches.
    it('for all sequences of secret toggles and tab switches, the webhook secret field toggles correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom('externalSecret', 'whatsappTab', 'externalTab'),
            { minLength: 1, maxLength: 15 }
          ),
          isolated(async (actionSequence) => {
            mockAxiosInstance.get.mockResolvedValue({
              data: {
                whatsapp: { vendorUid: 'test-uid', apiKey: 'test-key' },
                externalSource: { sourceUrl: 'https://example.com', webhookSecret: 'secret', isActive: true },
                projectSettings: { salesWebsiteUrl: 'https://sales.com' },
                aguken: { agentId: '', clientId: '' },
              },
            });

            const { unmount } = render(<IntegrationsPage />);
            await waitForLoad();

            let secretVisible = false;

            for (const action of actionSequence) {
              if (action === 'whatsappTab') {
                switchToTab('WhatsApp');
                expect(screen.queryByPlaceholderText('Enter secret key')).not.toBeInTheDocument();
                continue;
              }

              switchToTab('Project Source');

              if (action === 'externalSecret') {
                const secretInput = screen.getByPlaceholderText('Enter secret key');
                fireEvent.click(secretInput.parentElement.querySelector('button'));
                secretVisible = !secretVisible;
              }

              const input = screen.getByPlaceholderText('Enter secret key');
              expect(input.type).toBe(secretVisible ? 'text' : 'password');
            }

            unmount();
          })
        ),
        { numRuns: 15 }
      );
    }, PROPERTY_TIMEOUT_MS);
  });

  /* ================================================================== */
  /* Property 2f: Loading Spinner Displays During Fetch                  */
  /* Validates: Requirements 3.1, 3.2 (loading state)                    */
  /* ================================================================== */
  describe('Loading State Preservation', () => {
    it('loading spinner displays while GET /api/owners/integrations is in flight', async () => {
      // Make the GET request hang (never resolve immediately)
      let resolveGet;
      mockAxiosInstance.get.mockImplementation(
        () => new Promise((resolve) => { resolveGet = resolve; })
      );

      const { unmount } = render(<IntegrationsPage />);

      // Assert: Loading spinner is visible
      expect(screen.getByText('Loading Integrations')).toBeInTheDocument();

      // Resolve the GET request
      resolveGet({
        data: {
          whatsapp: { vendorUid: '', apiKey: '' },
          externalSource: { sourceUrl: '', webhookSecret: '', isActive: false },
          projectSettings: { salesWebsiteUrl: '' },
          aguken: { agentId: '', clientId: '' },
        },
      });

      // Assert: Loading spinner disappears
      await waitFor(() => {
        expect(screen.queryByText('Loading Integrations')).not.toBeInTheDocument();
      });

      unmount();
    });
  });

  /* ================================================================== */
  /* Property 2g: Page Header Renders Correctly                          */
  /* Validates: Requirements 3.1, 3.2 (page structure)                   */
  /* ================================================================== */
  describe('Page Header Preservation', () => {
    it('page header renders "System Integrations" badge, "Integrations" title, and subtitle', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          whatsapp: { vendorUid: '', apiKey: '' },
          externalSource: { sourceUrl: '', webhookSecret: '', isActive: false },
          projectSettings: { salesWebsiteUrl: '' },
          aguken: { agentId: '', clientId: '' },
        },
      });

      const { unmount } = render(<IntegrationsPage />);
      await waitForLoad();

      // Assert: "System Integrations" badge
      expect(screen.getByText('System Integrations')).toBeInTheDocument();

      // Assert: "Integrations" title
      expect(screen.getByText('Integrations')).toBeInTheDocument();

      // Assert: subtitle
      expect(
        screen.getByText('Manage all external services & automation providers')
      ).toBeInTheDocument();

      unmount();
    });
  });
});
