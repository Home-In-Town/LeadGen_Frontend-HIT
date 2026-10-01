/**
 * env.js — safe reader for Vite env vars.
 *
 * Hosting dashboards (Vercel etc.) sometimes save a value with a trailing
 * newline or stray quotes (e.g. "https://api.example.com\r\n"). Used raw as an
 * axios baseURL or a WebSocket URL that breaks EVERY request/connection — which
 * is exactly how "some pages stopped working" happened. This helper strips
 * surrounding whitespace, newlines (real or literal \r\n), and wrapping quotes
 * so a dirty env value can never take the app down again.
 */
export function cleanEnv(raw, fallback = '') {
  const original = String(raw ?? '');
  const cleaned = original
    .trim()
    .replace(/^["']|["']$/g, '')      // stray wrapping quotes
    .replace(/\\[rnt]/g, '')          // literal \r \n \t written as text
    .replace(/[\r\n\t]+$/g, '')       // real trailing CR/LF/TAB
    .trim();
  return cleaned || fallback;
}

/** Canonical live backend origin (no trailing slash). */
export const API_ORIGIN = cleanEnv(
  import.meta.env.VITE_API_BASE_URL,
  'https://lead-filteration-backend-624770114041.asia-south1.run.app'
).replace(/\/+$/, '');

export default cleanEnv;
