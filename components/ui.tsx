"use client";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { AppError } from "@/lib/store";
import { cx } from "@/lib/format";

// ---------- toast ----------
type ToastItem = { id: number; kind: "ok" | "err"; text: string };
let toastSeq = 0;
const toastListeners = new Set<(t: ToastItem) => void>();
export function toast(text: string, kind: "ok" | "err" = "ok") {
  const t = { id: ++toastSeq, kind, text };
  toastListeners.forEach((l) => l(t));
}
export function useRun() {
  const { lang } = useLang();
  return (fn: () => void | Promise<void>, okText?: string) => {
    try {
      const r = fn();
      if (r && typeof (r as Promise<void>).then === "function") {
        (r as Promise<void>).then(
          () => okText && toast(okText),
          (e) => toast(errText(e, lang), "err"),
        );
      } else if (okText) toast(okText);
    } catch (e) {
      toast(errText(e, lang), "err");
    }
  };
}
export function errText(e: unknown, lang: "mn" | "en") {
  if (e instanceof AppError) return lang === "mn" ? e.mn : e.en;
  return lang === "mn" ? "Алдаа гарлаа. Дахин оролдоно уу." : "Something went wrong. Please try again.";
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const on = (t: ToastItem) => {
      setItems((x) => [...x, t]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 4200);
    };
    toastListeners.add(on);
    return () => void toastListeners.delete(on);
  }, []);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div key={t.id} data-testid={`toast-${t.kind}`} className={cx("pointer-events-auto max-w-md animate-fadeUp rounded-xl px-4 py-3 text-sm font-medium shadow-lift", t.kind === "ok" ? "bg-ink text-white" : "bg-rust text-white")}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ---------- modal ----------
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { tr } = useLang();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    ref.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", k);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={cx("max-h-[92vh] w-full animate-fadeUp overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift outline-none sm:rounded-3xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="h-display text-2xl">{title}</h2>
          <button onClick={onClose} aria-label={tr("Хаах", "Close")} className="rounded-full p-1.5 text-ink-3 hover:bg-paper-2">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- form bits ----------
export function Field({ label, children, hint, error }: { label: string; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-4">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rust">{error}</span>}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "sky" | "brass" | "moss" | "rust" | "dark" }) {
  const tones = {
    neutral: "bg-paper-2 text-ink-2",
    sky: "bg-sky-soft text-sky",
    brass: "bg-brass-soft text-[#7C5B2B]",
    moss: "bg-moss-soft text-moss",
    rust: "bg-rust-soft text-rust",
    dark: "bg-ink text-white",
  };
  return <span className={cx("badge", tones[tone])}>{children}</span>;
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: { label: string; href?: string; onClick?: () => void } }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-paper-3 bg-white/60 px-6 py-14 text-center" data-testid="empty">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-paper-2 text-ink-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
      </div>
      <h3 className="h-display text-xl">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-3">{text}</p>}
      {action &&
        (action.href ? (
          <Link href={action.href} className="btn-primary mt-5">{action.label}</Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary mt-5">{action.label}</button>
        ))}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} />;
}

export function PageLoading() {
  return (
    <div className="container-x py-10" aria-busy="true" data-testid="loading">
      <Skeleton className="mb-6 h-10 w-64" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    </div>
  );
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const { tr } = useLang();
  if (pages <= 1) return null;
  const items: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i);
  const out: (number | "…")[] = [];
  items.forEach((n, i) => {
    if (i > 0 && typeof n === "number" && typeof items[i - 1] === "number" && n - (items[i - 1] as number) > 1) out.push("…");
    out.push(n);
  });
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>{tr("Өмнөх", "Previous")}</button>
      {out.map((n, i) =>
        n === "…" ? (
          <span key={i} className="px-1 text-ink-4">…</span>
        ) : (
          <button key={i} onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined} className={cx("h-8 min-w-8 rounded-full px-2 text-xs font-semibold", n === page ? "bg-sky text-white" : "text-ink-2 hover:bg-paper-2")}>
            {n}
          </button>
        ),
      )}
      <button className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>{tr("Дараах", "Next")}</button>
    </nav>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: "brass" | "moss" | "rust" }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">{label}</div>
      <div className={cx("mt-1.5 font-display text-3xl font-semibold", tone === "brass" && "text-brass", tone === "moss" && "text-moss", tone === "rust" && "text-rust")}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-4">{sub}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { key: T; label: string; count?: number }[] }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist">
      {items.map((i) => (
        <button key={i.key} role="tab" aria-selected={value === i.key} onClick={() => onChange(i.key)} className={cx("whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition", value === i.key ? "bg-ink text-white" : "text-ink-3 hover:bg-paper-2")}>
          {i.label}
          {i.count !== undefined && <span className={cx("ml-1.5 text-xs", value === i.key ? "text-white/70" : "text-ink-4")}>{i.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, text, danger, confirmLabel }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; text: string; danger?: boolean; confirmLabel?: string }) {
  const { tr } = useLang();
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink-3">{text}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>{tr("Болих", "Cancel")}</button>
        <button className={danger ? "btn bg-rust text-white hover:opacity-90" : "btn-primary"} onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel ?? tr("Тийм", "Yes")}
        </button>
      </div>
    </Modal>
  );
}
