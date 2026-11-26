import { useState } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api', () => ({ uploadWATemplateMedia: vi.fn() }));
import { uploadWATemplateMedia } from '../../api';
import TemplateImagePicker from './TemplateImagePicker';
import {
  buildHeaderImages, buildResubmitBody, validateImageFile, uploadErrorMessage,
  MSG_TYPE, MSG_BIG,
} from './templateImageUtils';

const KINDS = Array.from({ length: 15 }, (_, i) => ({ kind: `k${i + 1}`, label: `Template ${i + 1}`, need: `need ${i + 1}` }));
const file = (name, type, size = 1000) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};
const uploaded = (token) => ({ data: { data: { url: `https://api/media/${token}`, kind: 'image', filename: `${token}.png` } } });

// Holds the images state like ProjectSettingsPage does.
function Harness({ initial = {}, created = {}, changed = {}, onResubmit, spy }) {
  const [images, setImages] = useState(initial);
  return (
    <TemplateImagePicker kinds={KINDS} images={images} created={created} changed={changed} onResubmit={onResubmit}
      onChange={(n) => { spy?.(n); setImages(n); }} />
  );
}
const pickFile = (label, f) => fireEvent.change(screen.getByLabelText(label), { target: { files: [f] } });

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
});

describe('TemplateImagePicker', () => {
  it('renders 15 optional rows', () => {
    render(<Harness />);
    expect(screen.getAllByTestId(/^img-row-/)).toHaveLength(15);
    expect(screen.getByText(/Image optional hai/)).toBeInTheDocument();
    expect(screen.getAllByText('Auto image')).toHaveLength(15);
  });

  it('picks a PNG: uploads once, shows the thumbnail, Hatao clears it', async () => {
    uploadWATemplateMedia.mockResolvedValue(uploaded('a'));
    render(<Harness />);
    pickFile('Template 2 image', file('a.png', 'image/png'));
    await waitFor(() => expect(screen.getByAltText('Template 2 image')).toBeInTheDocument());
    expect(uploadWATemplateMedia).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Template 2 image hatao'));
    expect(screen.queryByAltText('Template 2 image')).not.toBeInTheDocument();
  });

  it.each([
    ['WebP', 'image/webp', 1000, MSG_TYPE],
    ['GIF', 'image/gif', 1000, MSG_TYPE],
    ['6 MB JPEG', 'image/jpeg', 6 * 1024 * 1024, MSG_BIG],
  ])('rejects %s with a Hinglish message and no upload', async (_n, type, size, msg) => {
    render(<Harness />);
    pickFile('Template 1 image', file('f', type, size));
    expect(await screen.findByText(msg)).toBeInTheDocument();
    expect(uploadWATemplateMedia).not.toHaveBeenCalled();
    expect(screen.queryByAltText('Template 1 image')).not.toBeInTheDocument();
  });

  it('maps server 413 / 415 to the same texts', async () => {
    expect(uploadErrorMessage({ response: { status: 413 } })).toBe(MSG_BIG);
    expect(uploadErrorMessage({ response: { status: 415 } })).toBe(MSG_TYPE);
    uploadWATemplateMedia.mockRejectedValue({ response: { status: 415 } });
    render(<Harness />);
    pickFile('Template 3 image', file('a.png', 'image/png'));
    expect(await screen.findByText(MSG_TYPE)).toBeInTheDocument();
  });

  it('"same image for all" fills only the empty rows', async () => {
    uploadWATemplateMedia.mockResolvedValue(uploaded('all'));
    const spy = vi.fn();
    const own = { url: 'https://api/media/own', preview: 'p', name: 'own.png' };
    render(<Harness initial={{ k2: own }} spy={spy} />);
    pickFile('Sabhi ke liye same image', file('all.png', 'image/png'));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    const next = spy.mock.calls[0][0];
    expect(Object.keys(next)).toHaveLength(15);
    expect(next.k2.url).toBe('https://api/media/own');
    expect(next.k1.url).toBe('https://api/media/all');
    expect(next.k15.url).toBe('https://api/media/all');
    expect(uploadWATemplateMedia).toHaveBeenCalledTimes(1);
  });

  it('offers resubmit only for a created template whose image changed', () => {
    const onResubmit = vi.fn();
    render(<Harness initial={{ k1: { url: 'u', preview: 'u' }, k2: { url: 'v', preview: 'v' } }}
      created={{ k1: true, k2: true }} changed={{ k1: true }} onResubmit={onResubmit} />);
    const btns = screen.getAllByText('Nayi image se resubmit');
    expect(btns).toHaveLength(1);
    fireEvent.click(btns[0]);
    expect(onResubmit).toHaveBeenCalledWith('k1');
    expect(within(screen.getByTestId('img-row-k2')).queryByText('Nayi image se resubmit')).toBeNull();
  });
});

describe('request bodies', () => {
  it('0 images: nothing is sent (same body as before the feature)', () => {
    expect(buildHeaderImages({}, {})).toBeUndefined();
  });

  it('2 picked images: exactly those 2 URLs', () => {
    const out = buildHeaderImages({ k1: { url: 'u1' }, k4: { url: 'u4' } }, {});
    expect(out).toEqual({ k1: 'u1', k4: 'u4' });
  });

  it('an untouched stored image is not resent; a removed one is sent as null', () => {
    const stored = { k1: 'u1', k2: 'u2' };
    expect(buildHeaderImages({ k1: { url: 'u1' }, k2: { url: 'u2' } }, stored)).toBeUndefined();
    expect(buildHeaderImages({ k1: { url: 'u1' } }, stored)).toEqual({ k2: null });
    expect(buildHeaderImages({ k1: { url: 'new' }, k2: { url: 'u2' } }, stored)).toEqual({ k1: 'new' });
  });

  it('replace on a created row sends onlyKinds:[kind]; remove sends null', () => {
    expect(buildResubmitBody('k3', { url: 'u3' })).toEqual({ onlyKinds: ['k3'], headerImages: { k3: 'u3' } });
    expect(buildResubmitBody('k3', undefined)).toEqual({ onlyKinds: ['k3'], headerImages: { k3: null } });
  });

  it('validateImageFile: JPG/PNG up to 5 MB only', () => {
    expect(validateImageFile(file('a.jpg', 'image/jpeg', 5 * 1024 * 1024))).toBeNull();
    expect(validateImageFile(file('a.png', 'image/png'))).toBeNull();
    expect(validateImageFile(file('a.webp', 'image/webp'))).toBe(MSG_TYPE);
    expect(validateImageFile(file('a.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1))).toBe(MSG_BIG);
  });
});
