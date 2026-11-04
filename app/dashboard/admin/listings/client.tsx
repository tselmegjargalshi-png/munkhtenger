"use client";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHead } from "@/components/dash";
import { PropertyImage } from "@/components/property";
import { Badge, Confirm, Empty, Field, Modal, Pagination, Tabs, useRun } from "@/components/ui";
import { adminSetPropertyFlags, approveProperty, deleteProperty, rejectProperty } from "@/lib/actions";
import { formatDate, formatMNT } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { STATUS_LABELS } from "@/lib/labels";
import { useApp } from "@/lib/store";
import type { ListingStatus, Property } from "@/lib/types";

const PAGE = 12;
const tone = (s: ListingStatus) => (s === "published" ? "moss" : s === "pending" ? "brass" : s === "rejected" || s === "expired" ? "rust" : s === "sold" || s === "rented" ? "sky" : "neutral") as "moss" | "brass" | "rust" | "sky" | "neutral";

export function AdminListings() {
  const { db } = useApp();
  const { tr, lang, l } = useLang();
  const run = useRun();
  const router = useRouter();
  const sp = useSearchParams();
  const status = (sp.get("status") || "all") as "all" | ListingStatus;
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [reject, setReject] = useState<Property | null>(null);
  const [reason, setReason] = useState("");
  const [del, setDel] = useState<Property | null>(null);
  if (!db) return null;
  const all = [...db.properties].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const items = all.filter((p) => (status === "all" || p.status === status) && (!q || `${p.code} ${p.title.mn} ${p.title.en}`.toLowerCase().includes(q.toLowerCase())));
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const view = items.slice((Math.min(page, pages) - 1) * PAGE, Math.min(page, pages) * PAGE);
  const cnt = (s: ListingStatus) => all.filter((p) => p.status === s).length;
  const setStatus = (s: string) => { setPage(1); router.replace(s === "all" ? "/dashboard/admin/listings" : `/dashboard/admin/listings?status=${s}`); };
  return (
    <>
      <PageHead title={tr("Зар удирдах", "Manage listings")} sub={`${all.length} ${tr("зар", "properties")}`} />
      <div className="mb-3 flex flex-wrap items-center gap-3"><input className="input !w-64" placeholder={tr("Код, гарчиг", "Code or title")} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} data-testid="admin-listing-search" /></div>
      <Tabs value={status} onChange={setStatus} items={[{ key: "all", label: tr("Бүгд", "All"), count: all.length }, { key: "pending", label: STATUS_LABELS.pending[lang], count: cnt("pending") }, { key: "published", label: STATUS_LABELS.published[lang], count: cnt("published") }, { key: "rejected", label: STATUS_LABELS.rejected[lang], count: cnt("rejected") }, { key: "draft", label: STATUS_LABELS.draft[lang], count: cnt("draft") }, { key: "sold", label: STATUS_LABELS.sold[lang], count: cnt("sold") }, { key: "rented", label: STATUS_LABELS.rented[lang], count: cnt("rented") }, { key: "expired", label: STATUS_LABELS.expired[lang], count: cnt("expired") }]} />
      <div className="mt-4">
        {view.length === 0 ? <Empty title={tr("Зар олдсонгүй", "No listings")} /> : (
          <div className="card overflow-x-auto"><table className="table-x min-w-[900px]" data-testid="admin-listing-table"><thead><tr><th>{tr("Зар", "Listing")}</th><th>{tr("Агент", "Agent")}</th><th>{tr("Үнэ", "Price")}</th><th>{tr("Төлөв", "Status")}</th><th>{tr("Дуусах", "Expires")}</th><th /></tr></thead><tbody>
            {view.map((p) => { const a = db.users.find((u) => u.id === p.agentId); return (
              <tr key={p.id} data-testid="admin-listing-row" data-status={p.status}>
                <td><div className="flex items-center gap-3"><div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg"><PropertyImage src={p.images[0]} alt="" /></div><div className="min-w-0"><Link href={`/properties/${p.id}`} className="line-clamp-1 font-semibold hover:underline">{l(p.title)}</Link><div className="font-mono text-xs text-ink-4">{p.code}{p.demo && ` · ${tr("демо", "demo")}`}</div></div></div></td>
                <td className="text-sm">{a?.name}</td><td className="whitespace-nowrap font-semibold">{formatMNT(p.price)}</td>
                <td><div className="flex flex-col items-start gap-1"><Badge tone={tone(p.status)}>{STATUS_LABELS[p.status][lang]}</Badge>{p.verified && <span className="flex items-center gap-1 text-[11px] text-sky"><BadgeCheck size={12} />{tr("Баталгаажсан", "Verified")}</span>}</div></td>
                <td className="whitespace-nowrap text-xs text-ink-3">{formatDate(p.expiresAt, lang)}</td>
                <td><div className="flex flex-wrap justify-end gap-1.5">
                  {p.status === "pending" && <><button className="btn-primary btn-sm" data-testid="approve" onClick={() => run(() => approveProperty(p.id), tr("Зар батлагдаж нийтлэгдлээ", "Listing approved and published"))}>{tr("Батлах", "Approve")}</button><button className="btn-danger btn-sm" data-testid="reject" onClick={() => { setReject(p); setReason(""); }}>{tr("Татгалзах", "Reject")}</button></>}
                  {p.status === "published" && <button className="btn-ghost btn-sm" onClick={() => run(() => adminSetPropertyFlags(p.id, { verified: !p.verified }))}>{p.verified ? tr("Баталгаа хасах", "Unverify") : tr("Баталгаажуулах", "Verify")}</button>}
                  {p.status === "published" && <select className="input !w-auto !py-1.5 text-xs" aria-label={tr("Сурталчилгаа", "Promotion")} value={p.promotion} onChange={(e) => run(() => adminSetPropertyFlags(p.id, { promotion: e.target.value as Property["promotion"], promotedDays: 14 }), tr("Шинэчлэгдлээ", "Updated"))}><option value="none">{tr("Энгийн", "Standard")}</option><option value="featured">{tr("Онцлох", "Featured")}</option><option value="premium">{tr("Премиум", "Premium")}</option></select>}
                  <button className="btn-danger btn-sm" onClick={() => setDel(p)}>{tr("Устгах", "Delete")}</button>
                </div></td>
              </tr>); })}
          </tbody></table></div>
        )}
        <Pagination page={Math.min(page, pages)} pages={pages} onPage={setPage} />
      </div>
      <Modal open={!!reject} onClose={() => setReject(null)} title={tr("Зар татгалзах", "Reject listing")}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => { rejectProperty(reject!.id, reason); setReject(null); }, tr("Татгалзлаа. Агентад мэдэгдэл очлоо.", "Rejected. The agent was notified.")); }}>
          <p className="text-sm text-ink-3">{reject && `${reject.code}: ${l(reject.title)}`}</p>
          <Field label={tr("Шалтгаан", "Reason")}><textarea className="input min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} data-testid="reject-reason" /></Field>
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setReject(null)}>{tr("Болих", "Cancel")}</button><button className="btn-danger" data-testid="reject-submit">{tr("Татгалзах", "Reject")}</button></div>
        </form>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} danger title={tr("Зар устгах уу?", "Delete listing?")} text={del ? del.code : ""} onConfirm={() => del && run(() => deleteProperty(del.id), tr("Устгалаа", "Deleted"))} />
    </>
  );
}
