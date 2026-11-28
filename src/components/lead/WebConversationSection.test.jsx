import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

vi.mock('../../api', () => ({ getLeadWebConversations: vi.fn() }));
import { getLeadWebConversations } from '../../api';
import WebConversationSection from './WebConversationSection';

const fakeSocket = () => {
  const handlers = {};
  return {
    on: (e, fn) => { handlers[e] = fn; },
    off: (e) => { delete handlers[e]; },
    fire: (e) => handlers[e] && handlers[e](),
    has: (e) => !!handlers[e],
  };
};

beforeEach(() => vi.clearAllMocks());

describe('WebConversationSection', () => {
  it('shows an empty state when the lead has not chatted', async () => {
    getLeadWebConversations.mockResolvedValue({ data: { data: [] } });
    render(<WebConversationSection leadId="L1" socket={null} />);
    expect(await screen.findByText(/No chat yet/)).toBeTruthy();
    expect(getLeadWebConversations).toHaveBeenCalledWith('L1');
  });

  it("renders the lead's and Priya's messages with the visit header", async () => {
    getLeadWebConversations.mockResolvedValue({
      data: {
        data: [{
          sessionId: 'S1', projectSlug: 'vrindavan-16-18', userMessageCount: 1, startedAt: '2026-11-27T09:00:00Z',
          messages: [
            { role: 'user', text: 'What is the price?', channel: 'voice', at: '2026-11-27T09:00:05Z' },
            { role: 'priya', text: 'It starts at 30 lakh.', channel: 'text', at: '2026-11-27T09:00:07Z' },
          ],
        }],
      },
    });
    render(<WebConversationSection leadId="L1" socket={null} />);
    expect(await screen.findByText('What is the price?')).toBeTruthy();
    expect(screen.getByText('It starts at 30 lakh.')).toBeTruthy();
    expect(screen.getByText('vrindavan-16-18')).toBeTruthy();
    expect(screen.getByText(/1 visit · 1 question/)).toBeTruthy();
    expect(screen.getByText(/Lead · voice/)).toBeTruthy();
  });

  it('reloads when the server pushes web_chat_update, and unsubscribes on unmount', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getLeadWebConversations.mockResolvedValue({ data: { data: [] } });
    const socket = fakeSocket();
    const { unmount } = render(<WebConversationSection leadId="L1" socket={socket} />);
    await waitFor(() => expect(getLeadWebConversations).toHaveBeenCalledTimes(1));
    act(() => { socket.fire('web_chat_update'); socket.fire('web_chat_update'); });
    await act(async () => { vi.advanceTimersByTime(500); });
    await waitFor(() => expect(getLeadWebConversations).toHaveBeenCalledTimes(2));
    unmount();
    expect(socket.has('web_chat_update')).toBe(false);
    vi.useRealTimers();
  });

  it('shows an error line when loading fails', async () => {
    getLeadWebConversations.mockRejectedValue(new Error('boom'));
    render(<WebConversationSection leadId="L1" socket={null} />);
    expect(await screen.findByText(/Could not load the conversation/)).toBeTruthy();
  });
});
