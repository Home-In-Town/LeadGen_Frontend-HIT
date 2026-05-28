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
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

import IntegrationsPage from './IntegrationsPage';

describe('Preservation Property Tests: WhatsApp & Project Source Tabs', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    mockAxiosInstance = axios.create();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    it('for all valid WhatsApp settings, WhatsApp tab renders vendorUid and apiKey fields and save triggers PUT /integrations/whatsapp', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          async (vendorUid, apiKey) => {
            // Setup: mock API returns the generated settings
            mockAxiosInstance.get.mockResolvedValue({
              data: {
                whatsapp: { vendorUid, apiKey },
                externalSource: { sourceUrl: '', webhookSecret: '', isActive: false },
                projectSettings: { salesWebsiteUrl: '' },
                aguken: { agentId: '', clientId: '' },
              },
            });
            mockAxiosInstance.put.mockResolvedValue({ data: {} });

            const { unmount } = render(<IntegrationsPage />);
            await waitForLoad();

            // Switch to WhatsApp tab
            switchToTab('WhatsApp');

            // Assert: WhatsApp heading is visible
            expect(screen.getByText('WhatsApp Integration')).toBeInTheDocument();

            // Assert: vendorUid and apiKey fields are rendered (password type by default)
            const vendorLabel = screen.getByText('Vendor UID');
            const apiLabel = screen.getByText('API Key');
            expect(vendorLabel).toBeInTheDocument();
            expect(apiLabel).toBeInTheDocument();

            // Assert: Save button exists
            const saveButton = screen.getByRole('button', { name: /Save WhatsApp Settings/i });
            expect(saveButton).toBeInTheDocument();

            // Submit the form
            fireEvent.click(saveButton);

            await waitFor(() => {
              // Assert: PUT /integrations/whatsapp was called
              const putCalls = mockAxiosInstance.put.mock.calls;
              const whatsappPuts = putCalls.filter(
                (call) => call[0] && call[0].includes('/integrations/whatsapp')
              );
              expect(whatsappPuts.length).toBeGreaterThanOrEqual(1);

              // Assert: payload contains vendorUid and apiKey
              const lastCall = whatsappPuts[whatsappPuts.length - 1];
              expect(lastCall[1]).toHaveProperty('vendorUid');
              expect(lastCall[1]).toHaveProperty('apiKey');
            });

            unmount();
          }
        ),
        { numRuns: 10 }
      );
    });
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
          async (sourceUrl, webhookSecret, salesWebsiteUrl, isActive) => {
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
          }
        ),
        { numRuns: 10 }
      );
    });
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
          async (sourceUrl, webhookSecret) => {
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
          }
        ),
        { numRuns: 10 }
      );
    });
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
          async (tabSequence) => {
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
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /* ================================================================== */
  /* Property 2e: Password Field Visibility Toggle                       */
  /* Validates: Requirements 3.1, 3.2 (password field behavior)          */
  /* ================================================================== */
  describe('Visibility Toggle Preservation', () => {
    it('for all visibility toggle sequences on remaining fields, password fields toggle correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom('whatsappVendor', 'whatsappApi', 'externalSecret'),
            { minLength: 1, maxLength: 15 }
          ),
          async (toggleSequence) => {
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

            // Track expected visibility state for each field
            const visibilityState = {
              whatsappVendor: false,
              whatsappApi: false,
              externalSecret: false,
            };

            for (const field of toggleSequence) {
              // Switch to the correct tab for the field
              if (field === 'whatsappVendor' || field === 'whatsappApi') {
                switchToTab('WhatsApp');
              } else {
                switchToTab('Project Source');
              }

              // Find the toggle button for this field
              let toggleButton;
              if (field === 'whatsappVendor') {
                const vendorInput = screen.getByPlaceholderText('Your Vendor UID');
                toggleButton = vendorInput.parentElement.querySelector('button');
              } else if (field === 'whatsappApi') {
                const apiInput = screen.getByPlaceholderText('Your API Key');
                toggleButton = apiInput.parentElement.querySelector('button');
              } else {
                const secretInput = screen.getByPlaceholderText('Enter secret key');
                toggleButton = secretInput.parentElement.querySelector('button');
              }

              // Toggle visibility
              fireEvent.click(toggleButton);
              visibilityState[field] = !visibilityState[field];

              // Verify the input type matches expected state
              let input;
              if (field === 'whatsappVendor') {
                input = screen.getByPlaceholderText('Your Vendor UID');
              } else if (field === 'whatsappApi') {
                input = screen.getByPlaceholderText('Your API Key');
              } else {
                input = screen.getByPlaceholderText('Enter secret key');
              }

              const expectedType = visibilityState[field] ? 'text' : 'password';
              expect(input.type).toBe(expectedType);
            }

            unmount();
          }
        ),
        { numRuns: 15 }
      );
    });
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
