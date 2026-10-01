/**
 * templateNames.js — ONE canonical source for WhatsApp template display names.
 *
 * Previously four screens each had their own label map / transform for the same
 * 8 per-project template kinds, so the SAME template showed up with a different
 * name in every section (e.g. "1. Project Introduction" vs "Project Introduction"
 * vs "Proj Skyline Greens Voice Guide" vs the raw proj_..._v2 name). This module
 * is the single place that maps a kind → friendly label and a raw Meta template
 * name → friendly label, so every surface renders the SAME thing.
 *
 * Labels are numbered to match the nurturing (buyer-journey) order the backend
 * sends them in: Day 1 intro → Day 15 commute.
 */

// Canonical friendly label per template kind (matches backend ProjectTemplate kinds).
export const KIND_LABEL = {
  voice_guide: '1. Project Introduction',
  ecosystem:   '2. Neighbourhood & Map',
  tour_3d:     '3. 3D Virtual Tour',
  progress:    '4. Construction Progress',
  rera:        '5. RERA & Legal Papers',
  emi:         '6. EMI & Affordability',
  inventory:   '7. Unit Availability',
  traffic:     '8. Commute & Distance',
};

// The 8 kinds in canonical order.
export const TEMPLATE_KINDS = Object.keys(KIND_LABEL);

/**
 * Parse a raw Meta template name of the form proj_<slug>_<kind>[_vN] and return
 * { isProject, kind, label, projectSlug }. For anything that isn't one of our
 * per-project templates, isProject=false and label falls back to the raw name.
 */
export function describeTemplate(rawName) {
  const name = String(rawName || '');
  if (!name) return { isProject: false, kind: null, label: name, projectSlug: null };

  // Strip a trailing version suffix (_v2, _v33) then isolate the kind.
  const withoutVersion = name.replace(/_v\d+$/i, '');
  const kind = TEMPLATE_KINDS.find(
    (k) => withoutVersion === k || withoutVersion.endsWith(`_${k}`)
  );

  if (!kind) return { isProject: false, kind: null, label: name, projectSlug: null };

  // Everything between "proj_" and "_<kind>" is the project slug (best-effort).
  let projectSlug = null;
  const m = withoutVersion.match(/^proj_(.+?)_[a-z0-9_]+$/i);
  if (m && m[1]) projectSlug = m[1].replace(/_/g, ' ');

  return { isProject: true, kind, label: KIND_LABEL[kind], projectSlug };
}

/**
 * Turn a raw Meta template name into the friendly label used across the app.
 * Non-project templates keep their raw name (there's no canonical label for
 * ad-hoc templates the user created by hand).
 */
export function friendlyTemplateName(rawName) {
  return describeTemplate(rawName).label;
}

export default { KIND_LABEL, TEMPLATE_KINDS, describeTemplate, friendlyTemplateName };
