/**
 * ChatDashboard — template send error path, with mocked API, contexts and
 * light stand-ins for the chat panels (the real panels have their own tests).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  user: { id: 'owner1', name: 'Owner One', role: 'owner' },
  notif: { socket: null, addToast: null },
}));

vi.mock('../api', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: { data: { id: 'L1', first_name: 'Test' } } })) },
  getChatConversations: vi.fn(() => Promise.resolve({ data: { data: [], hasMore: false } })),
  getChatMessages: vi.fn(() => Promise.resolve({ data: { data: [], hasMore: false } })),
  sendChatMessage: vi.fn(),
  sendChatTemplate: vi.fn(),
  markChatAsRead: vi.fn(() => Promise.resolve({})),
  listWAPhoneNumbers: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: h.user }) }));
vi.mock('../context/NotificationContext', () => ({ useNotifications: () => h.notif }));

// Stand-ins: the message list shows each bubble's status and error; the
// template picker offers one template.
vi.mock('../components/chat', () => ({
  ConversationSidebar: () => null,
  ContactInfoPanel: () => null,
  BulkActionToolbar: () => null,
  NewChatDialog: () => null,
  MessagePanel: ({ messages, onSendTemplate }) => (
    <div>
      <button type="button" onClick={onSendTemplate}>Send template</button>
      <ul aria-label="messages">
        {messages.map((m) => (
          <li key={m._id} data-status={m.deliveryStatus || 'pending'}>
            {m.content}
            {m.deliveryError ? ` | ${m.deliveryError}` : ''}
          </li>
        ))}
      </ul>
    </div>
  ),
  TemplatePicker: ({ open, onSelectTemplate }) => (open ? (
    <div role="dialog" aria-label="Templates">
      <button type="button" onClick={() => onSelectTemplate('site_visit_offer')}>site_visit_offer</button>
    </div>
  ) : null),
}));

import { sendChatTemplate } from '../api';
import ChatDashboard from './ChatDashboard';

const renderChat = () => render(
  <MemoryRouter initialEntries={['/chat/whatsapp/L1']}>
    <Routes>
      <Route path="/chat/whatsapp/:leadId" element={<ChatDashboard />} />
    </Routes>
  </MemoryRouter>,
);

async function sendTemplate() {
  renderChat();
  fireEvent.click(await screen.findByRole('button', { name: 'Send template' }));
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Templates' })).getByRole('button', { name: 'site_visit_offer' }));
}

const bubbles = () => within(screen.getByRole('list', { name: 'messages' })).queryAllByRole('listitem');

beforeEach(() => {
  h.notif = { socket: null, addToast: vi.fn() };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ChatDashboard — template send errors', () => {
  it('keeps the bubble as failed with the server reason and toasts it with the Meta code', async () => {
    vi.mocked(sendChatTemplate).mockRejectedValue({
      response: { status: 400, data: { error: 'The template needs a header image.', errorCode: 132012 } },
    });
    await sendTemplate();

    expect(sendChatTemplate).toHaveBeenCalledWith('L1', { templateName: 'site_visit_offer' });
    await waitFor(() => expect(bubbles()[0]).toHaveAttribute('data-status', 'failed'));
    expect(bubbles()).toHaveLength(1);
    expect(bubbles()[0]).toHaveTextContent('Template: site_visit_offer | The template needs a header image.');
    expect(h.notif.addToast).toHaveBeenCalledWith(
      'The template needs a header image. (code 132012)', 'error', 'Template not sent');
    // The picker closed.
    expect(screen.queryByRole('dialog', { name: 'Templates' })).not.toBeInTheDocument();
  });

  it('a server error without a body falls back to a generic reason, no code', async () => {
    vi.mocked(sendChatTemplate).mockRejectedValue({ response: { status: 500, data: {} } });
    await sendTemplate();
    await waitFor(() => expect(h.notif.addToast).toHaveBeenCalledWith('Failed to send template', 'error', 'Template not sent'));
    expect(bubbles()[0]).toHaveAttribute('data-status', 'failed');
  });

  it('no server answer: says the server could not be reached', async () => {
    vi.mocked(sendChatTemplate).mockRejectedValue(new Error('Network Error'));
    await sendTemplate();
    const text = 'Could not reach the server. Check your connection and try again.';
    await waitFor(() => expect(h.notif.addToast).toHaveBeenCalledWith(text, 'error', 'Template not sent'));
    expect(bubbles()[0]).toHaveTextContent(text);
  });

  it('unconfirmed send (202): the saved bubble replaces the temporary one and the owner is told to wait', async () => {
    vi.mocked(sendChatTemplate).mockResolvedValue({
      status: 202,
      data: {
        unconfirmed: true,
        data: { _id: 'm1', content: 'Template: site_visit_offer', deliveryStatus: 'sending' },
      },
    });
    await sendTemplate();
    await waitFor(() => expect(bubbles()[0]).toHaveAttribute('data-status', 'sending'));
    expect(bubbles()).toHaveLength(1);
    expect(h.notif.addToast).toHaveBeenCalledWith(
      'WhatsApp has not confirmed yet. Check in a minute before sending again.', 'info', 'Sending…');
  });
});
