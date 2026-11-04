"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageUploader } from "./image-uploader";
import { Field, toast, useRun } from "./ui";
import { createProperty, updateProperty, type PropertyInput } from "@/lib/actions";
import { AREAS } from "@/lib/geo";
import { useLang } from "@/lib/i18n";
import { AMENITIES, CATEGORY_LABELS, CATEGORY_ORDER, LISTING_TYPE_LABELS, NEARBY_LABELS } from "@/lib/labels";
import { isAdmin } from "@/lib/perms";
import { useApp } from "@/lib/store";
import type { Category, ListingType, Nearby, Property } from "@/lib/types";

const num = (v: string) => (v === "" ? 0 : Number(v.replace(/[^\d.]/g, "")) || 0);

function blank(): PropertyInput {
  return {
    title: { mn: "", en: "" }, description: { mn: "", en: "" }, category: "apartment", listingType: "sale", price: 0, area: 0, rooms: 0, bedrooms: 0, bathrooms: 0, floor: 0, buildingFloors: 0, yearBuilt: new Date().getFullYear(),
    furnished: false, parking: false, balcony: false, elevator: false, newBuild: false, district: "sukhbaatar", khoroo: 1, address: "", lat: 47.927, lng: 106.925, images: [], amenities: [], nearby: [], landArea: undefined,
  };
}

export function PropertyForm({ existing }: { existing?: Property }) {
  const { db, user } = useApp();
  const { lang, tr } = useLang();
  const router = useRouter();
  const run = useRun();
  const [f, setF] = useState<PropertyInput>(() => (existing ? { ...existing } : blank()));
  const [busy, setBusy] = useState(false);
  if (!db || !user) return null;
  const set = <K extends keyof PropertyInput>(k: K, v: PropertyInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const dist = db.districts.find((d) => d.key === f.district);
  const isLand = f.category === "land";
  const admin = isAdmin(user);

  const finalize = (): PropertyInput => {
    const d = db.districts.find((x) => x.key === f.district)!;
    const jitter = (n: number) => n + (Math.random() - 0.5) * 0.02;
    const keepPos = existing && existing.district === f.district;
    const area0 = AREAS[f.district]?.[0];
    const nearby: Nearby[] = f.nearby.length ? f.nearby : [
      { type: "school", name: { mn: "Ерөнхий боловсролын сургууль", en: "Public school" }, distanceM: 500 },
      { type: "shop", name: { mn: "Дэлгүүр", en: "Local shops" }, distanceM: 250 },
      { type: "transport", name: { mn: "Автобусны буудал", en: "Bus stop" }, distanceM: 200 },
      { type: "hospital", name: { mn: `${d.name.mn} дүүргийн эмнэлэг`, en: `${d.name.en} District Hospital` }, distanceM: 1500 },
    ];
    void area0;
    return { ...f, title: { mn: f.title.mn.trim(), en: f.title.en.trim() || f.title.mn.trim() }, description: { mn: f.description.mn.trim(), en: f.description.en.trim() || f.description.mn.trim() }, lat: keepPos ? f.lat : jitter(d.lat), lng: keepPos ? f.lng : jitter(d.lng), nearby };
  };

  const save = (submit: boolean) => {
    setBusy(true);
    run(() => {
      const data = finalize();
      if (existing) {
        updateProperty(existing.id, data, submit);
        toast(submit ? (admin ? tr("Нийтэллээ", "Published") : tr("Хянуулахаар илгээлээ", "Submitted for review")) : tr("Хадгалагдлаа", "Saved"));
      } else {
        createProperty(data, submit);
        toast(submit ? (admin ? tr("Нийтэллээ", "Published") : tr("Зар хянуулахаар илгээгдлээ. Админ баталсны дараа нийтлэгдэнэ.", "Listing submitted. It goes live after an admin approves it.")) : tr("Ноорог хадгалагдлаа", "Draft saved"));
      }
      router.push("/dashboard/agent/listings");
    });
    setBusy(false);
  };

  return (
    <form className="space-y-8" data-testid="property-form" onSubmit={(e) => { e.preventDefault(); save(true); }}>
      <section className="card space-y-4 p-6">
        <h2 className="h-display text-2xl">{tr("Үндсэн мэдээлэл", "Basics")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr("Гарчиг (монгол)", "Title (Mongolian)")}><input className="input" value={f.title.mn} onChange={(e) => set("title", { ...f.title, mn: e.target.value })} data-testid="pf-title-mn" placeholder="3 өрөө орон сууц, Зайсан" /></Field>
          <Field label={tr("Гарчиг (англи)", "Title (English)")} hint={tr("Хоосон бол монгол гарчиг ашиглана", "Falls back to the Mongolian title")}><input className="input" value={f.title.en} onChange={(e) => set("title", { ...f.title, en: e.target.value })} data-testid="pf-title-en" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr("Тайлбар (монгол)", "Description (Mongolian)")}><textarea className="input min-h-32" value={f.description.mn} onChange={(e) => set("description", { ...f.description, mn: e.target.value })} data-testid="pf-desc-mn" /></Field>
          <Field label={tr("Тайлбар (англи)", "Description (English)")}><textarea className="input min-h-32" value={f.description.en} onChange={(e) => set("description", { ...f.description, en: e.target.value })} data-testid="pf-desc-en" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={tr("Ангилал", "Category")}><select className="input" value={f.category} onChange={(e) => set("category", e.target.value as Category)} data-testid="pf-category">{CATEGORY_ORDER.map((k) => <option key={k} value={k}>{CATEGORY_LABELS[k][lang]}</option>)}</select></Field>
          <Field label={tr("Зарын төрөл", "Listing type")}><select className="input" value={f.listingType} onChange={(e) => set("listingType", e.target.value as ListingType)} data-testid="pf-type">{(Object.keys(LISTING_TYPE_LABELS) as ListingType[]).map((k) => <option key={k} value={k}>{LISTING_TYPE_LABELS[k][lang]}</option>)}</select></Field>
          <Field label={f.listingType === "sale" ? tr("Үнэ (₮)", "Price (₮)") : f.listingType === "short_rent" ? tr("Хоногийн үнэ (₮)", "Price per night (₮)") : tr("Сарын түрээс (₮)", "Monthly rent (₮)")}><input className="input" inputMode="numeric" value={f.price ? String(f.price) : ""} onChange={(e) => set("price", num(e.target.value))} data-testid="pf-price" placeholder="450000000" /></Field>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="h-display text-2xl">{tr("Байршил", "Location")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={tr("Дүүрэг", "District")}><select className="input" value={f.district} onChange={(e) => setF({ ...f, district: e.target.value, khoroo: 1 })} data-testid="pf-district">{db.districts.filter((d) => d.enabled).map((d) => <option key={d.key} value={d.key}>{d.name[lang]}</option>)}</select></Field>
          <Field label={tr("Хороо", "Khoroo")}><select className="input" value={f.khoroo} onChange={(e) => set("khoroo", Number(e.target.value))} data-testid="pf-khoroo">{Array.from({ length: dist?.khoroos ?? 1 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
          <Field label={tr("Хаяг", "Address")}><input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} data-testid="pf-address" placeholder={tr("Сөүлийн гудамж, 12 дугаар байр", "Seoul Street, building 12")} /></Field>
        </div>
        <p className="text-xs text-ink-4">{tr("Демо горимд газрын зургийн байршил дүүргийн төвөөс санамсаргүй зөрүүтэй тавигдана.", "In demo mode the map pin is placed near the district centre.")}</p>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="h-display text-2xl">{tr("Үзүүлэлт", "Details")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label={tr("Талбай (м²)", "Area (m²)")}><input className="input" inputMode="decimal" value={f.area ? String(f.area) : ""} onChange={(e) => set("area", num(e.target.value))} data-testid="pf-area" /></Field>
          {!isLand && <>
            <Field label={tr("Өрөө", "Rooms")}><input className="input" inputMode="numeric" value={String(f.rooms)} onChange={(e) => set("rooms", num(e.target.value))} data-testid="pf-rooms" /></Field>
            <Field label={tr("Унтлагын өрөө", "Bedrooms")}><input className="input" inputMode="numeric" value={String(f.bedrooms)} onChange={(e) => set("bedrooms", num(e.target.value))} data-testid="pf-bedrooms" /></Field>
            <Field label={tr("Угаалгын өрөө", "Bathrooms")}><input className="input" inputMode="numeric" value={String(f.bathrooms)} onChange={(e) => set("bathrooms", num(e.target.value))} data-testid="pf-bathrooms" /></Field>
            <Field label={tr("Давхар", "Floor")}><input className="input" inputMode="numeric" value={String(f.floor)} onChange={(e) => set("floor", num(e.target.value))} data-testid="pf-floor" /></Field>
            <Field label={tr("Барилгын давхар", "Building floors")}><input className="input" inputMode="numeric" value={String(f.buildingFloors)} onChange={(e) => set("buildingFloors", num(e.target.value))} data-testid="pf-floors" /></Field>
            <Field label={tr("Ашиглалтад орсон он", "Year built")}><input className="input" inputMode="numeric" value={String(f.yearBuilt)} onChange={(e) => set("yearBuilt", num(e.target.value))} data-testid="pf-year" /></Field>
          </>}
          {(isLand || f.category === "house" || f.category === "warehouse") && <Field label={tr("Газрын хэмжээ (м²)", "Land area (m²)")}><input className="input" inputMode="numeric" value={f.landArea ? String(f.landArea) : ""} onChange={(e) => set("landArea", num(e.target.value) || undefined)} /></Field>}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
          {([["furnished", "Тавилгатай", "Furnished"], ["parking", "Зогсоолтой", "Parking"], ["balcony", "Тагттай", "Balcony"], ["elevator", "Цахилгаан шаттай", "Elevator"], ["newBuild", "Шинэ барилга", "Newly built"]] as const).map(([k, mn, en]) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1E3A5F]" checked={f[k]} onChange={(e) => set(k, e.target.checked)} data-testid={`pf-${k}`} />{tr(mn, en)}</label>
          ))}
        </div>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="h-display text-2xl">{tr("Тохижилт", "Amenities")}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(AMENITIES).map(([k, v]) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1E3A5F]" checked={f.amenities.includes(k)} onChange={(e) => set("amenities", e.target.checked ? [...f.amenities, k] : f.amenities.filter((x) => x !== k))} />{v[lang]}</label>
          ))}
        </div>
      </section>

      {existing && existing.nearby.length > 0 && (
        <section className="card p-6"><h2 className="h-display text-2xl">{tr("Ойр орчим", "Nearby")}</h2><ul className="mt-2 text-sm text-ink-3">{f.nearby.map((n, i) => <li key={i}>{NEARBY_LABELS[n.type][lang]}: {n.name[lang]} ({n.distanceM} {tr("м", "m")})</li>)}</ul></section>
      )}

      <section className="card space-y-3 p-6">
        <h2 className="h-display text-2xl">{tr("Зургууд", "Photos")}</h2>
        <ImageUploader value={f.images} onChange={(v) => set("images", v)} />
      </section>

      <div className="sticky bottom-3 z-10 flex flex-wrap justify-end gap-2 rounded-2xl border border-paper-3 bg-white/95 p-3 shadow-lift backdrop-blur">
        <button type="button" className="btn-ghost" onClick={() => router.push("/dashboard/agent/listings")}>{tr("Болих", "Cancel")}</button>
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => save(false)} data-testid="pf-save-draft">{tr("Ноорог хадгалах", "Save draft")}</button>
        <button className="btn-primary" disabled={busy} data-testid="pf-submit">{admin ? tr("Нийтлэх", "Publish") : tr("Хянуулахаар илгээх", "Submit for review")}</button>
      </div>
    </form>
  );
}
