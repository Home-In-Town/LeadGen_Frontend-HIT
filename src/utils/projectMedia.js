/**
 * projectMedia.js — shared rules + helpers for project photos / layout / video /
 * brochure uploaded from the owner's phone or PC (see components/ProjectMediaSection).
 */
import { uploadProjectMedia } from '../api';

const MB = 1024 * 1024;
const IMAGES = 'image/jpeg,image/png,image/webp';

export const MEDIA_SLOTS = [
  { type: 'cover',    kind: 'image',    label: 'Cover photo',         accept: IMAGES, multiple: false, maxMb: 10, hint: 'Main photo — also the default WhatsApp template image. JPG/PNG/WebP, up to 10 MB.' },
  { type: 'gallery',  kind: 'image',    label: 'Gallery photos',      accept: IMAGES, multiple: true,  maxMb: 10, hint: 'Site, sample flat, amenities. The first four also head WhatsApp templates.' },
  { type: 'layout',   kind: 'image',    label: 'Layout / floor plan', accept: IMAGES, multiple: false, maxMb: 10, hint: 'Master layout or floor plan image.' },
  { type: 'video',    kind: 'video',    label: 'Videos',              accept: 'video/mp4,video/webm', multiple: true, maxMb: 30, hint: 'MP4 or WebM, up to 30 MB each. iPhone .MOV must be exported as MP4.' },
  { type: 'brochure', kind: 'document', label: 'Brochure',            accept: 'application/pdf', multiple: false, maxMb: 20, hint: 'PDF, up to 20 MB.' },
];

export const EMPTY_STAGED_MEDIA = { cover: null, gallery: [], layout: null, video: [], brochure: null };

/** Error message for a file that can't go into this slot, or null. */
export function validateMediaFile(slot, file) {
  if (file.type && !slot.accept.split(',').includes(file.type)) {
    return `${file.name}: not a supported file for ${slot.label.toLowerCase()}`;
  }
  if (file.size > slot.maxMb * MB) return `${file.name} is larger than ${slot.maxMb} MB`;
  return null;
}

/** Files of a staged slot as an array (single slots hold one File or null). */
export function slotFiles(slot, value) {
  if (slot.multiple) return value || [];
  return value ? [value] : [];
}

export function stagedMediaCount(staged) {
  return MEDIA_SLOTS.reduce((n, slot) => n + slotFiles(slot, staged?.[slot.type]).length, 0);
}

/**
 * Upload staged files to a newly created project, one at a time in the chosen
 * order (gallery order decides which photo heads which WhatsApp template).
 * @returns {Promise<{ total: number, failed: Array<{ type, file, error }> }>}
 */
export async function uploadStagedMedia(hitProjectId, staged, onProgress) {
  const jobs = [];
  for (const slot of MEDIA_SLOTS) {
    for (const file of slotFiles(slot, staged?.[slot.type])) jobs.push({ type: slot.type, file });
  }
  const failed = [];
  for (let i = 0; i < jobs.length; i++) {
    onProgress?.({ done: i, total: jobs.length, name: jobs[i].file.name });
    try {
      await uploadProjectMedia(hitProjectId, jobs[i].type, jobs[i].file);
    } catch (err) {
      failed.push({ ...jobs[i], error: err.response?.data?.error || 'Upload failed' });
    }
  }
  onProgress?.({ done: jobs.length, total: jobs.length });
  return { total: jobs.length, failed };
}

/** HIT project.media → { cover: [...], gallery: [...], layout: [...], video: [...], brochure: [...] } */
export function mediaItems(media) {
  const one = (m) => (m && m.url ? [m] : []);
  return {
    cover: one(media?.coverImage),
    gallery: (media?.galleryImages || []).filter(m => m?.url),
    layout: one(media?.layoutImage),
    video: (media?.videos || []).filter(m => m?.url),
    brochure: one(media?.brochurePdf),
  };
}

/** Readable file name from a storage URL (drops the uuid prefix added on upload). */
export function fileNameFromUrl(url) {
  let last = String(url || '').split('/').pop() || '';
  try { last = decodeURIComponent(last); } catch { /* keep raw */ }
  return last.replace(/^[0-9a-f-]{36}-/i, '');
}
