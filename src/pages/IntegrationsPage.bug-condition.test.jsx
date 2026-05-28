/**
 * Bug Condition Exploration Test — Aguken Voice Tab Removal
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3**
 *
 * This test encodes the EXPECTED (fixed) behavior:
 *   - No "Aguken Voice" text in the DOM
 *   - No input fields with Aguken-related placeholders
 *   - No "Save Aguken Settings" button
 *   - No HTTP PUT to /api/owners/integrations/aguken
 *   - activeTab does NOT default to 'call'
 *
 * On UNFIXED code, these assertions will FAIL — confirming the bug exists.
 * After the fix is applied, these assertions will PASS — confirming the fix works.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
      post: vi.fn().mockResolvedValue({ data: { success: true } }),
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

describe('Bug Condition Exploration: Aguken Voice Tab', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    // Get the mock axios instance
    mockAxiosInstance = axios.create();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should NOT render any element with text "Aguken Voice"', async () => {
    render(<IntegrationsPage />);

    // Wait for the component to finish loading (fetchIntegrations resolves)
    await waitFor(() => {
      expect(screen.queryByText('Loading Integrations')).not.toBeInTheDocument();
    });

    // Assert: No "Aguken Voice" text should exist anywhere in the DOM
    const agukenElements = screen.queryAllByText(/Aguken Voice/i);
    expect(agukenElements).toHaveLength(0);
  });

  it('should NOT contain input fields with placeholder "agent_abc123" or "client_xyz789"', async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading Integrations')).not.toBeInTheDocument();
    });

    // Assert: No input with Aguken-related placeholders
    const agentInput = screen.queryByPlaceholderText(/agent_abc123/i);
    const clientInput = screen.queryByPlaceholderText(/client_xyz789/i);

    expect(agentInput).not.toBeInTheDocument();
    expect(clientInput).not.toBeInTheDocument();
  });

  it('should NOT contain a button with text "Save Aguken Settings"', async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading Integrations')).not.toBeInTheDocument();
    });

    // Assert: No "Save Aguken Settings" button
    const saveAgukenButton = screen.queryByRole('button', { name: /Save Aguken Settings/i });
    expect(saveAgukenButton).not.toBeInTheDocument();
  });

  it('should NOT make an HTTP PUT request to /api/owners/integrations/aguken on any user interaction', async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading Integrations')).not.toBeInTheDocument();
    });

    // Try to find and interact with any save button that might trigger Aguken save
    const allButtons = screen.queryAllByRole('button');
    for (const button of allButtons) {
      if (/aguken/i.test(button.textContent) || /save aguken/i.test(button.textContent)) {
        fireEvent.click(button);
      }
    }

    // Wait a tick for any async operations
    await waitFor(() => {});

    // Assert: No PUT call was made to /integrations/aguken
    const putCalls = mockAxiosInstance.put.mock.calls;
    const agukenPutCalls = putCalls.filter(
      (call) => call[0] && call[0].includes('/integrations/aguken')
    );
    expect(agukenPutCalls).toHaveLength(0);
  });

  it('should NOT default activeTab to "call"', async () => {
    render(<IntegrationsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Loading Integrations')).not.toBeInTheDocument();
    });

    // If activeTab defaults to 'call', the Aguken content panel would be visible.
    // We check that the Aguken panel heading is NOT visible (it shows when activeTab === 'call')
    const agukenHeading = screen.queryByRole('heading', { name: /Aguken Voice/i });
    expect(agukenHeading).not.toBeInTheDocument();

    // Additionally, the "AI Voice Automation" subtitle should not be present
    const agukenSubtitle = screen.queryByText(/AI Voice Automation/i);
    expect(agukenSubtitle).not.toBeInTheDocument();
  });
});
