"use client";
import Link from "next/link";
import { X } from "lucide-react";
import { clearCompare, toggleCompare, useCompare } from "@/lib/compare";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { PropertyImage } from "./property";

export function CompareBar() {
  const ids = useCompare();
  const { db } = useApp();
  const { tr, l } = useLang();
  if (!db || ids.length === 0) return null;
  const items = ids.map((id) => db.properties.find((p) => p.id === id)).filter(Boolean) as typeof db.properties;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-paper-3 bg-white/95 backdrop-blur" data-testid="compare-bar">
      <div className="container-x flex items-center gap-3 py-2.5">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
          {items.map((p) => (
            <div key={p.id} className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
              <PropertyImage src={p.images[0]} alt={l(p.title)} />
              <button aria-label={tr("Хасах", "Remove")} onClick={() => toggleCompare(p.id)} className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-ink/70 text-white"><X size={10} /></button>
            </div>
          ))}
          <span className="text-xs text-ink-3">{items.length}/4</span>
        </div>
        <button onClick={clearCompare} className="text-xs font-semibold text-ink-3 hover:text-rust">{tr("Цэвэрлэх", "Clear")}</button>
        <Link href="/compare" className="btn-primary btn-sm" data-testid="compare-go">{tr("Харьцуулах", "Compare")}</Link>
      </div>
    </div>
  );
}
