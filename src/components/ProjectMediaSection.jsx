/**
 * ProjectMediaSection.jsx — project photos / layout / video / brochure from the
 * owner's phone or PC.
 *
 *  - ProjectMediaPicker   (Add Project) keeps the chosen files locally; the page
 *                         uploads them with uploadStagedMedia() once the project exists.
 *  - ProjectMediaManager  (Edit Project) uploads / removes immediately.
 *
 * Files go to the backend (/api/projects/:id/media), which checks ownership and
 * the real file type, then stores them on the HomeInTown project.
 */
import { useEffect, useRef, useState } from 'react';
import { uploadProjectMedia, deleteProjectMedia } from '../api';
import { useNotifications } from '../context/NotificationContext';
import { MEDIA_SLOTS, validateMediaFile, slotFiles, mediaItems, fileNameFromUrl } from '../utils/projectMedia';

function MediaThumb({ kind, src, name, onRemove, removing }) {
  return (
    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] flex-shrink-0">
      {kind === 'image' && src && <img src={src} alt={name || 'Project photo'} className="w-full h-full object-cover" />}
      {kind === 'video' && src && (
        <video src={src} className="w-full h-full object-cover" muted playsInline preload="metadata" aria-label={name || 'Project video'} />
      )}
      {kind === 'document' && (
        <a href={src || undefined} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-full gap-1 p-1 text-red-500">
          <span className="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
          <span className="text-[9px] text-slate-600 dark:text-slate-300 truncate max-w-[88px]">{name || 'Brochure.pdf'}</span>
        </a>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} disabled={removing}
          aria-label={`Remove ${name || 'file'}`}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-50">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">{removing ? 'hourglass_top' : 'close'}</span>
        </button>
      )}
    </div>
  );
}

function SlotRow({ slot, onPick, disabled, buttonText, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{slot.label}</p>
          <p className="text-[10px] text-slate-400">{slot.hint}</p>
        </div>
        <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all focus-within:ring-2 focus-within:ring-primary/40 ${
          disabled ? 'border-slate-200 text-slate-400 cursor-wait' : 'border-primary/40 text-primary hover:bg-primary/5 cursor-pointer'
        }`}>
          <span className="material-symbols-outlined text-base" aria-hidden="true">{slot.kind === 'image' ? 'add_photo_alternate' : 'upload_file'}</span>
          {buttonText}
          <input type="file" className="sr-only" accept={slot.accept} multiple={slot.multiple} disabled={disabled}
            aria-label={`${slot.label}: choose from phone or PC`}
            onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; onPick(files); }} />
        </label>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/** Add Project: choose files now, upload after the project is created. */
export function ProjectMediaPicker({ value, onChange, disabled }) {
  const { addToast } = useNotifications();
  const [previews, setPreviews] = useState(() => new Map());   // File -> object URL
  const previewsRef = useRef(previews);

  useEffect(() => { previewsRef.current = previews; }, [previews]);
  useEffect(() => () => { for (const u of previewsRef.current.values()) URL.revokeObjectURL(u); }, []);

  const add = (slot, files) => {
    const ok = files.filter(f => { const err = validateMediaFile(slot, f); if (err) addToast(err, 'warning'); return !err; });
    if (!ok.length) return;
    const kept = slot.multiple ? ok : ok.slice(0, 1);
    setPreviews(prev => {
      const next = new Map(prev);
      if (!slot.multiple && value[slot.type] && next.has(value[slot.type])) {   // replaced single file
        URL.revokeObjectURL(next.get(value[slot.type]));
        next.delete(value[slot.type]);
      }
      for (const f of kept) next.set(f, URL.createObjectURL(f));
      return next;
    });
    onChange({ ...value, [slot.type]: slot.multiple ? [...(value[slot.type] || []), ...kept] : kept[0] });
  };

  const remove = (slot, file) => {
    setPreviews(prev => {
      const next = new Map(prev);
      if (next.has(file)) { URL.revokeObjectURL(next.get(file)); next.delete(file); }
      return next;
    });
    onChange({ ...value, [slot.type]: slot.multiple ? value[slot.type].filter(f => f !== file) : null });
  };

  return (
    <div className="space-y-5">
      {MEDIA_SLOTS.map(slot => {
        const files = slotFiles(slot, value[slot.type]);
        return (
          <SlotRow key={slot.type} slot={slot} disabled={disabled} onPick={f => add(slot, f)}
            buttonText={slot.multiple ? 'Add' : (files.length ? 'Replace' : 'Choose')}>
            {files.length > 0 && files.map((f, i) => (
              <MediaThumb key={`${f.name}-${f.size}-${i}`} kind={slot.kind} src={previews.get(f)} name={f.name}
                onRemove={disabled ? null : () => remove(slot, f)} />
            ))}
          </SlotRow>
        );
      })}
    </div>
  );
}

/** Edit Project: upload / remove right away. */
export function ProjectMediaManager({ hitProjectId, media }) {
  const { addToast } = useNotifications();
  const [items, setItems] = useState(() => mediaItems(media));
  const [busy, setBusy] = useState(null);    // slot type while uploading, or file key while removing
  const [pct, setPct] = useState(0);

  useEffect(() => { setItems(mediaItems(media)); }, [media]);

  const add = async (slot, files) => {
    const ok = files.filter(f => { const err = validateMediaFile(slot, f); if (err) addToast(err, 'warning'); return !err; });
    for (const file of (slot.multiple ? ok : ok.slice(0, 1))) {
      setBusy(slot.type);
      setPct(0);
      try {
        const res = await uploadProjectMedia(hitProjectId, slot.type, file, ev => {
          if (ev.total) setPct(Math.round((ev.loaded / ev.total) * 100));
        });
        const item = { url: res.data?.fileUrl, key: res.data?.fileKey };
        setItems(prev => ({ ...prev, [slot.type]: slot.multiple ? [...prev[slot.type], item] : [item] }));
        addToast(`${slot.label}: ${file.name} uploaded`, 'success');
      } catch (err) {
        addToast(err.response?.data?.error || `${file.name}: upload failed`, 'error');
      } finally {
        setBusy(null);
      }
    }
  };

  const remove = async (slot, item) => {
    if (!item.key) { addToast('This file can be replaced, but not removed, from here', 'info'); return; }
    if (!window.confirm(`Remove this ${slot.label.toLowerCase()} from the project?`)) return;
    setBusy(item.key);
    try {
      await deleteProjectMedia(hitProjectId, slot.type, item.key);
      setItems(prev => ({ ...prev, [slot.type]: prev[slot.type].filter(x => x.key !== item.key) }));
      addToast('Removed', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not remove the file', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {MEDIA_SLOTS.map(slot => {
        const list = items[slot.type];
        const uploading = busy === slot.type;
        return (
          <SlotRow key={slot.type} slot={slot} disabled={!!busy} onPick={f => add(slot, f)}
            buttonText={uploading ? `Uploading… ${pct}%` : (slot.multiple ? 'Add' : (list.length ? 'Replace' : 'Upload'))}>
            {list.length > 0 && list.map((m, i) => (
              <MediaThumb key={m.key || `${m.url}-${i}`} kind={slot.kind} src={m.url} name={fileNameFromUrl(m.url)}
                removing={busy === m.key} onRemove={() => remove(slot, m)} />
            ))}
          </SlotRow>
        );
      })}
      <p className="text-[10px] text-slate-400">
        Changes are saved to the project right away. New photos show on the project page and in WhatsApp templates generated afterwards.
      </p>
    </div>
  );
}
