import { useRef, useState } from 'react';
import { uploadWATemplateMedia } from '../../api';
import { validateImageFile, uploadErrorMessage, MSG_TYPE, MSG_BIG, MSG_FAIL } from './templateImageUtils';

// Optional image for each of the 15 ladder templates. A template without an image
// still gets created: the server then uses the project photo / default image.
// Limits and request-body helpers live in templateImageUtils.js.
export default function TemplateImagePicker({
  kinds,            // [{ kind, label, need }] in ladder order
  images,           // { kind: { url, preview, name } }
  onChange,         // (nextImages) => void
  created = {},     // { kind: true } templates that already exist
  changed = {},     // { kind: true } image differs from what the server holds
  onResubmit,       // (kind) => void  (only offered for created templates)
  resubmittingKind = null,
  onBusyChange,     // (bool) => void  true while any upload runs
  disabled = false,
  btnClass = '',
}) {
  const [progress, setProgress] = useState({});   // kind -> 0..100 while uploading
  const [errors, setErrors] = useState({});       // kind -> message
  const inputs = useRef({});
  const busyCount = useRef(0);
  // Latest images for async callbacks (several uploads can finish out of order).
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const setBusy = (delta) => {
    busyCount.current += delta;
    onBusyChange?.(busyCount.current > 0);
  };
  const setErr = (kind, msg) => setErrors((e) => ({ ...e, [kind]: msg || undefined }));

  async function pick(kind, file) {
    const bad = validateImageFile(file);
    if (bad) { setErr(kind, bad); return null; }
    setErr(kind, null);
    setProgress((p) => ({ ...p, [kind]: 0 }));
    setBusy(1);
    try {
      const res = await uploadWATemplateMedia(file, (ev) => {
        if (ev.total) setProgress((p) => ({ ...p, [kind]: Math.round((ev.loaded / ev.total) * 100) }));
      });
      const data = res.data?.data;
      if (!data?.url) throw new Error('no url');
      if (data.kind && data.kind !== 'image') { setErr(kind, MSG_TYPE); return null; }
      return { url: data.url, preview: URL.createObjectURL(file), name: data.filename || file.name };
    } catch (err) {
      setErr(kind, uploadErrorMessage(err));
      return null;
    } finally {
      setBusy(-1);
      setProgress((p) => { const n = { ...p }; delete n[kind]; return n; });
    }
  }

  async function onPick(kind, e) {
    const file = e.target.files?.[0];
    e.target.value = '';   // allow picking the same file again after Remove
    if (!file) return;
    const img = await pick(kind, file);
    if (img) onChange({ ...imagesRef.current, [kind]: img });
  }

  function remove(kind) {
    setErr(kind, null);
    const next = { ...imagesRef.current };
    delete next[kind];
    onChange(next);
  }

  // Upload once, give the same image to every row that has none (never overwrites).
  async function sameForAll(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const first = kinds.find((k) => !imagesRef.current[k.kind])?.kind;
    if (!first) return;
    const img = await pick(first, file);
    if (!img) return;
    const next = { ...imagesRef.current };
    for (const k of kinds) if (!next[k.kind]) next[k.kind] = img;
    onChange(next);
  }

  const filled = kinds.filter((k) => images[k.kind]).length;
  const uploading = Object.keys(progress).length > 0;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 p-4" data-testid="template-image-picker">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Template images (optional)</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
            Image optional hai. Nahi doge to project ki photo / default image lagegi. JPG ya PNG, max 5 MB.
            {' '}{filled}/{kinds.length} templates ke liye image chuni hai.
          </p>
        </div>
        <label className={`${btnClass} cursor-pointer ${disabled || uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          Sabhi ke liye same image
          <input type="file" accept="image/jpeg,image/png" className="hidden" aria-label="Sabhi ke liye same image"
            disabled={disabled || uploading} onChange={sameForAll} />
        </label>
      </div>

      <ul className="mt-3 divide-y divide-slate-100 dark:divide-white/5">
        {kinds.map(({ kind, label, need }, i) => {
          const img = images[kind];
          const pct = progress[kind];
          return (
            <li key={kind} className="py-2.5 flex items-center gap-3" data-testid={`img-row-${kind}`}>
              <span className="w-5 text-[10px] font-bold text-slate-400 text-right">{i + 1}</span>
              <div className="w-14 h-10 rounded-md flex-shrink-0 overflow-hidden bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center">
                {img
                  ? <img src={img.preview || img.url} alt={`${label} image`} className="w-full h-full object-cover" />
                  : <span className="text-[8px] text-slate-400 text-center leading-tight px-0.5">Auto image</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{label}</p>
                <p className="text-[10px] text-slate-500 truncate">{need}</p>
                {pct !== undefined && <p className="text-[10px] text-slate-500">Upload ho rahi hai… {pct}%</p>}
                {errors[kind] && <p role="alert" className="text-[10px] text-red-600 dark:text-red-400">{errors[kind]}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className={`text-[10px] font-black uppercase tracking-wider text-primary cursor-pointer ${disabled || pct !== undefined ? 'opacity-40 pointer-events-none' : ''}`}>
                  {img ? 'Badlo' : 'Image chunein'}
                  <input type="file" accept="image/jpeg,image/png" className="hidden" aria-label={`${label} image`}
                    ref={(el) => { inputs.current[kind] = el; }} disabled={disabled || pct !== undefined}
                    onChange={(e) => onPick(kind, e)} />
                </label>
                {img && (
                  <button type="button" onClick={() => remove(kind)} disabled={disabled || pct !== undefined}
                    aria-label={`${label} image hatao`}
                    className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 disabled:opacity-40">
                    Hatao
                  </button>
                )}
                {created[kind] && changed[kind] && onResubmit && (
                  <button type="button" onClick={() => onResubmit(kind)}
                    disabled={disabled || pct !== undefined || resubmittingKind === kind}
                    className="text-[10px] font-black uppercase tracking-wider text-amber-600 hover:text-amber-700 disabled:opacity-40">
                    {resubmittingKind === kind ? 'Working…' : 'Nayi image se resubmit'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
