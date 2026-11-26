// Optional image for each of the 15 ladder templates. A template without an image
// still gets created: the server then uses the project photo / default image.
// Limits mirror the server (templateMediaService): JPEG/PNG, 5 MB.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
export const MSG_TYPE = 'Sirf JPG ya PNG image chalegi (WebP/GIF nahi).';
export const MSG_BIG = 'Image 5 MB se badi hai, chhoti image chunein.';
export const MSG_FAIL = 'Image upload nahi ho paayi, dobara try karein.';

/** Hinglish error for a file the browser can already reject, else null. */
export function validateImageFile(file) {
  if (!file) return MSG_FAIL;
  if (!ALLOWED_TYPES.includes(file.type)) return MSG_TYPE;
  if (file.size > MAX_IMAGE_BYTES) return MSG_BIG;
  return null;
}

/** Hinglish text for a failed upload response (413/415 map to the same limits). */
export function uploadErrorMessage(err) {
  const status = err?.response?.status;
  if (status === 413) return MSG_BIG;
  if (status === 415) return MSG_TYPE;
  return MSG_FAIL;
}

/**
 * `headerImages` for POST /templates/generate.
 *   images = { kind: { url, ... } } as shown in the picker
 *   stored = { kind: url } the server already holds (customHeaderImageUrl)
 * A picked image is sent; a stored image the user removed is sent as null (back to
 * the automatic image); an untouched stored image is left out (server keeps it).
 * Returns undefined when there is nothing to say, so a no-image request is the
 * same body as before this feature.
 */
export function buildHeaderImages(images = {}, stored = {}) {
  const out = {};
  for (const [kind, img] of Object.entries(images)) {
    if (img?.url && img.url !== stored[kind]) out[kind] = img.url;
  }
  for (const kind of Object.keys(stored)) {
    if (stored[kind] && !images[kind]) out[kind] = null;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Body to replace (or remove, image = null) the image of ONE already created template. */
export function buildResubmitBody(kind, image) {
  return { onlyKinds: [kind], headerImages: { [kind]: image?.url || null } };
}
