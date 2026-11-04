"use client";
import { Eye, Heart, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CheckoutModal } from "@/components/checkout";
import { PageHead } from "@/components/dash";
import { PropertyImage } from "@/components/property";
import { Badge, Confirm, Empty, Modal, Pagination, Tabs, useRun } from "@/components/ui";
import { deleteProperty, markPropertyClosed, renewProperty, setPublished } from "@/lib/actions";
import { formatDate, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { STATUS_LABELS } from "@/lib/labels";
import { scoped } from "@/lib/queries";
import { useApp } from "@/lib/store";
import type { ListingStatus, Plan, Property } from "@/lib/types";

const tone = (s: ListingStatus) => (s === "published" ? "moss" : s === "pending" ? "brass" : s === "rejected" || s === "expired" ? "rust" : s === "sold" || s === "rented" ? "sky" : "neutral") as "moss" | "brass" | "rust" | "sky" | "neutral";
const PAGE = 10;

export default function Page() {
  const { db, user } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const [tab, setTab] = useState<"all" | ListingStatus>("all");
  const [page, setPage] = useState(1);
  const [del, setDel] = useState<Property | null>(null);
  const [promo, setPromo] = useState<{ plan: Plan; id: string } | null>(null);
  const [promoPick, setPromoPick] = useState<Property | null>(null);
  if (!db || !user) return null;
  const all = scoped(db, user).properties.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const items = tab === "all" ? all : all.filter((p) => p.status === tab);
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const view = items.slice((Math.min(page, pages) - 1) * PAGE, Math.min(page, pages) * PAGE);
  const counts = (s: ListingStatus) => all.filter((p) => p.status === s).length;
  const tabs: { key: "all" | ListingStatus; label: string; count?: number }[] = [
    { key: "all", label: tr("Бүгд", "All"), count: all.length },
    { key: "published", label: STATUS_LABELS.published[lang], count: counts("published") },
    { key: "pending", label: STATUS_LABELS.pending[lang], count: counts("pending") },
    { key: "draft", label: STATUS_LABELS.draft[lang], count: counts("draft") },
    { key: "rejected", label: STATUS_LABELS.rejected[lang], count: counts("rejected") },
    { key: "unpublished", label: STATUS_LABELS.unpublished[lang], count: counts("unpublished") },
    { key: "expired", label: STATUS_LABELS.expired[lang], count: counts("expired") },
  ];
  const perf = (p: Property) => {
    const v = Object.values(p.daily);
    return { views: p.views, inq: db.inquiries.filter((q) => q.propertyId === p.id).length, fav: v.reduce((s, d) => s + d[2], 0) };
  };
  return (
    <>
      <PageHead title={tr("Миний зарууд", "My listings")} sub={tr("Зар нийтлэх, засах, гүйцэтгэлийг хянах", "Publish, edit and track performance")} actions={<Link href="/dashboard/agent/listings/new" className="btn-primary" data-testid="new-listing"><Plus size={16} />{tr("Шинэ зар", "New listing")}</Link>} />
      <Tabs value={tab} onChange={(t) => { setTab(t); setPage(1); }} items={tabs} />
      <div className="mt-4">
        {view.length === 0 ? <Empty title={tr("Зар олдсонгүй", "No listings here")} action={{ label: tr("Шинэ зар нэмэх", "Create a listing"), href: "/dashboard/agent/listings/new" }} /> : (
          <div className="card overflow-x-auto">
            <table className="table-x min-w-[860px]" data-testid="listing-table">
              <thead><tr><th>{tr("Зар", "Listing")}</th><th>{tr("Төлөв", "Status")}</th><th>{tr("Үнэ", "Price")}</th><th>{tr("Гүйцэтгэл", "Performance")}</th><th>{tr("Дуусах", "Expires")}</th><th /></tr></thead>
              <tbody>
                {view.map((p) => { const pf = perf(p); return (
                  <tr key={p.id} data-testid="listing-row">
                    <td><div className="flex items-center gap-3"><div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg"><PropertyImage src={p.images[0]} alt="" /></div><div className="min-w-0"><Link href={`/properties/${p.id}`} className="line-clamp-1 font-semibold hover:underline">{l(p.title)}</Link><div className="font-mono text-xs text-ink-4">{p.code}</div></div></div></td>
                    <td><div className="flex flex-col items-start gap-1"><Badge tone={tone(p.status)}>{STATUS_LABELS[p.status][lang]}</Badge>{p.promotion !== "none" && <Badge tone="brass">{p.promotion === "premium" ? tr("Премиум", "Premium") : tr("Онцлох", "Featured")}</Badge>}</div></td>
                    <td className="whitespace-nowrap font-semibold">{formatMNT(p.price)}</td>
                    <td><div className="flex gap-3 text-xs text-ink-3"><span className="flex items-center gap-1" title={tr("Үзсэн", "Views")}><Eye size={13} />{pf.views}</span><span className="flex items-center gap-1" title={tr("Лавлагаа", "Inquiries")}><MessageSquare size={13} />{pf.inq}</span><span className="flex items-center gap-1" title={tr("Хадгалсан", "Saved")}><Heart size={13} />{pf.fav}</span></div></td>
                    <td className="whitespace-nowrap text-xs text-ink-3">{formatDate(p.expiresAt, lang)}</td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Link href={`/dashboard/agent/listings/${p.id}`} className="btn-ghost btn-sm" data-testid="edit-listing">{tr("Засах", "Edit")}</Link>
                        {p.status === "published" && <button className="btn-ghost btn-sm" data-testid="unpublish" onClick={() => run(() => setPublished(p.id, false), tr("Нийтлэлээс хаслаа", "Unpublished"))}>{tr("Нийтлэлээс хасах", "Unpublish")}</button>}
                        {(p.status === "unpublished" || p.status === "draft" || p.status === "rejected") && <button className="btn-ghost btn-sm" data-testid="publish" onClick={() => run(() => setPublished(p.id, true), tr("Хянуулахаар илгээлээ эсвэл нийтэллээ", "Published or sent for review"))}>{tr("Нийтлэх", "Publish")}</button>}
                        {(p.status === "expired" || new Date(p.expiresAt).getTime() - Date.now() < 7 * 864e5) && p.status !== "sold" && p.status !== "rented" && <button className="btn-ghost btn-sm" onClick={() => run(() => renewProperty(p.id), tr("30 хоногоор сунгалаа", "Renewed for 30 days"))}>{tr("Сунгах", "Renew")}</button>}
                        {p.status === "published" && <button className="btn-ghost btn-sm" onClick={() => setPromoPick(p)} data-testid="promote">{tr("Онцлох", "Promote")}</button>}
                        {p.status === "published" && <button className="btn-ghost btn-sm" onClick={() => run(() => markPropertyClosed(p.id, p.listingType === "sale" ? "sold" : "rented"), tr("Хаагдсан гэж тэмдэглэлээ", "Marked as closed"))}>{p.listingType === "sale" ? tr("Зарагдсан", "Mark sold") : tr("Түрээслэгдсэн", "Mark rented")}</button>}
                        {(p.status === "sold" || p.status === "rented") && <button className="btn-ghost btn-sm" onClick={() => run(() => markPropertyClosed(p.id, "published"), tr("Дахин нээлээ", "Reopened"))}>{tr("Дахин нээх", "Reopen")}</button>}
                        <button className="btn-danger btn-sm" data-testid="delete-listing" onClick={() => setDel(p)}>{tr("Устгах", "Delete")}</button>
                      </div>
                    </td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={Math.min(page, pages)} pages={pages} onPage={setPage} />
      </div>
      <Confirm open={!!del} onClose={() => setDel(null)} danger title={tr("Зар устгах уу?", "Delete this listing?")} text={del ? `${del.code}: ${l(del.title)}. ${tr("Энэ үйлдлийг буцаах боломжгүй.", "This cannot be undone.")}` : ""} confirmLabel={tr("Устгах", "Delete")} onConfirm={() => del && run(() => deleteProperty(del.id), tr("Устгалаа", "Deleted"))} />
      <Modal2 open={!!promoPick} onClose={() => setPromoPick(null)} onPick={(pl) => { if (promoPick) setPromo({ plan: pl, id: promoPick.id }); setPromoPick(null); }} />
      <CheckoutModal plan={promo?.plan ?? null} propertyId={promo?.id} open={!!promo} onClose={() => setPromo(null)} />
    </>
  );
}

function Modal2({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (p: Plan) => void }) {
  const { db } = useApp();
  const { tr, l } = useLang();
  if (!db) return null;
  return (
    <Modal open={open} onClose={onClose} title={tr("Зар сурталчлах", "Promote this listing")}>
      <ul className="space-y-2">
        {db.plans.filter((p) => p.audience === "listing").map((p) => (
          <li key={p.id}><button onClick={() => onPick(p)} data-testid={`promo-${p.id}`} className="flex w-full items-center justify-between rounded-xl border border-paper-3 p-3.5 text-left hover:border-sky"><span><span className="block font-semibold">{l(p.name)}</span><span className="text-xs text-ink-3">{p.perks.mn.length ? (tr(p.perks.mn.join(", "), p.perks.en.join(", "))) : ""}</span></span><span className="font-display text-xl font-semibold">{formatMNT(p.price)}</span></button></li>
        ))}
      </ul>
    </Modal>
  );
}
