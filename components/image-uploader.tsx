"use client";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { PropertyImage } from "./property";
import { toast } from "./ui";
import { compressImage } from "@/lib/images";
import { useLang } from "@/lib/i18n";

/** Multi image uploader. Photos are resized in the browser. In demo mode they are stored as data URLs; in production they go to Supabase Storage. */
export function ImageUploader({ value, onChange, max = 12 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const { tr } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const add = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    const out = [...value];
    let failed = 0;
    for (const f of list) {
      if (out.length >= max) { toast(tr(`Хамгийн ихдээ ${max} зураг`, `Up to ${max} photos`), "err"); break; }
      try { out.push(await compressImage(f)); } catch (e) { failed++; void e; }
    }
    onChange(out);
    setBusy(false);
    if (failed) toast(tr(`${failed} файлыг оруулж чадсангүй. PNG, JPG, WEBP дэмжинэ (12 MB хүртэл).`, `${failed} file(s) could not be added. PNG, JPG or WEBP up to 12 MB.`), "err");
    if (input.current) input.current.value = "";
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div data-testid="image-uploader">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${drag ? "border-sky bg-sky-soft" : "border-paper-3 bg-white"}`}
      >
        <ImagePlus className="mx-auto text-ink-4" />
        <p className="mt-1 text-sm text-ink-2">{tr("Зургуудаа чирж оруулах эсвэл", "Drag photos here or")}{" "}
          <button type="button" className="font-semibold text-sky underline" onClick={() => input.current?.click()} data-testid="upload-pick">{tr("сонгох", "browse")}</button></p>
        <p className="text-xs text-ink-4">{tr("PNG, JPG, WEBP · автоматаар жижигрүүлнэ · эхний зураг нүүр зураг болно", "PNG, JPG, WEBP · resized automatically · the first photo is the cover")}</p>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => e.target.files && add(e.target.files)} data-testid="upload-input" />
        {busy && <p className="mt-2 text-xs font-semibold text-sky">{tr("Боловсруулж байна...", "Processing...")}</p>}
      </div>
      {value.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" data-testid="upload-list">
          {value.map((src, i) => (
            <li key={i} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-paper-3">
              <PropertyImage src={src} alt="" />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">{tr("Нүүр", "Cover")}</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-ink/70 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                <span className="flex gap-1"><button type="button" aria-label="Move left" onClick={() => move(i, -1)} className="grid h-6 w-6 place-items-center rounded bg-white/90"><ArrowLeft size={12} /></button><button type="button" aria-label="Move right" onClick={() => move(i, 1)} className="grid h-6 w-6 place-items-center rounded bg-white/90"><ArrowRight size={12} /></button></span>
                <button type="button" aria-label={tr("Устгах", "Remove")} onClick={() => onChange(value.filter((_, k) => k !== i))} data-testid="upload-remove" className="grid h-6 w-6 place-items-center rounded bg-white/90 text-rust"><Trash2 size={12} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {value.length === 0 && (
        <button type="button" className="mt-2 text-xs font-semibold text-ink-3 underline" data-testid="use-sample-photos" onClick={() => onChange(["apartment", "living", "kitchen", "bedroom"].map((k, i) => `gen:${k}:${Math.floor(Math.random() * 900) + i}`))}>{tr("Демо зураг ашиглах", "Use generated demo photos")}</button>
      )}
    </div>
  );
}
