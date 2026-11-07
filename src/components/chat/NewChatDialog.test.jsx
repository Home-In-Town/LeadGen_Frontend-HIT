/**
 * NewChatDialog — Meta error guidance: 131026 = number can't receive WhatsApp,
 * 131047 = 24-hour window (the only code that shows the window text).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../api', () => ({
  listWATemplates: vi.fn(() => Promise.resolve({
    data: { data: [{ id: 't1', name: 'welcome_offer', status: 'APPROVED', category: 'MARKETING', language: 'en' }] },
  })),
}));

import NewChatDialog from './NewChatDialog';

const answer = (status, body) => vi.fn(() => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) }));

async function submitWith(fetchMock) {
  vi.stubGlobal('fetch', fetchMock);
  render(<NewChatDialog open onClose={vi.fn()} onSuccess={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '9000000000' } });
  fireEvent.change(await screen.findByLabelText('Select template'), { target: { value: 'welcome_offer' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send Template' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('NewChatDialog — send errors', () => {
  it("131026 → number can't receive WhatsApp, no 24-hour window text", async () => {
    await submitWith(answer(400, {
      error: 'This number is not on WhatsApp or cannot receive messages.',
      errorCode: 131026,
    }));
    expect(await screen.findByText("📵 Number can't receive WhatsApp")).toBeInTheDocument();
    expect(screen.getByText('This number is not on WhatsApp or cannot receive messages.')).toBeInTheDocument();
    expect(screen.getByText(/Check the number and country code/)).toBeInTheDocument();
    expect(screen.queryByText(/24-Hour Window/)).not.toBeInTheDocument();
    expect(screen.queryByText(/re-initiate the conversation/)).not.toBeInTheDocument();
  });

  it('131047 → 24-hour window guidance', async () => {
    await submitWith(answer(400, { error: 'Template required to re-initiate conversation.', errorCode: 131047 }));
    expect(await screen.findByText('ℹ️ 24-Hour Window Expired')).toBeInTheDocument();
    expect(screen.getByText(/Select a template above to re-initiate the conversation/)).toBeInTheDocument();
    expect(screen.queryByText(/can't receive WhatsApp/)).not.toBeInTheDocument();
  });

  it('131026 sent as a string code is mapped the same way', async () => {
    await submitWith(answer(400, { errorCode: '131026' }));
    expect(await screen.findByText("📵 Number can't receive WhatsApp")).toBeInTheDocument();
    expect(screen.getByText('This number is not on WhatsApp or cannot receive messages.')).toBeInTheDocument();
  });

  it('other codes show the server text as a generic error', async () => {
    await submitWith(answer(400, { error: 'A required template value is missing.', errorCode: 132000 }));
    expect(await screen.findByText('❌ Error')).toBeInTheDocument();
    expect(screen.getByText('A required template value is missing.')).toBeInTheDocument();
    expect(screen.queryByText(/24-Hour Window/)).not.toBeInTheDocument();
  });
});
