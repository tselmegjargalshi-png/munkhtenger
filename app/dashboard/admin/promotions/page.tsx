"use client";
import Link from "next/link";
import { PageHead } from "@/components/dash";
import { PropertyImage } from "@/components/property";
import { Badge, Empty, useRun } from "@/components/ui";
import { adminSetPropertyFlags } from "@/lib/actions";
import { formatDate, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store";

export default function Page() {
  const { db } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  if (!db) return null;
  const promoted = db.properties.filter((p) => p.promotion !== "none").sort((a, b) => (a.promotion === "premium" ? -1 : 1) - (b.promotion === "premium" ? -1 : 1));
  const candidates = db.properties.filter((p) => p.status === "published" && p.promotion === "none").slice(0, 8);
  return (
    <>
      <PageHead title={tr("Онцлох ба премиум сурталчилгаа", "Featured and premium advertising")} sub={`${promoted.filter((p) => p.promotion === "premium").length} ${tr("премиум", "premium")} · ${promoted.filter((p) => p.promotion === "featured").length} ${tr("онцлох", "featured")}`} />
      {promoted.length === 0 ? <Empty title={tr("Сурталчилж буй зар алга", "No promoted listings")} /> : (
        <div className="card overflow-x-auto"><table className="table-x min-w-[720px]" data-testid="promo-table"><thead><tr><th>{tr("Зар", "Listing")}</th><th>{tr("Багц", "Tier")}</th><th>{tr("Дуусах", "Until")}</th><th>{tr("Үнэ", "Price")}</th><th /></tr></thead><tbody>
          {promoted.map((p) => <tr key={p.id}><td><div className="flex items-center gap-3"><div className="h-10 w-14 overflow-hidden rounded-lg"><PropertyImage src={p.images[0]} alt="" /></div><Link href={`/properties/${p.id}`} className="line-clamp-1 font-semibold hover:underline">{p.code} · {l(p.title)}</Link></div></td><td><Badge tone={p.promotion === "premium" ? "dark" : "brass"}>{p.promotion === "premium" ? tr("Премиум", "Premium") : tr("Онцлох", "Featured")}</Badge></td><td className="text-xs text-ink-3">{p.promotedUntil ? formatDate(p.promotedUntil, lang) : ""}</td><td>{formatMNT(p.price)}</td><td><div className="flex justify-end gap-1.5"><button className="btn-ghost btn-sm" onClick={() => run(() => adminSetPropertyFlags(p.id, { promotion: p.promotion, promotedDays: 14 }), tr("14 хоногоор сунгалаа", "Extended by 14 days"))}>{tr("+14 хоног", "+14 days")}</button><button className="btn-danger btn-sm" onClick={() => run(() => adminSetPropertyFlags(p.id, { promotion: "none" }), tr("Сурталчилгаа зогсоолоо", "Promotion removed"))}>{tr("Зогсоох", "Remove")}</button></div></td></tr>)}
        </tbody></table></div>
      )}
      <h2 className="h-display mb-3 mt-8 text-2xl">{tr("Сурталчлах боломжтой зарууд", "Listings you can promote")}</h2>
      <ul className="card divide-y divide-paper-3/70">{candidates.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 p-3.5 text-sm"><span className="truncate font-semibold">{p.code} · {l(p.title)}</span><span className="flex gap-1.5"><button className="btn-ghost btn-sm" onClick={() => run(() => adminSetPropertyFlags(p.id, { promotion: "featured", promotedDays: 14 }), tr("Онцлох боллоо", "Now featured"))}>{tr("Онцлох болгох", "Feature")}</button><button className="btn-brass btn-sm" onClick={() => run(() => adminSetPropertyFlags(p.id, { promotion: "premium", promotedDays: 14 }), tr("Премиум боллоо", "Now premium"))}>{tr("Премиум болгох", "Make premium")}</button></span></li>)}</ul>
    </>
  );
}
