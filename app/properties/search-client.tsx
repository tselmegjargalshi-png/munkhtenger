"use client";
import { BookmarkPlus, LayoutGrid, List, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DemoMap } from "@/components/demo-map";
import { PropertyCard, PropertyImage, districtName } from "@/components/property";
import { Empty, Field, Modal, PageLoading, Pagination, toast, useRun } from "@/components/ui";
import { saveSearch } from "@/lib/actions";
import { cx, formatMNT, formatMNTShort, khorooLabel, priceSuffix, m2 } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { CATEGORY_LABELS, CATEGORY_ORDER, LISTING_TYPE_LABELS } from "@/lib/labels";
import { activeFilterCount, NON_FILTER_KEYS, parseFilters, searchProperties } from "@/lib/search";
import { useApp } from "@/lib/store";
import type { ListingType } from "@/lib/types";

const PAGE_SIZE = 12;

export function SearchClient() {
  const { db, user, ready } = useApp();
  const { lang, tr, l } = useLang();
  const router = useRouter();
  const sp = useSearchParams();
  const run = useRun();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const spKey = sp.toString();
  const f = useMemo(() => parseFilters(new URLSearchParams(spKey)), [spKey]);
  const view = (sp.get("view") as "grid" | "list" | "map") || "grid";
  const page = Math.max(1, Number(sp.get("page")) || 1);

  const set = (patch: Record<string, string | number | boolean | null | undefined>, keepPage = false) => {
    const n = new URLSearchParams(spKey);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === "" || v === false || v === 0) n.delete(k);
      else n.set(k, v === true ? "1" : String(v));
    }
    if (!keepPage) n.delete("page");
    router.replace(`/properties${n.toString() ? "?" + n.toString() : ""}`, { scroll: false });
  };

  const results = useMemo(() => (db ? searchProperties(db, f) : []), [db, f]);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageItems = view === "map" ? results : results.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);
  const count = activeFilterCount(f);

  useEffect(() => setSelected(null), [spKey]);

  if (!ready || !db) return <PageLoading />;
  const enabledDistricts = db.districts.filter((d) => d.enabled);
  const enabledCats = CATEGORY_ORDER.filter((k) => db.categories.find((c) => c.key === k)?.enabled !== false);
  const selectedProp = selected ? results.find((p) => p.id === selected) : null;

  const filterPanel = <FilterPanel f={f} set={set} db={db} enabledDistricts={enabledDistricts} enabledCats={enabledCats} />;

  const titleKey = f.type ? LISTING_TYPE_LABELS[f.type as ListingType]?.[lang] : tr("Үл хөдлөх хөрөнгө", "Properties");

  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-display text-4xl" data-testid="search-title">{f.category ? CATEGORY_LABELS[f.category as keyof typeof CATEGORY_LABELS]?.[lang] : titleKey}</h1>
          <p className="mt-1 text-sm text-ink-3" data-testid="result-count">{results.length} {tr("зар олдлоо", "properties found")}{f.district && `, ${districtName(db, f.district, lang)}`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-paper-3 bg-white p-0.5" role="group" aria-label="View">
            {([["grid", LayoutGrid, tr("Тор", "Grid")], ["list", List, tr("Жагсаалт", "List")], ["map", MapIcon, tr("Газрын зураг", "Map")]] as const).map(([k, Icon, label]) => (
              <button key={k} data-testid={`view-${k}`} aria-pressed={view === k} onClick={() => set({ view: k === "grid" ? null : k }, true)} className={cx("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", view === k ? "bg-ink text-white" : "text-ink-3")}>
                <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <select aria-label={tr("Эрэмбэлэх", "Sort")} data-testid="sort" className="input !w-auto !rounded-full !py-2 text-xs font-semibold" value={f.sort} onChange={(e) => set({ sort: e.target.value === "recommended" ? null : e.target.value })}>
            <option value="recommended">{tr("Санал болгох", "Recommended")}</option>
            <option value="newest">{tr("Шинээр нэмэгдсэн", "Newest")}</option>
            <option value="price_asc">{tr("Үнэ өсөхөөр", "Price low to high")}</option>
            <option value="price_desc">{tr("Үнэ буурахаар", "Price high to low")}</option>
            <option value="popular">{tr("Алдартай", "Most popular")}</option>
          </select>
          <button className="btn-ghost btn-sm lg:hidden" onClick={() => setFiltersOpen(true)} data-testid="open-filters">
            <SlidersHorizontal size={14} /> {tr("Шүүлтүүр", "Filters")}{count > 0 && ` (${count})`}
          </button>
          <button
            className="btn-ghost btn-sm"
            data-testid="save-search"
            onClick={() => {
              if (!user) {
                toast(tr("Хайлт хадгалахын тулд нэвтэрнэ үү", "Sign in to save searches"), "err");
                router.push(`/login?next=${encodeURIComponent("/properties?" + spKey)}`);
                return;
              }
              setSaveName(f.district ? districtName(db, f.district, lang) : "");
              setSaveOpen(true);
            }}
          >
            <BookmarkPlus size={14} /> {tr("Хайлт хадгалах", "Save search")}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5">{filterPanel}</div>
        </aside>
        <section>
          {count > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="active-filters">
              {Array.from(new URLSearchParams(spKey).entries())
                .filter(([k]) => !NON_FILTER_KEYS.includes(k) && k !== "sort")
                .map(([k, v]) => (
                  <button key={k} onClick={() => set({ [k]: null })} className="chip chip-on" aria-label={`${tr("Арилгах", "Remove")} ${k}`}>
                    {chipLabel(k, v, lang, db)} <X size={12} />
                  </button>
                ))}
              <button onClick={() => router.replace(`/properties${view !== "grid" ? "?view=" + view : ""}`)} className="text-xs font-semibold text-sky underline">{tr("Бүгдийг арилгах", "Clear all")}</button>
            </div>
          )}
          {results.length === 0 ? (
            <Empty title={tr("Тохирох зар олдсонгүй", "No properties match")} text={tr("Шүүлтүүрээ багасгаж эсвэл өөр дүүрэг сонгоно уу.", "Try removing a filter or choosing another district.")} action={{ label: tr("Шүүлтүүр арилгах", "Clear filters"), onClick: () => router.replace("/properties") }} />
          ) : view === "map" ? (
            <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
              <div>
                <DemoMap properties={results} districts={enabledDistricts} selectedId={selected} onSelect={setSelected} bbox={f.bbox} onBbox={(b) => set({ bbox: b ? b.join(",") : null })} district={f.district} onDistrict={(d) => set({ district: d })} />
                {selectedProp && (
                  <Link href={`/properties/${selectedProp.id}`} data-testid="map-preview" className="card mt-3 flex animate-fadeUp gap-3 overflow-hidden p-2.5 hover:shadow-lift xl:hidden">
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl"><PropertyImage src={selectedProp.images[0]} alt="" /></div>
                    <div className="min-w-0"><div className="font-display text-xl font-semibold">{formatMNT(selectedProp.price)}</div><div className="truncate text-sm">{l(selectedProp.title)}</div></div>
                  </Link>
                )}
              </div>
              <div className="hidden max-h-[560px] space-y-3 overflow-y-auto xl:block">
                {selectedProp && (
                  <Link href={`/properties/${selectedProp.id}`} data-testid="map-preview-side" className="card block animate-fadeUp overflow-hidden ring-2 ring-brass">
                    <div className="aspect-[16/10]"><PropertyImage src={selectedProp.images[0]} alt="" /></div>
                    <div className="p-3.5">
                      <div className="font-display text-2xl font-semibold">{formatMNT(selectedProp.price)}<span className="font-sans text-xs text-ink-3">{priceSuffix(selectedProp.listingType, lang)}</span></div>
                      <div className="mt-1 text-sm font-semibold">{l(selectedProp.title)}</div>
                      <div className="mt-1 text-xs text-ink-3">{selectedProp.area} {m2(lang)} · {districtName(db, selectedProp.district, lang)} · {khorooLabel(selectedProp.khoroo, lang)}</div>
                      <span className="btn-primary btn-sm mt-3">{tr("Дэлгэрэнгүй үзэх", "View details")}</span>
                    </div>
                  </Link>
                )}
                {results.slice(0, 40).map((p) => (
                  <button key={p.id} onClick={() => setSelected(p.id)} className={cx("card flex w-full gap-3 p-2 text-left transition hover:shadow-lift", selected === p.id && "ring-2 ring-brass")}>
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg"><PropertyImage src={p.images[0]} alt="" /></div>
                    <div className="min-w-0"><div className="text-sm font-bold">{formatMNTShort(p.price, lang)}</div><div className="truncate text-xs text-ink-2">{l(p.title)}</div></div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className={cx(view === "list" ? "space-y-4" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3")} data-testid="results">
                {pageItems.map((p, i) => <PropertyCard key={p.id} p={p} db={db} layout={view === "list" ? "list" : "grid"} priority={i < 3} />)}
              </div>
              <Pagination page={Math.min(page, pages)} pages={pages} onPage={(n) => { set({ page: n }, true); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
            </>
          )}
        </section>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title={tr("Шүүлтүүр", "Filters")}>
        {filterPanel}
        <button className="btn-primary mt-6 w-full" onClick={() => setFiltersOpen(false)}>{tr(`${results.length} зар харах`, `Show ${results.length} properties`)}</button>
      </Modal>

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title={tr("Хайлт хадгалах", "Save this search")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(() => {
              const n = new URLSearchParams(spKey);
              NON_FILTER_KEYS.forEach((k) => n.delete(k));
              saveSearch(saveName, n.toString(), true);
              setSaveOpen(false);
            }, tr("Хайлт хадгалагдлаа. Шинэ тохирох зар гармагц мэдэгдэнэ.", "Search saved. You will be notified about new matches."));
          }}
          className="space-y-4"
        >
          <Field label={tr("Хайлтын нэр", "Search name")}><input className="input" value={saveName} onChange={(e) => setSaveName(e.target.value)} autoFocus data-testid="save-search-name" placeholder={tr("Жишээ: Хан Уул 2 өрөө", "For example: Khan Uul 2 bedrooms")} /></Field>
          <p className="text-xs text-ink-3">{tr("Энэ хайлтад тохирох шинэ зар батлагдахад танд мэдэгдэл ирнэ.", "You will get a notification when a new listing matching this search is approved.")}</p>
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setSaveOpen(false)}>{tr("Болих", "Cancel")}</button><button className="btn-primary" data-testid="save-search-submit">{tr("Хадгалах", "Save")}</button></div>
        </form>
      </Modal>
    </div>
  );
}

function chipLabel(k: string, v: string, lang: "mn" | "en", db: NonNullable<ReturnType<typeof useApp>["db"]>) {
  const mn = lang === "mn";
  switch (k) {
    case "district": return districtName(db, v, lang);
    case "category": return CATEGORY_LABELS[v as keyof typeof CATEGORY_LABELS]?.[lang] ?? v;
    case "type": return LISTING_TYPE_LABELS[v as ListingType]?.[lang] ?? v;
    case "min": return `${mn ? "Доод үнэ" : "Min"} ${formatMNTShort(Number(v), lang)}`;
    case "max": return `${mn ? "Дээд үнэ" : "Max"} ${formatMNTShort(Number(v), lang)}`;
    case "beds": return `${v}+ ${mn ? "унтлагын өрөө" : "bedrooms"}`;
    case "baths": return `${v}+ ${mn ? "угаалгын өрөө" : "bathrooms"}`;
    case "amin": return `${v}+ ${m2(lang)}`;
    case "amax": return `≤ ${v} ${m2(lang)}`;
    case "floor": return `${mn ? "Давхар" : "Floor"} ${v}`;
    case "floors": return `${v}+ ${mn ? "давхар барилга" : "storey building"}`;
    case "age": return `≤ ${v} ${mn ? "жилийн нас" : "years old"}`;
    case "furnished": return v === "yes" ? (mn ? "Тавилгатай" : "Furnished") : mn ? "Тавилгагүй" : "Unfurnished";
    case "parking": return mn ? "Зогсоолтой" : "Parking";
    case "balcony": return mn ? "Тагттай" : "Balcony";
    case "elevator": return mn ? "Цахилгаан шаттай" : "Elevator";
    case "newbuild": return mn ? "Шинэ барилга" : "Newly built";
    case "verified": return mn ? "Баталгаажсан" : "Verified";
    case "khoroo": return khorooLabel(Number(v), lang);
    case "bbox": return mn ? "Газрын зургийн талбай" : "Map area";
    case "view": return "";
    default: return `${k}: ${v}`;
  }
}

type SetFn = (patch: Record<string, string | number | boolean | null | undefined>) => void;

function NumInput({ value, onCommit, placeholder, testid }: { value: number; onCommit: (n: number) => void; placeholder: string; testid: string }) {
  const [v, setV] = useState(value ? String(value) : "");
  useEffect(() => setV(value ? String(value) : ""), [value]);
  const commit = () => onCommit(Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0));
  return <input inputMode="numeric" className="input" data-testid={testid} placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />;
}

function FilterPanel({ f, set, db, enabledDistricts, enabledCats }: { f: ReturnType<typeof parseFilters>; set: SetFn; db: NonNullable<ReturnType<typeof useApp>["db"]>; enabledDistricts: typeof db.districts; enabledCats: string[] }) {
  const { lang, tr } = useLang();
  const dist = db.districts.find((d) => d.key === f.district);
  const toggles: [keyof typeof f, string, string][] = [
    ["parking", "Зогсоолтой", "Parking"],
    ["balcony", "Тагттай", "Balcony"],
    ["elevator", "Цахилгаан шаттай", "Elevator"],
    ["newbuild", "Шинэ барилга", "Newly built"],
    ["verified", "Баталгаажсан зар", "Verified listings"],
  ];
  const stepper = (key: "beds" | "baths", label: string) => (
    <div>
      <span className="label">{label}</span>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((n) => (
          <button key={n} type="button" data-testid={`${key}-${n}`} onClick={() => set({ [key]: n })} className={cx("h-9 min-w-9 flex-1 rounded-lg border text-sm font-semibold", (f[key] || 0) === n ? "border-sky bg-sky text-white" : "border-paper-3 bg-white text-ink-2 hover:border-ink-4")}>
            {n === 0 ? tr("Бүгд", "Any") : `${n}+`}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="space-y-5" data-testid="filter-panel">
      <div>
        <span className="label">{tr("Түлхүүр үг, зарын дугаар", "Keyword or listing ID")}</span>
        <input className="input" data-testid="f-q" defaultValue={f.q} key={f.q} placeholder="MT10230" onKeyDown={(e) => e.key === "Enter" && set({ q: (e.target as HTMLInputElement).value.trim() })} onBlur={(e) => e.target.value.trim() !== f.q && set({ q: e.target.value.trim() })} />
      </div>
      <div>
        <span className="label">{tr("Зарын төрөл", "Listing type")}</span>
        <div className="grid grid-cols-2 gap-1.5">
          {(["sale", "rent", "long_lease", "short_rent"] as ListingType[]).map((t) => (
            <button key={t} type="button" data-testid={`type-${t}`} onClick={() => set({ type: f.type === t ? null : t })} className={cx("rounded-lg border px-2 py-2 text-xs font-semibold leading-tight", f.type === t ? "border-sky bg-sky-soft text-sky" : "border-paper-3 bg-white text-ink-2 hover:border-ink-4")}>
              {LISTING_TYPE_LABELS[t][lang]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr("Дүүрэг", "District")}>
          <select className="input" data-testid="f-district" value={f.district} onChange={(e) => set({ district: e.target.value, khoroo: null })}>
            <option value="">{tr("Бүх дүүрэг", "All districts")}</option>
            {enabledDistricts.map((d) => <option key={d.key} value={d.key}>{d.name[lang]}</option>)}
          </select>
        </Field>
        <Field label={tr("Хороо", "Khoroo")}>
          <select className="input" data-testid="f-khoroo" value={f.khoroo || ""} disabled={!dist} onChange={(e) => set({ khoroo: e.target.value })}>
            <option value="">{tr("Бүгд", "Any")}</option>
            {dist && Array.from({ length: dist.khoroos }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      </div>
      <Field label={tr("Ангилал", "Category")}>
        <select className="input" data-testid="f-category" value={f.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">{tr("Бүх ангилал", "All categories")}</option>
          {enabledCats.map((k) => <option key={k} value={k}>{CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS][lang]}</option>)}
        </select>
      </Field>
      <div>
        <span className="label">{tr("Үнэ (₮)", "Price (₮)")}</span>
        <div className="grid grid-cols-2 gap-2">
          <NumInput value={f.min} onCommit={(n) => set({ min: n })} placeholder={tr("Доод", "Min")} testid="f-min" />
          <NumInput value={f.max} onCommit={(n) => set({ max: n })} placeholder={tr("Дээд", "Max")} testid="f-max" />
        </div>
      </div>
      <div>
        <span className="label">{tr("Талбай", "Area")} ({m2(lang)})</span>
        <div className="grid grid-cols-2 gap-2">
          <NumInput value={f.amin} onCommit={(n) => set({ amin: n })} placeholder={tr("Доод", "Min")} testid="f-amin" />
          <NumInput value={f.amax} onCommit={(n) => set({ amax: n })} placeholder={tr("Дээд", "Max")} testid="f-amax" />
        </div>
      </div>
      {stepper("beds", tr("Унтлагын өрөө", "Bedrooms"))}
      {stepper("baths", tr("Угаалгын өрөө", "Bathrooms"))}
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr("Давхар", "Floor")}><NumInput value={f.floor} onCommit={(n) => set({ floor: n })} placeholder={tr("Дурын", "Any")} testid="f-floor" /></Field>
        <Field label={tr("Барилгын давхар", "Building floors")}><NumInput value={f.floors} onCommit={(n) => set({ floors: n })} placeholder={tr("Доод", "Min")} testid="f-floors" /></Field>
      </div>
      <Field label={tr("Барилгын нас", "Building age")}>
        <select className="input" data-testid="f-age" value={f.age || ""} onChange={(e) => set({ age: e.target.value })}>
          <option value="">{tr("Дурын", "Any")}</option>
          {[2, 5, 10, 20].map((n) => <option key={n} value={n}>{tr(`${n} жил хүртэл`, `Up to ${n} years`)}</option>)}
        </select>
      </Field>
      <Field label={tr("Тавилга", "Furnishing")}>
        <select className="input" data-testid="f-furnished" value={f.furnished} onChange={(e) => set({ furnished: e.target.value })}>
          <option value="">{tr("Дурын", "Any")}</option>
          <option value="yes">{tr("Тавилгатай", "Furnished")}</option>
          <option value="no">{tr("Тавилгагүй", "Unfurnished")}</option>
        </select>
      </Field>
      <div className="space-y-2.5 border-t border-paper-3 pt-4">
        {toggles.map(([k, mn, en]) => (
          <label key={k} className="flex cursor-pointer items-center justify-between text-sm">
            <span>{tr(mn, en)}</span>
            <input type="checkbox" data-testid={`f-${k}`} checked={!!f[k]} onChange={(e) => set({ [k]: e.target.checked })} className="h-4 w-4 accent-[#1E3A5F]" />
          </label>
        ))}
      </div>
    </div>
  );
}
