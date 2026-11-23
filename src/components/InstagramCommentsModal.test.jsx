import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const api = vi.hoisted(() => ({
  getInstagramPostComments: vi.fn(),
  replyToInstagramComment: vi.fn(),
}));
vi.mock('../api', () => api);

import InstagramCommentsModal from './InstagramCommentsModal';

const comment = { id: 'c1', text: 'Nice post', username: 'fan', timestamp: '2030-01-01T00:00:00.000Z' };

const setup = () => {
  const addToast = vi.fn();
  render(<InstagramCommentsModal post={{ id: 'm1' }} pageId="ig:123" addToast={addToast} onClose={() => {}} />);
  return addToast;
};

describe('InstagramCommentsModal', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('lists comments for the post and page', async () => {
    api.getInstagramPostComments.mockResolvedValue({ data: { success: true, comments: [comment] } });
    setup();
    expect(await screen.findByText('Nice post')).toBeTruthy();
    expect(api.getInstagramPostComments).toHaveBeenCalledWith('m1', { pageId: 'ig:123' });
  });

  it('sends a reply with message and pageId', async () => {
    api.getInstagramPostComments.mockResolvedValue({ data: { success: true, comments: [comment] } });
    api.replyToInstagramComment.mockResolvedValue({ data: { success: true, replyId: 'r1' } });
    const addToast = setup();
    const input = await screen.findByLabelText('Reply to fan');
    fireEvent.change(input, { target: { value: 'Thanks!' } });
    fireEvent.click(screen.getByText('Send'));
    await waitFor(() =>
      expect(api.replyToInstagramComment).toHaveBeenCalledWith('c1', { message: 'Thanks!' }, { pageId: 'ig:123' })
    );
    expect(await screen.findByText('Thanks!')).toBeTruthy();
    expect(addToast).toHaveBeenCalledWith('Reply sent', 'success');
  });

  it('shows the backend error when loading fails', async () => {
    api.getInstagramPostComments.mockResolvedValue({ data: { success: false, error: 'Token expired' } });
    setup();
    expect(await screen.findByText('Token expired')).toBeTruthy();
  });

  it('toasts the backend error when a reply fails', async () => {
    api.getInstagramPostComments.mockResolvedValue({ data: { success: true, comments: [comment] } });
    api.replyToInstagramComment.mockRejectedValue({ response: { data: { error: 'Permission denied' } } });
    const addToast = setup();
    fireEvent.change(await screen.findByLabelText('Reply to fan'), { target: { value: 'Hi' } });
    fireEvent.click(screen.getByText('Send'));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Permission denied', 'error'));
  });
});
