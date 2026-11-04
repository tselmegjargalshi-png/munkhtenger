"use client";
import { Check, Minus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PropertyImage, districtName } from "@/components/property";
import { Empty, PageLoading } from "@/components/ui";
import { clearCompare, toggleCompare, useCompare } from "@/lib/compare";
import { cx, formatMNT, khorooLabel, m2 } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { AMENITIES, CATEGORY_LABELS, LISTING_TYPE_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";
import type { Property } from "@/lib/types";

type Row = { key: string; label: string; vals: (string | number)[]; best?: "min" | "max" };

export default function ComparePage() {
  const ids = useCompare();
  const { db, ready } = useApp();
  const { lang, tr, l } = useLang();
  const [onlyDiff, setOnlyDiff] = useState(false);
  if (!ready || !db) return <PageLoading />;
  const items = ids.map((id) => db.properties.find((p) => p.id === id)).filter(Boolean) as Property[];
  if (items.length === 0)
    return (
      <div className="container-x py-16">
        <Empty title={tr("Харьцуулах зар сонгоогүй байна", "Nothing to compare yet")} text={tr("Зар дээрх харьцуулах товчийг дарж 4 хүртэл зар нэмнэ үү.", "Use the compare button on listings to add up to four properties.")} action={{ label: tr("Зар хайх", "Browse properties"), href: "/properties" }} />
      </div>
    );
  const age = (p: Property) => (p.yearBuilt ? new Date().getFullYear() - p.yearBuilt : "");
  const ppm = (p: Property) => (p.area ? Math.round(p.price / p.area) : "");
  const rows: Row[] = [
    { key: "price", label: tr("Үнэ", "Price"), vals: items.map((p) => p.price), best: "min" },
    { key: "ppm", label: tr("м² үнэ", "Price per m²"), vals: items.map(ppm), best: "min" },
    { key: "type", label: tr("Зарын төрөл", "Listing type"), vals: items.map((p) => LISTING_TYPE_LABELS[p.listingType][lang]) },
    { key: "cat", label: tr("Үл хөдлөхийн төрөл", "Property type"), vals: items.map((p) => CATEGORY_LABELS[p.category][lang]) },
    { key: "loc", label: tr("Байршил", "Location"), vals: items.map((p) => `${districtName(db, p.district, lang)}, ${khorooLabel(p.khoroo, lang)}`) },
    { key: "area", label: tr("Талбай", "Area"), vals: items.map((p) => p.area), best: "max" },
    { key: "rooms", label: tr("Өрөө", "Rooms"), vals: items.map((p) => p.rooms), best: "max" },
    { key: "bed", label: tr("Унтлагын өрөө", "Bedrooms"), vals: items.map((p) => p.bedrooms), best: "max" },
    { key: "bath", label: tr("Угаалгын өрөө", "Bathrooms"), vals: items.map((p) => p.bathrooms), best: "max" },
    { key: "floor", label: tr("Давхар", "Floor"), vals: items.map((p) => (p.floor ? `${p.floor} / ${p.buildingFloors}` : "")) },
    { key: "age", label: tr("Барилгын нас", "Building age"), vals: items.map(age), best: "min" },
  ];
  const fmt = (k: string, v: string | number) => {
    if (v === "" || v === undefined) return "";
    if (k === "price") return formatMNT(Number(v));
    if (k === "ppm") return `${formatMNT(Number(v))}`;
    if (k === "area") return `${Number(v).toLocaleString("en-US")} ${m2(lang)}`;
    if (k === "age") return `${v} ${tr("жил", "years")}`;
    return String(v);
  };
  const allAmen = Array.from(new Set(items.flatMap((p) => p.amenities)));
  const amenRows = allAmen.map((a) => ({ a, has: items.map((p) => p.amenities.includes(a)) }));
  const differs = (vals: unknown[]) => new Set(vals.map(String)).size > 1;

  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="h-display text-4xl">{tr("Зар харьцуулах", "Compare properties")}</h1><p className="mt-1 text-sm text-ink-3">{tr("Ялгаатай мөрүүд тодорч харагдана. Хамгийн тохиромжтой утгыг ногооноор тэмдэглэв.", "Rows that differ are highlighted. The best value is marked in green.")}</p></div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="h-4 w-4 accent-[#1E3A5F]" data-testid="only-diff" />{tr("Зөвхөн ялгааг харуулах", "Show differences only")}</label>
          <button className="btn-ghost btn-sm" onClick={clearCompare}>{tr("Цэвэрлэх", "Clear all")}</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-paper-3 bg-white shadow-card">
        <table className="w-full min-w-[720px] text-sm" data-testid="compare-table">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 bg-white p-3" />
              {items.map((p) => (
                <th key={p.id} className="w-[22%] min-w-[180px] p-3 text-left align-top font-normal">
                  <div className="relative"><Link href={`/properties/${p.id}`}><div className="aspect-[4/3] overflow-hidden rounded-xl"><PropertyImage src={p.images[0]} alt="" /></div><div className="mt-2 line-clamp-2 text-sm font-semibold hover:underline">{l(p.title)}</div></Link>
                    <button onClick={() => toggleCompare(p.id)} aria-label={tr("Хасах", "Remove")} data-testid="compare-remove" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow-card"><X size={14} /></button></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.filter((r) => !onlyDiff || differs(r.vals)).map((r) => {
              const d = differs(r.vals);
              const nums = r.vals.map((v) => (v === "" ? NaN : Number(v)));
              const valid = nums.filter((n) => !isNaN(n));
              const bestVal = r.best && d && valid.length ? (r.best === "min" ? Math.min(...valid) : Math.max(...valid)) : null;
              return (
                <tr key={r.key} className={cx("border-t border-paper-3/70", d && "bg-brass-soft/40")} data-diff={d ? "1" : "0"}>
                  <th scope="row" className="sticky left-0 z-10 bg-inherit p-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-3">{r.label}{d && <span className="ml-1.5 text-brass">●</span>}</th>
                  {r.vals.map((v, i) => {
                    const isBest = bestVal !== null && nums[i] === bestVal;
                    return <td key={i} className={cx("p-3 font-medium", isBest && "font-bold text-moss")}>{fmt(r.key, v) || <Minus size={14} className="text-ink-4" />}{isBest && <Check size={13} className="ml-1 inline" />}</td>;
                  })}
                </tr>
              );
            })}
            {amenRows.filter((r) => !onlyDiff || differs(r.has)).map((r) => (
              <tr key={r.a} className={cx("border-t border-paper-3/70", differs(r.has) && "bg-brass-soft/40")}>
                <th scope="row" className="sticky left-0 z-10 bg-inherit p-3 text-left text-xs font-medium text-ink-2">{AMENITIES[r.a]?.[lang] ?? r.a}</th>
                {r.has.map((h, i) => <td key={i} className="p-3">{h ? <Check size={16} className="text-moss" /> : <X size={15} className="text-ink-4/60" />}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
